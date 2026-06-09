"use client";

import { useActionState } from "react";
import { requestOtp, type AuthState } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";

/**
 * Phone OTP request form. The flow is OTP-ready but the SMS provider is not
 * wired yet, so the action returns a friendly "not enabled" message for now.
 */
export function OtpForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestOtp, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="98XXXXXXXX" autoComplete="tel" />
        <p className="mt-1.5 text-xs text-ink-soft">We&apos;ll text you a 6-digit code.</p>
      </div>

      <FormMessage state={state} />

      <SubmitButton size="lg" className="w-full">
        Send code
      </SubmitButton>
    </form>
  );
}
