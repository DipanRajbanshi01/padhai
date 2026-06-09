"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithPassword, type AuthState } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signUpWithPassword, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Sita Sharma" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="At least 8 characters" />
      </div>

      <FormMessage state={state} />

      <SubmitButton size="lg" className="w-full">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-crimson hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
