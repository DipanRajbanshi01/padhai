import { NextResponse } from "next/server";
import { lookupKhalti } from "@/lib/payments/khalti";
import { fulfillPayment, failPayment } from "@/lib/payments/checkout";
import { db } from "@/lib/db";

/**
 * Khalti return_url callback. Khalti appends `pidx` + `purchase_order_id`
 * (our payment id). We never trust the query status — we look up the pidx
 * server-side and only fulfil on a confirmed "Completed" of the right amount.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const pidx = searchParams.get("pidx");
  const paymentId = searchParams.get("purchase_order_id");
  if (!pidx || !paymentId) return NextResponse.redirect(`${origin}/pricing`);

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.redirect(`${origin}/pricing`);

  try {
    const lookup = await lookupKhalti(pidx);
    const paidNpr = Math.round(Number(lookup.raw.total_amount ?? 0) / 100);
    const amountMatches = paidNpr === payment.amountNpr;

    if (lookup.status === "Completed" && amountMatches) {
      await fulfillPayment(paymentId, lookup.raw);
      return NextResponse.redirect(`${origin}/checkout/success/${paymentId}`);
    }
    await failPayment(paymentId, lookup.raw);
  } catch (e) {
    await failPayment(paymentId, { error: String(e) });
  }

  return NextResponse.redirect(`${origin}/checkout/failed/${paymentId}`);
}
