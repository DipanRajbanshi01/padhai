import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/mock-tests", label: "Mock Tests" },
  { href: "/papers", label: "Past Papers" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <BrandWordmark />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
