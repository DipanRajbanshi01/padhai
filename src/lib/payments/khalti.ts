/**
 * Khalti ePayment (KPG-2) integration. Server-to-server: initiate returns a
 * `pidx` + hosted `payment_url`; after the user returns we look up the pidx to
 * confirm "Completed". Amounts are in paisa (NPR × 100). Test base: dev.khalti.com.
 */
export function khaltiConfig() {
  return {
    secret: process.env.KHALTI_SECRET_KEY || "",
    baseUrl: process.env.KHALTI_BASE_URL || "https://dev.khalti.com",
  };
}

export interface KhaltiInitiateInput {
  amountNpr: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}

export async function initiateKhalti(
  input: KhaltiInitiateInput,
): Promise<{ pidx: string; paymentUrl: string }> {
  const cfg = khaltiConfig();
  if (!cfg.secret) throw new Error("KHALTI_SECRET_KEY is not configured");

  const res = await fetch(`${cfg.baseUrl}/api/v2/epayment/initiate/`, {
    method: "POST",
    headers: { Authorization: `Key ${cfg.secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      return_url: input.returnUrl,
      website_url: input.websiteUrl,
      amount: Math.round(input.amountNpr * 100),
      purchase_order_id: input.purchaseOrderId,
      purchase_order_name: input.purchaseOrderName,
      customer_info: input.customer
        ? { name: input.customer.name, email: input.customer.email, phone: input.customer.phone }
        : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Khalti initiate failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { pidx: string; payment_url: string };
  return { pidx: json.pidx, paymentUrl: json.payment_url };
}

export interface KhaltiLookup {
  status: string; // "Completed" | "Pending" | "Refunded" | ...
  raw: Record<string, unknown>;
}

export async function lookupKhalti(pidx: string): Promise<KhaltiLookup> {
  const cfg = khaltiConfig();
  if (!cfg.secret) throw new Error("KHALTI_SECRET_KEY is not configured");

  const res = await fetch(`${cfg.baseUrl}/api/v2/epayment/lookup/`, {
    method: "POST",
    headers: { Authorization: `Key ${cfg.secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pidx }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { status: String(json.status ?? "Unknown"), raw: json };
}
