import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildEsewaForm } from "@/lib/payments/esewa";
import { EsewaAutoForm } from "@/components/payments/esewa-auto-form";

export const metadata = { title: "Redirecting to eSewa" };

export default async function EsewaHandoffPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== profile.id) notFound();
  if (payment.status === "PAID") redirect(`/checkout/success/${payment.id}`);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { action, fields } = buildEsewaForm({
    amountNpr: payment.amountNpr,
    transactionUuid: payment.id, // unique, alphanumeric (cuid)
    successUrl: `${site}/api/payments/esewa/callback`,
    failureUrl: `${site}/checkout/failed/${payment.id}`,
  });

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
        <EsewaAutoForm action={action} fields={fields} />
      </div>
    </div>
  );
}
