"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Auto-POSTs the signed eSewa form on mount, with a manual fallback button. */
export function EsewaAutoForm({
  action,
  fields,
}: {
  action: string;
  fields: Record<string, string>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = setTimeout(() => formRef.current?.submit(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <form ref={formRef} method="POST" action={action} className="text-center">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="flex flex-col items-center gap-4 py-10">
        <Loader2 className="size-7 animate-spin text-crimson" />
        <p className="text-ink-soft">Redirecting you to eSewa…</p>
        <Button type="submit" variant="outline">
          Continue to eSewa
        </Button>
      </div>
    </form>
  );
}
