import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Placeholder for routes that ship in a later phase, so nav never 404s. */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase?: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-card bg-marigold/15 text-crimson">
        <Construction className="size-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-3 text-ink-soft">{description}</p>
      {phase && (
        <p className="mt-2 text-sm font-medium text-crimson">Coming in {phase}.</p>
      )}
      <Link href="/" className="mt-8">
        <Button variant="outline">
          <ArrowLeft /> Back home
        </Button>
      </Link>
    </div>
  );
}
