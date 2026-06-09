import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <ComingSoon
      title="Packages & pricing"
      description="Per-course purchases and discounted per-track bundles in NPR, paid securely with eSewa or Khalti. Checkout lands with the payments phase."
      phase="Phase 4"
    />
  );
}
