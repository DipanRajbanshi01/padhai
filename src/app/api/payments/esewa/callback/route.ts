import { NextResponse } from "next/server";
import { decodeEsewaData, verifyEsewaCallback } from "@/lib/payments/esewa";
import { fulfillPayment, failPayment } from "@/lib/payments/checkout";
import { db } from "@/lib/db";

/**
 * eSewa success_url callback. eSewa redirects here (GET) with a base64 `data`
 * payload. We re-sign it, confirm the amount matches the order, then fulfil.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const dataParam = searchParams.get("data");
  if (!dataParam) return NextResponse.redirect(`${origin}/pricing`);

  const data = decodeEsewaData(dataParam);
  if (!data) return NextResponse.redirect(`${origin}/pricing`);

  const paymentId = data.transaction_uuid;
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.redirect(`${origin}/pricing`);

  const amountMatches = Math.round(Number(data.total_amount)) === payment.amountNpr;

  if (verifyEsewaCallback(data) && amountMatches) {
    await fulfillPayment(paymentId, data);
    return NextResponse.redirect(`${origin}/checkout/success/${paymentId}`);
  }

  await failPayment(paymentId, data);
  return NextResponse.redirect(`${origin}/checkout/failed/${paymentId}`);
}
