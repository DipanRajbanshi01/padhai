import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/mock-tests", label: "Mock Tests" },
  { href: "/papers", label: "Past Papers" },
  { href: "/pricing", label: "Pricing" },
];

export async function SiteHeader() {
  const user = await getAuthUser();

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
          {user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard /> Dashboard
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit" aria-label="Log out">
                  <LogOut />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
