import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/onboarding");

  return (
    <AuthShell
      title="Tell us where you're headed"
      subtitle="We'll tailor your catalog and mock tests to your goal."
    >
      <OnboardingForm defaultName={profile.name ?? undefined} />
    </AuthShell>
  );
}
