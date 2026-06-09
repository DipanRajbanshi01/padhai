"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithPassword, type AuthState } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(loginWithPassword, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </div>

      <FormMessage state={state} />

      <SubmitButton size="lg" className="w-full">
        Log in
      </SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        New to Padhai?{" "}
        <Link href="/auth/signup" className="font-medium text-crimson hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
