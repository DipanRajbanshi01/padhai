import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Past Papers" };

export default function PapersPage() {
  return (
    <ComingSoon
      title="Past & model papers"
      description="A library of solved past and model papers, organised by subject and chapter, downloadable as PDF."
      phase="Phase 6"
    />
  );
}
