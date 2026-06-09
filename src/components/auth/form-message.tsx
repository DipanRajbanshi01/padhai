import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AuthState } from "@/app/auth/actions";

/** Inline success / error banner for auth forms. */
export function FormMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p className="flex items-start gap-2 rounded-card bg-crimson/10 px-3 py-2.5 text-sm text-crimson-deep">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>{state.error}</span>
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="flex items-start gap-2 rounded-card bg-teal/10 px-3 py-2.5 text-sm text-teal">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{state.message}</span>
      </p>
    );
  }
  return null;
}
