import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Timer, ListChecks, Award, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getMockBySlug, isPast } from "@/lib/mock";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { startAttempt } from "@/app/mock-tests/actions";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/auth/submit-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getMockBySlug(slug);
  return { title: test ? test.title : "Mock test" };
}

export default async function MockInstructionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = await getMockBySlug(slug);
  if (!test || !test.published) notFound();

  // Is there a live attempt to resume?
  const user = await getAuthUser();
  let hasLiveAttempt = false;
  if (user) {
    const live = await db.attempt.findFirst({
      where: { userId: user.id, mockTestId: test.id, status: "IN_PROGRESS" },
      select: { expiresAt: true },
    });
    hasLiveAttempt = !!live && !isPast(live.expiresAt);
  }

  const facts = [
    { icon: Timer, label: "Duration", value: `${test.durationMin} minutes` },
    { icon: ListChecks, label: "Questions", value: `${test.questionCount}` },
    { icon: Award, label: "Total marks", value: `${test.totalMarks}` },
    {
      icon: Minus,
      label: "Negative marking",
      value: test.negativeMarking > 0 ? `−${test.negativeMarking} × marks` : "None",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/mock-tests" className="hover:text-crimson">
          Mock tests
        </Link>
        <span className="px-2">/</span>
        <Link href={`/mock-tests?track=${test.track.code}`} className="hover:text-crimson">
          {test.track.short}
        </Link>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="deep">{test.track.title}</Badge>
        {test.subject && <Badge variant="neutral">{test.subject.title}</Badge>}
        {test.isFree && <Badge variant="teal">Free</Badge>}
      </div>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">{test.title}</h1>
      {test.description && <p className="mt-3 text-lg text-ink-soft">{test.description}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-card border border-line bg-paper p-4 shadow-soft">
            <f.icon className="size-5 text-crimson" />
            <p className="mt-3 text-xs uppercase tracking-wider text-ink-soft">{f.label}</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-ink">{f.value}</p>
          </div>
        ))}
      </div>

      {test.topics.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink">Topics covered</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {test.topics.map((t) => (
              <span key={t} className="rounded-pill bg-paper-2 px-2.5 py-1 text-xs text-ink-soft">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 rounded-card border border-line bg-paper-2 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <AlertTriangle className="size-5 text-marigold" /> Before you begin
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          {[
            "The timer starts as soon as you begin and won't pause.",
            "Use the question palette to jump around and mark questions for review.",
            "Your answers save automatically — a refresh or lost connection won't lose them.",
            test.negativeMarking > 0
              ? `Wrong answers lose ${test.negativeMarking} × the question's marks. Unanswered questions score zero.`
              : "There is no negative marking. Attempt every question.",
            "The test submits automatically when the timer runs out.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" /> {line}
            </li>
          ))}
        </ul>
      </div>

      <form action={startAttempt.bind(null, test.slug)} className="mt-8">
        <SubmitButton size="lg" className="w-full sm:w-auto">
          {hasLiveAttempt ? "Resume test" : "Start test"}
        </SubmitButton>
        {!user && (
          <p className="mt-3 text-sm text-ink-soft">You&apos;ll be asked to log in first.</p>
        )}
      </form>
    </div>
  );
}
