import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { XCircle } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Payment failed" };

export default async function PaymentFailedPage({
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

  const retryHref = payment.course
    ? `/checkout?course=${payment.course.slug}`
    : payment.bundle
      ? `/checkout?bundle=${payment.bundle.slug}`
      : "/pricing";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-pill bg-crimson/10 text-crimson">
        <XCircle className="size-9" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Payment not completed</h1>
      <p className="mt-2 text-ink-soft">
        Your payment didn&apos;t go through, so you haven&apos;t been charged for access. You can try
        again with eSewa or Khalti.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <Link href={retryHref}>
          <Button size="lg">Try again</Button>
        </Link>
        <Link href="/pricing">
          <Button size="lg" variant="outline">
            Back to pricing
          </Button>
        </Link>
      </div>
    </div>
  );
}
