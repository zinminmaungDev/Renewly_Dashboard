-- ============================================================
-- Renewly — schema
-- Run in Supabase Studio → SQL Editor, or `supabase db push`.
-- Safe to re-run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────
do $$ begin
  create type order_kind as enum ('new', 'renewal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_state as enum ('paid', 'pending', 'refunded');
exception when duplicate_object then null; end $$;

-- ── Admin allow-list ────────────────────────────────────────
-- Auth is handled by Supabase Auth. This table decides who is
-- allowed past the login screen, so a stray signup can't get in.
create table if not exists public.admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

-- ── Products ────────────────────────────────────────────────
-- Seeded with the catalogue, but fully user-extendable ("Custom products").
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  slug         text not null unique,
  color        text not null default '#6366f1',
  default_price numeric(10,2) not null default 0,
  default_term_days int not null default 30,
  is_archived  boolean not null default false,
  created_at   timestamptz not null default now()
);

insert into public.products (name, slug, color, default_price, default_term_days) values
  ('ExpressVPN',      'expressvpn',      '#da3940',  9.99,  30),
  ('Spotify Premium', 'spotify-premium', '#1db954', 10.99,  30),
  ('Zoom Pro',        'zoom-pro',        '#2d8cff', 14.99,  30),
  ('Netflix',         'netflix',         '#e50914', 15.49,  30),
  ('Canva Pro',       'canva-pro',       '#00c4cc', 12.99,  30),
  ('ChatGPT Plus',    'chatgpt-plus',    '#10a37f', 20.00,  30),
  ('Claude Max',      'claude-max',      '#d97757', 100.00, 30)
on conflict (slug) do nothing;

-- ── Customers ───────────────────────────────────────────────
-- credential_password stores AES-256-GCM ciphertext produced by the app
-- (src/lib/crypto.ts). Postgres never sees the plaintext or the key.
create table if not exists public.customers (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  product_id          uuid not null references public.products(id) on delete restrict,
  credential_email    text not null,
  credential_password text,
  source              text,
  notes               text,
  price               numeric(10,2) not null default 0,
  purchase_date       date not null default current_date,
  expire_date         date not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint expire_after_purchase check (expire_date >= purchase_date)
);

create index if not exists customers_expire_date_idx on public.customers (expire_date);
create index if not exists customers_product_idx     on public.customers (product_id);
create index if not exists customers_search_idx      on public.customers
  using gin (to_tsvector('simple', full_name || ' ' || credential_email || ' ' || coalesce(source, '')));

-- ── Orders / payment history ────────────────────────────────
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  kind         order_kind not null default 'new',
  amount       numeric(10,2) not null default 0,
  status       payment_state not null default 'paid',
  term_days    int not null default 30,
  period_start date not null default current_date,
  period_end   date not null,
  method       text,
  reference    text,
  created_at   timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_created_idx  on public.orders (created_at desc);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

-- ── Reporting views ─────────────────────────────────────────
-- Revenue is derived from paid orders, never from the customer row,
-- so a renewal price change can't rewrite history.
create or replace view public.v_monthly_revenue as
  select
    date_trunc('month', o.created_at)::date as month,
    sum(o.amount)                            as revenue,
    count(*)                                 as order_count,
    count(*) filter (where o.kind = 'renewal') as renewal_count
  from public.orders o
  where o.status = 'paid'
  group by 1
  order by 1;

create or replace view public.v_product_sales as
  select
    p.id           as product_id,
    p.name         as product_name,
    p.color        as product_color,
    count(distinct c.id)                                       as customer_count,
    count(distinct c.id) filter (where c.expire_date >= current_date) as active_count,
    coalesce(sum(o.amount) filter (where o.status = 'paid'), 0) as revenue
  from public.products p
  left join public.customers c on c.product_id = p.id
  left join public.orders o    on o.customer_id = c.id
  group by p.id, p.name, p.color
  order by revenue desc;

-- ── Row level security ──────────────────────────────────────
-- Single-tenant admin panel: every table is admin-only, full stop.
alter table public.admins    enable row level security;
alter table public.products  enable row level security;
alter table public.customers enable row level security;
alter table public.orders    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['products', 'customers', 'orders'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (id = auth.uid());

-- ── Bootstrap your first admin ──────────────────────────────
-- 1. Authentication → Users → Add user (email + password, auto-confirm).
-- 2. Copy the new user's UUID and run:
--
-- insert into public.admins (id, email, full_name)
-- values ('<uuid>', 'you@example.com', 'Your Name');
