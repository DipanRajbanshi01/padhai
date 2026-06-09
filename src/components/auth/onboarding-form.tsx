"use client";

import { useActionState } from "react";
import { saveOnboarding, type AuthState } from "@/app/auth/actions";
import { TRACKS } from "@/lib/tracks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormMessage } from "@/components/auth/form-message";

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(saveOnboarding, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={defaultName} placeholder="Sita Sharma" />
      </div>

      <div>
        <Label htmlFor="classTrack">Which track are you preparing for?</Label>
        <select
          id="classTrack"
          name="classTrack"
          required
          defaultValue=""
          className="h-11 w-full rounded-card border border-line bg-paper px-4 text-sm text-ink shadow-soft focus-visible:border-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/30"
        >
          <option value="" disabled>
            Choose your track…
          </option>
          {TRACKS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="targetExam">Target exam / goal (optional)</Label>
        <Input id="targetExam" name="targetExam" placeholder="e.g. IOE 2083, or SEE GPA 3.6+" />
      </div>

      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" placeholder="e.g. Kathmandu" />
      </div>

      <FormMessage state={state} />

      <SubmitButton size="lg" className="w-full">
        Continue to dashboard
      </SubmitButton>
    </form>
  );
}
