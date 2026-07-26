"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductDot } from "@/components/shared/product-dot";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Product } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring in 7 days" },
  { value: "today", label: "Expires today" },
  { value: "lapsed", label: "Expired" },
];

const SORT_OPTIONS = [
  { value: "expiring", label: "Expiring first" },
  { value: "recent", label: "Recently added" },
  { value: "name", label: "Name A–Z" },
  { value: "value", label: "Highest value" },
];

/**
 * Filters live in the URL, not in React state: a filtered view is a link
 * the admin can bookmark, share or reload without losing their place.
 */
export function CustomerFilters({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const debounced = useDebouncedValue(query, 300);
  const [isPending, startTransition] = React.useTransition();

  const status = params.get("status") ?? "all";
  const product = params.get("product") ?? "all";
  const sort = params.get("sort") ?? "expiring";
  const hasFilters =
    Boolean(params.get("q")) || status !== "all" || product !== "all";

  const push = React.useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);

      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  // Keep the URL in step with the debounced search box.
  React.useEffect(() => {
    if (debounced === (params.get("q") ?? "")) return;
    push("q", debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  function clearAll() {
    setQuery("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-xl p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, account email or source"
          aria-label="Search customers"
          className="border-transparent bg-transparent pl-9 shadow-none focus-visible:border-input"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
        <Select value={product} onValueChange={(v) => push("product", v)}>
          <SelectTrigger className="lg:w-44" aria-label="Filter by product">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <ProductDot color={p.color} size="sm" />
                  {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => push("status", v)}>
          <SelectTrigger className="lg:w-44" aria-label="Filter by expiry">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => push("sort", v)}>
          <SelectTrigger className="lg:w-40" aria-label="Sort customers">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="col-span-2 sm:col-span-1"
          >
            Clear
          </Button>
        )}
      </div>

      <span
        aria-live="polite"
        className="sr-only"
      >
        {isPending ? "Updating results" : "Results updated"}
      </span>
    </div>
  );
}
