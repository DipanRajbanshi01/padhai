import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      title="About Padhai"
      description="Curriculum-mapped courses and serious mock tests, built for Nepali students — from Class 9 to the entrance hall."
    />
  );
}
