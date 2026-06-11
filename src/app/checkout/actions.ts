"use server";

import { redirect } from "next/navigation";
import { PaymentGateway, PaymentStatus, ProductType } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { resolveProduct, type ProductRef } from "@/lib/payments/checkout";
import { initiateKhalti } from "@/lib/payments/khalti";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Begin checkout. Creates a PENDING payment, then hands off to the chosen
 * gateway: eSewa via a signed browser form, Khalti via a server-initiated
 * redirect to its hosted page.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const gateway = String(formData.get("gateway") ?? "");
  const type = String(formData.get("type") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const ref: ProductRef =
    type === "bundle" ? { type: "bundle", slug } : { type: "course", slug };
  const backTo = `/checkout?${type === "bundle" ? "bundle" : "course"}=${encodeURIComponent(slug)}`;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent(backTo)}`);

  const product = await resolveProduct(ref);
  if (!product) redirect("/pricing");
  if (product.isFree || product.amountNpr <= 0) {
    redirect(product.courseSlug ? `/courses/${product.courseSlug}` : "/pricing");
  }

  const payment = await db.payment.create({
    data: {
      userId: profile.id,
      productType: product.kind,
      courseId: product.kind === ProductType.COURSE ? product.id : null,
      bundleId: product.kind === ProductType.BUNDLE ? product.id : null,
      gateway: gateway === "khalti" ? PaymentGateway.KHALTI : PaymentGateway.ESEWA,
      amountNpr: product.amountNpr,
      status: PaymentStatus.PENDING,
    },
  });

  if (gateway === "khalti") {
    let paymentUrl: string;
    try {
      const site = siteUrl();
      const init = await initiateKhalti({
        amountNpr: product.amountNpr,
        purchaseOrderId: payment.id,
        purchaseOrderName: product.name,
        returnUrl: `${site}/api/payments/khalti/callback`,
        websiteUrl: site,
        customer: { name: profile.name ?? undefined, email: profile.email ?? undefined },
      });
      await db.payment.update({ where: { id: payment.id }, data: { gatewayRef: init.pidx } });
      paymentUrl = init.paymentUrl;
    } catch (e) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, raw: { error: String(e) } },
      });
      redirect(`${backTo}&error=${encodeURIComponent("Khalti is unavailable right now — try eSewa or add a valid KHALTI_SECRET_KEY.")}`);
    }
    redirect(paymentUrl); // hosted Khalti page
  }

  // eSewa: hand off to the signed auto-submitting form.
  redirect(`/checkout/esewa/${payment.id}`);
}
