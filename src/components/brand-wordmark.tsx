import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** "Padhai पढाइ" wordmark. Name comes from the single site config constant. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-baseline gap-1.5", className)}
      aria-label={`${site.name} ${site.nameNe} home`}
    >
      <span className="font-display text-2xl font-semibold tracking-tight text-ink">
        {site.name}
      </span>
      <span className="font-devanagari text-xl text-crimson transition-colors group-hover:text-crimson-deep">
        {site.nameNe}
      </span>
    </Link>
  );
}
