import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, BookOpen, Layers, AlertCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { resolveProduct, type ProductRef } from "@/lib/payments/checkout";
import { db } from "@/lib/db";
import { startCheckout } from "@/app/checkout/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Badge } from "@/components/ui/badge";
import { formatNpr } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; bundle?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const ref: ProductRef | null = sp.bundle
    ? { type: "bundle", slug: sp.bundle }
    : sp.course
      ? { type: "course", slug: sp.course }
      : null;
  if (!ref) redirect("/pricing");

  const product = await resolveProduct(ref);
  if (!product) redirect("/pricing");

  const backTo = `/checkout?${ref.type}=${ref.slug}`;
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent(backTo)}`);

  // Free course → no checkout needed.
  if (product.isFree && product.courseSlug) redirect(`/courses/${product.courseSlug}`);

  // Already own this course? Go learn.
  if (product.kind === "COURSE") {
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: profile.id, courseId: product.id } },
    });
    if (existing) redirect(`/learn/${product.courseSlug}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Checkout</h1>
      <p className="mt-2 text-ink-soft">Secure payment in NPR. You&apos;ll get access immediately.</p>

      {sp.error && (
        <p className="mt-6 flex items-start gap-2 rounded-card bg-crimson/10 px-4 py-3 text-sm text-crimson-deep">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {sp.error}
        </p>
      )}

      {/* Order summary */}
      <div className="mt-6 rounded-card border border-line bg-paper p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="deep">{product.trackShort}</Badge>
              <Badge variant={product.kind === "BUNDLE" ? "marigold" : "neutral"}>
                {product.kind === "BUNDLE" ? "Bundle" : "Course"}
              </Badge>
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">{product.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              {product.kind === "BUNDLE" ? (
                <>
                  <Layers className="size-4" /> {product.courseCount} courses included
                </>
              ) : (
                <>
                  <BookOpen className="size-4" /> Full course access
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold text-ink">
              {formatNpr(product.amountNpr)}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="font-medium text-ink">Total</span>
          <span className="font-display text-xl font-semibold text-crimson">
            {formatNpr(product.amountNpr)}
          </span>
        </div>
      </div>

      {/* Gateways */}
      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-ink">Choose a payment method</p>

        <GatewayForm type={ref.type} slug={ref.slug} gateway="esewa" label="Pay with eSewa" accent="#60BB46" />
        <GatewayForm type={ref.type} slug={ref.slug} gateway="khalti" label="Pay with Khalti" accent="#5C2D91" />
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-soft">
        <ShieldCheck className="size-4 text-teal" /> Every payment is verified on our server before
        access is granted.
      </p>

      <p className="mt-4 text-center text-sm">
        <Link href="/pricing" className="text-ink-soft hover:text-crimson">
          ← Back to pricing
        </Link>
      </p>
    </div>
  );
}

function GatewayForm({
  type,
  slug,
  gateway,
  label,
  accent,
}: {
  type: string;
  slug: string;
  gateway: string;
  label: string;
  accent: string;
}) {
  return (
    <form action={startCheckout}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="gateway" value={gateway} />
      <SubmitButton
        variant="outline"
        size="lg"
        className="w-full justify-start gap-3"
        style={{ borderColor: accent }}
      >
        <span className="size-3 rounded-full" style={{ backgroundColor: accent }} />
        {label}
      </SubmitButton>
    </form>
  );
}
