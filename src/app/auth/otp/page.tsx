import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = { title: "Log in with phone" };

export default async function OtpPage() {
  if (await getAuthUser()) redirect("/dashboard");

  return (
    <AuthShell title="Log in with your phone" subtitle="Enter your number and we'll text you a code.">
      <OtpForm />
      <div className="mt-5 border-t border-line pt-4 text-center">
        <Link href="/auth/login" className="text-sm font-medium text-crimson hover:underline">
          Use email or Google instead
        </Link>
      </div>
    </AuthShell>
  );
}
