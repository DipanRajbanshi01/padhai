import crypto from "crypto";

/**
 * eSewa ePay v2 integration. The merchant signs a comma-joined message with an
 * HMAC-SHA256 secret (base64). On return, eSewa sends a base64 `data` payload
 * that we re-sign and compare. Sandbox creds (EPAYTEST) are in .env.example.
 */
export function esewaConfig() {
  return {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
    secret: process.env.ESEWA_SECRET_KEY || "",
    baseUrl: process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np",
  };
}

export function esewaSignature(message: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

export interface EsewaForm {
  action: string;
  fields: Record<string, string>;
}

/** Build the signed form that the browser POSTs to eSewa. */
export function buildEsewaForm(opts: {
  amountNpr: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): EsewaForm {
  const cfg = esewaConfig();
  const total = String(opts.amountNpr);
  const message = `total_amount=${total},transaction_uuid=${opts.transactionUuid},product_code=${cfg.merchantCode}`;

  const fields: Record<string, string> = {
    amount: total,
    tax_amount: "0",
    total_amount: total,
    transaction_uuid: opts.transactionUuid,
    product_code: cfg.merchantCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: opts.successUrl,
    failure_url: opts.failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: esewaSignature(message, cfg.secret),
  };

  return { action: `${cfg.baseUrl}/api/epay/main/v2/form`, fields };
}

export interface EsewaCallback {
  transaction_code: string;
  status: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signature: string;
  signed_field_names: string;
}

/** Decode the base64 `data` query param eSewa returns to the success URL. */
export function decodeEsewaData(dataParam: string): EsewaCallback | null {
  try {
    return JSON.parse(Buffer.from(dataParam, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Recompute the signature over the returned signed fields and confirm COMPLETE. */
export function verifyEsewaCallback(data: EsewaCallback): boolean {
  const cfg = esewaConfig();
  const record = data as unknown as Record<string, string>;
  const message = data.signed_field_names
    .split(",")
    .map((field) => `${field}=${record[field] ?? ""}`)
    .join(",");
  const expected = esewaSignature(message, cfg.secret);
  return expected === data.signature && data.status === "COMPLETE";
}
