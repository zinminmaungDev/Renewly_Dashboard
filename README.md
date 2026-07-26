# Renewly — subscription desk

An admin dashboard for reselling shared subscription accounts. It tracks who
bought what, when it expires, and what you've earned — with the expiring
accounts always pushed to the front.

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · shadcn/ui ·
Supabase · Vercel.

---

## What's in it

| Area | What it does |
|---|---|
| **Auth** | Supabase email + password, cookie sessions refreshed in middleware, admin allow-list table so a stray signup can't get in |
| **Overview** | Total customers, active, expired, revenue (this month / all time), expiring today, expiring in 7 days |
| **Customers** | Add, edit, delete, search, filter by product, filter by expiry, four sort orders — all filters live in the URL |
| **Customer card** | Name, product, login email, password (encrypted, reveal on demand), source, purchase date, expiry, days remaining, status badge, edit/delete/renew |
| **Products** | ExpressVPN, Spotify Premium, Zoom Pro, Netflix, Canva Pro, ChatGPT Plus, Claude Max, plus your own |
| **Orders** | Automatic order on signup, renewals that extend rather than reset, paid/pending/refunded states, full payment history |
| **Notifications** | Grouped at today / 3 days / 7 days, in the bell and on the overview |
| **Reports** | Monthly revenue chart, product sales table, active users, renewal share |
| **UI** | Glassmorphism, dark mode by default, responsive to 360px, staggered entrances, reduced-motion respected |

---

## Design notes

The product's real job is answering *"what runs out soon?"*, so the whole
visual system is a **lifecycle signal scale** rather than a generic brand
palette. Five states — `fresh · steady · soon · today · lapsed` — map to five
colour tokens defined once in `globals.css` and consumed by every badge, meter,
chart and stat card. Nothing invents its own colour.

The signature element is the **drain meter** on each customer card: a bar that
shows time *remaining*, so a nearly-empty bar reads as urgency before you read
a single number. Countdowns, prices and dates are all set in JetBrains Mono
with tabular figures (the `.numeric` class), so columns of numbers line up and
a changing countdown doesn't make the layout twitch.

Type: Outfit for display, Inter for body, JetBrains Mono for data.

---

## Folder structure

```
renewly/
├── middleware.ts                  # session refresh + route gate
├── supabase/schema.sql            # tables, views, RLS, seed data
└── src/
    ├── app/
    │   ├── layout.tsx             # fonts, theme provider, toaster
    │   ├── login/page.tsx
    │   ├── auth/callback/route.ts # email-link exchange
    │   └── (dashboard)/           # authenticated group
    │       ├── layout.tsx         # shell + notification feed
    │       ├── dashboard/         # overview
    │       ├── customers/
    │       ├── orders/
    │       └── reports/
    ├── components/
    │   ├── ui/                    # shadcn primitives
    │   ├── layout/                # shell, sidebar, brand, theme
    │   ├── shared/                # status badge, drain meter, empty state
    │   ├── dashboard/             # stat card, charts, expiry queue
    │   ├── customers/             # card, filters, form/renew/delete dialogs
    │   └── orders/
    ├── lib/
    │   ├── lifecycle.ts           # ← all expiry logic lives here, only here
    │   ├── crypto.ts              # AES-256-GCM credential vault
    │   ├── validations.ts         # zod schemas
    │   ├── supabase/              # browser / server / middleware clients
    │   └── types.ts
    ├── server/
    │   ├── queries.ts             # read paths
    │   └── actions/               # write paths (customers, orders, auth)
    └── hooks/
```

Two rules keep it navigable: **reads go in `server/queries.ts`, writes go in
`server/actions/`**, and **every date threshold lives in `lib/lifecycle.ts`** so
a badge, a filter and a notification can never disagree about what "expiring
soon" means.

---

## Local setup

**1. Install**

```bash
npm install
cp .env.example .env.local
```

**2. Create a Supabase project**, then open SQL Editor and run the whole of
`supabase/schema.sql`. It's idempotent — safe to re-run.

**3. Fill `.env.local`** from Supabase → Project Settings → API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CREDENTIAL_ENCRYPTION_KEY=   # npm run keygen
```

**4. Create your admin.** Supabase → Authentication → Users → Add user (tick
auto-confirm). Copy the UUID, then in SQL Editor:

```sql
insert into public.admins (id, email, full_name)
values ('paste-uuid-here', 'you@example.com', 'Your Name');
```

Signing in requires *both* a valid Supabase user and a row here. That's the
whole admin model.

**5. Run**

```bash
npm run dev
```

---

## About the stored passwords

This kind of business needs to read account passwords back, so they can't be
hashed — they're encrypted with AES-256-GCM (`src/lib/crypto.ts`), with a
random IV per record and the key held only in an env var. The database never
sees plaintext, and the list endpoint never sends credentials to the browser:
clicking reveal fetches one password, for one record, through an
auth-checked server action, and it auto-hides after 20 seconds.

Worth being clear about the limits. This protects you against a **leaked
database dump**. It does not protect you against a **compromised server**,
because the server necessarily holds the key. Practical implications:

- Treat `CREDENTIAL_ENCRYPTION_KEY` like a production secret. Back it up
  somewhere separate — lose it and every stored password is unrecoverable.
- Rotating the key requires re-encrypting existing rows; there's no migration
  script included, so plan it before you have thousands of records.
- Reselling shared accounts breaks the terms of service of most of the seeded
  products. That's a business decision, not a technical one, but the software
  can't make it safe for you.

---

## Deploying to Vercel

**1. Push to GitHub.**

```bash
git init && git add . && git commit -m "Renewly"
git remote add origin git@github.com:you/renewly.git
git push -u origin main
```

**2. Import into Vercel.** vercel.com → Add New → Project → pick the repo.
Framework preset detects Next.js; leave build command and output directory
alone.

**3. Add environment variables** before the first deploy — Settings →
Environment Variables. Add each to Production, Preview and Development:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `CREDENTIAL_ENCRYPTION_KEY` | the same key as local, or every existing password becomes unreadable |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` unless you add code that needs it —
it bypasses row-level security entirely.

**4. Deploy**, then point Supabase at the deployed URL: Authentication → URL
Configuration → set Site URL to your Vercel domain and add
`https://your-app.vercel.app/auth/callback` to Redirect URLs. Skip this and
password-reset links will bounce back to localhost.

**5. Custom domain** (optional): Settings → Domains, add it, follow the DNS
records, then update Site URL in Supabase to match.

**Redeploying after an env change:** Vercel bakes env vars in at build time, so
changing one needs a fresh deploy — Deployments → ⋯ → Redeploy.

**A note on `middleware.ts`:** it runs on the Edge runtime on every matched
request and calls `supabase.auth.getUser()`, which is a network round trip.
That's deliberate — `getUser()` validates the JWT against the auth server,
where `getSession()` only reads the cookie and will happily accept a forged
one. If you later find it too chatty, narrow the matcher rather than switching
to `getSession()`.

---

## Things worth doing next

- **Email or WhatsApp reminders.** The grouping logic in `getExpiryFeed()` is
  already the right shape; add a Vercel Cron route that calls it daily and
  sends the "today" and "3 days" groups.
- **Audit log.** Every credential reveal goes through one server action, so
  logging who revealed what is a five-line change in `revealPassword`.
- **Pagination.** `getCustomers` loads the full matching set. Fine to a few
  thousand rows; past that, add `.range()` and an infinite scroll.
- **Multi-admin.** The `admins` table already supports several rows; add a
  `role` column if you want read-only staff.
- **Tests.** `lib/lifecycle.ts` is pure and is where correctness actually
  matters — start there.
