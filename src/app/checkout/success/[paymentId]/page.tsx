import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatNpr } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment successful" };

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { course: true, bundle: true },
  });
  if (!payment || payment.userId !== profile.id) notFound();

  // If the callback hasn't landed yet, the receipt may still say pending.
  const paid = payment.status === "PAID";
  const productName = payment.course?.title ?? payment.bundle?.title ?? "Your purchase";
  const learnHref = payment.course ? `/learn/${payment.course.slug}` : "/dashboard";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-pill bg-teal/10 text-teal">
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
        {paid ? "Payment successful" : "Payment received"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {paid
          ? "You now have full access. Happy learning!"
          : "We're confirming your payment — access unlocks the moment it clears."}
      </p>

      {/* Receipt */}
      <div className="mt-8 rounded-card border border-line bg-paper p-6 text-left shadow-soft">
        <Row label="Item" value={productName} />
        <Row label="Amount" value={formatNpr(payment.amountNpr)} />
        <Row label="Gateway" value={titleCase(payment.gateway)} />
        <Row label="Status" value={titleCase(payment.status)} />
        {payment.gatewayRef && <Row label="Reference" value={payment.gatewayRef} mono />}
        <Row label="Date" value={(payment.paidAt ?? payment.createdAt).toLocaleString()} />
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href={learnHref}>
          <Button size="lg">{payment.course ? "Start learning" : "Go to dashboard"}</Button>
        </Link>
        <Link href="/courses">
          <Button size="lg" variant="outline">
            Browse more
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className={`text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
