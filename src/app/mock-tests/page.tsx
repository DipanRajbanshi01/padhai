import type { Metadata } from "next";
import Link from "next/link";
import { Timer, ListChecks, Minus, FileQuestion } from "lucide-react";
import { getMockCatalog } from "@/lib/mock";
import { TRACKS, TRACK_BY_CODE, type TrackCode } from "@/lib/tracks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mock Tests",
  description: "Timed CBT mock tests that mirror the real exam, with instant scoring.",
};

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track } = await searchParams;
  const tests = await getMockCatalog(track);
  const activeTrack = track ? TRACK_BY_CODE[track as TrackCode] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          {activeTrack ? `${activeTrack.short} mock tests` : "Mock tests"}
        </h1>
        <p className="mt-3 text-ink-soft">
          Sit a full-length CBT under real exam conditions, then get scored instantly with
          explanations and a topic-wise breakdown.
        </p>
      </header>

      {/* Track filter */}
      <div className="mt-8 flex flex-wrap gap-2">
        <TrackChip href="/mock-tests" active={!track}>
          All
        </TrackChip>
        {TRACKS.map((t) => (
          <TrackChip key={t.code} href={`/mock-tests?track=${t.code}`} active={track === t.code}>
            {t.short}
          </TrackChip>
        ))}
      </div>

      {tests.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-line bg-paper-2 px-6 py-16 text-center">
          <FileQuestion className="size-8 text-ink-soft" />
          <p className="mt-4 font-display text-lg font-semibold text-ink">No mock tests here yet</p>
          <p className="mt-1 text-sm text-ink-soft">Try another track.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={`/mock-tests/${test.slug}`}
              className="group flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-crimson/30 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <Badge variant="deep">{test.track.short}</Badge>
                {test.isFree && <Badge variant="teal">Free</Badge>}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink group-hover:text-crimson-deep">
                {test.title}
              </h3>
              {test.subject && <p className="mt-1 text-sm text-ink-soft">{test.subject.title}</p>}

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="size-3.5" /> {test.durationMin} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="size-3.5" /> {test._count.questions} questions
                </span>
                {test.negativeMarking > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-crimson-deep">
                    <Minus className="size-3.5" /> {test.negativeMarking} neg.
                  </span>
                )}
              </div>

              <div className="mt-5">
                <Button size="sm" variant="outline" className="w-full">
                  View & start
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-crimson bg-crimson text-paper"
          : "border-line bg-paper text-ink-soft hover:border-crimson/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
