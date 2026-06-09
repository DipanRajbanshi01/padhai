import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Mock Tests" };

export default function MockTestsPage() {
  return (
    <ComingSoon
      title="Mock tests"
      description="The CBT mock-test engine — timed tests, question palette, instant scoring and topic-wise analysis — is the core feature we're building next."
      phase="Phase 3"
    />
  );
}
