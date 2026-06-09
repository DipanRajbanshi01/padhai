import Link from "next/link";
import { site } from "@/lib/site";
import { TRACKS } from "@/lib/tracks";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold text-ink">{site.name}</span>
            <span className="font-devanagari text-lg text-crimson">{site.nameNe}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-soft">{site.description}</p>
        </div>

        <FooterCol title="Tracks">
          {TRACKS.slice(0, 5).map((t) => (
            <FooterLink key={t.code} href={`/courses?track=${t.code}`}>
              {t.short}
            </FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="Learn">
          <FooterLink href="/courses">All courses</FooterLink>
          <FooterLink href="/mock-tests">Mock tests</FooterLink>
          <FooterLink href="/papers">Past papers</FooterLink>
          <FooterLink href="/pricing">Pricing</FooterLink>
        </FooterCol>

        <FooterCol title="Company">
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
          <FooterLink href="/auth/login">Log in</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-soft sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name} {site.nameNe}. Made for Nepali students.
          </p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-ink">{title}</h4>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-ink-soft transition-colors hover:text-crimson">
        {children}
      </Link>
    </li>
  );
}
