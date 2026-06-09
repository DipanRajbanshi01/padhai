import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  if (await getAuthUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Sample lessons and one mock test per track — free, no card needed."
    >
      <GoogleButton />
      <OrDivider />
      <SignupForm />
    </AuthShell>
  );
}
