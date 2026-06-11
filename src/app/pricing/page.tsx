import type { Metadata } from "next";
import Link from "next/link";
import { Layers, CheckCircle2, ArrowRight } from "lucide-react";
import { getBundles } from "@/lib/payments/checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNpr } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Buy a single course or save with a per-track bundle. Pay in NPR with eSewa or Khalti.",
};

// Reads bundles from the DB on every request; never prerender at build.
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const bundles = await getBundles();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Simple pricing, in NPR
        </h1>
        <p className="mt-3 text-ink-soft">
          Start free, buy any course on its own, or save with a per-track bundle. Pay securely with
          eSewa or Khalti.
        </p>
      </header>

      {/* Free tier */}
      <div className="mx-auto mt-10 max-w-2xl rounded-card border border-line bg-paper-2 p-6 text-center">
        <Badge variant="teal">Free tier</Badge>
        <p className="mt-3 text-ink">
          Sample lessons in every course and{" "}
          <strong className="font-semibold">one full mock test per track</strong> — no card needed.
        </p>
        <Link href="/auth/signup" className="mt-4 inline-block">
          <Button variant="outline">
            Create a free account <ArrowRight />
          </Button>
        </Link>
      </div>

      {/* Bundles */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold text-ink">Track bundles</h2>
        <p className="mt-2 text-ink-soft">
          Every course in a track, together at a discount.
        </p>

        {bundles.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">Bundles are being prepared. Check back soon.</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="deep">{bundle.track?.short ?? "Bundle"}</Badge>
                  <Badge variant="marigold">Bundle</Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{bundle.title}</h3>
                {bundle.description && (
                  <p className="mt-1 text-sm text-ink-soft">{bundle.description}</p>
                )}

                <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-soft">
                  <Layers className="size-4" /> {bundle._count.courses} courses included
                </p>

                <div className="mt-5 font-display text-3xl font-semibold text-ink">
                  {formatNpr(bundle.priceNpr)}
                </div>

                <Link href={`/checkout?bundle=${bundle.slug}`} className="mt-5">
                  <Button className="w-full">Get this bundle</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Per-course note */}
      <section className="mt-14 rounded-card border border-line bg-paper p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Prefer one course?</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {["Buy any single course outright", "Lifetime access to its lessons", "Pay in NPR — eSewa or Khalti"].map(
                (p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-teal" /> {p}
                  </li>
                ),
              )}
            </ul>
          </div>
          <Link href="/courses">
            <Button variant="outline" size="lg">
              Browse courses <ArrowRight />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
