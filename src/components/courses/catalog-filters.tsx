"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { TRACKS } from "@/lib/tracks";
import { cn } from "@/lib/utils";

const PRICES = [
  { key: "", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
] as const;

export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeTrack = params.get("track") ?? "";
  const activePrice = params.get("price") ?? "";
  const activeQ = params.get("q") ?? "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      // Changing the track invalidates a subject sub-filter.
      if (key === "track") next.delete("subject");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q");
    setParam("q", typeof value === "string" ? value.trim() : "");
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSearch} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        <input
          name="q"
          defaultValue={activeQ}
          placeholder="Search courses and lessons…"
          className="h-11 w-full rounded-pill border border-line bg-paper pl-11 pr-4 text-sm text-ink shadow-soft placeholder:text-ink-soft/60 focus-visible:border-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/30"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={!activeTrack} onClick={() => setParam("track", "")}>
          All tracks
        </Chip>
        {TRACKS.map((t) => (
          <Chip key={t.code} active={activeTrack === t.code} onClick={() => setParam("track", t.code)}>
            {t.short}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-soft">Price:</span>
        {PRICES.map((p) => (
          <Chip key={p.key} active={activePrice === p.key} onClick={() => setParam("price", p.key)}>
            {p.label}
          </Chip>
        ))}

        {(activeTrack || activePrice || activeQ) && (
          <button
            onClick={() => router.push(pathname)}
            className="ml-1 inline-flex items-center gap-1 text-sm text-crimson hover:underline"
          >
            <X className="size-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-crimson bg-crimson text-paper"
          : "border-line bg-paper text-ink-soft hover:border-crimson/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
