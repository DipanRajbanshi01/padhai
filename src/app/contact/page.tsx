import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <ComingSoon
      title="Get in touch"
      description="A contact form and support details are on the way. For now, reach us by email."
    />
  );
}
