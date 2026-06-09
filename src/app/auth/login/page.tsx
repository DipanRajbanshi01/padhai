import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { AuthShell, OrDivider } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  if (await getAuthUser()) redirect("/dashboard");
  const { next, error } = await searchParams;

  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep learning and practising.">
      {error ? (
        <p className="mb-4 rounded-card bg-crimson/10 px-3 py-2.5 text-sm text-crimson-deep">
          {error}
        </p>
      ) : null}

      <GoogleButton next={next} />
      <OrDivider />
      <LoginForm next={next} />

      <div className="mt-5 border-t border-line pt-4 text-center">
        <Link
          href="/auth/otp"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <Smartphone className="size-4" /> Log in with phone number
        </Link>
      </div>
    </AuthShell>
  );
}
