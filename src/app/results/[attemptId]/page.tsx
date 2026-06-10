import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CheckCircle2, XCircle, MinusCircle, Clock, Target, Award } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { getAttemptResult, computeScore, gradeQuestion } from "@/lib/mock";
import { MathText } from "@/components/math-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Result" };

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=/results/${attemptId}`);

  const data = await getAttemptResult(profile.id, attemptId);
  if (!data) notFound();

  const { attempt, questions } = data;
  const test = attempt.mockTest;

  // A still-running attempt has no result yet — send back to the runner.
  if (attempt.status === "IN_PROGRESS") redirect(`/mock-tests/${test.slug}/attempt`);

  const answersByQ = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const chosenByQ = new Map(attempt.answers.map((a) => [a.questionId, a.chosenOptionIds]));

  const totals = computeScore(
    questions.map((q) => ({
      id: q.id,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      options: q.options.map((o) => ({ id: o.id, isCorrect: o.isCorrect })),
    })),
    chosenByQ,
    test.negativeMarking,
  );

  const incorrect = totals.attemptedCount - totals.correctCount;
  const unattempted = totals.total - totals.attemptedCount;
  const accuracy = totals.attemptedCount
    ? Math.round((totals.correctCount / totals.attemptedCount) * 100)
    : 0;
  const timeTakenSec =
    attempt.submittedAt && attempt.startedAt
      ? Math.max(0, Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000))
      : 0;
  const scorePct = totals.maxScore > 0 ? Math.round((totals.score / totals.maxScore) * 100) : 0;

  // Topic-wise breakdown
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const q of questions) {
    const topic = q.topic ?? "General";
    const res = gradeQuestion(
      { id: q.id, marks: q.marks, negativeMarks: q.negativeMarks, options: q.options },
      chosenByQ.get(q.id) ?? [],
      test.negativeMarking,
    );
    const entry = topicMap.get(topic) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (res.correct) entry.correct += 1;
    topicMap.set(topic, entry);
  }
  const topics = Array.from(topicMap.entries()).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/mock-tests" className="hover:text-crimson">
          Mock tests
        </Link>
        <span className="px-2">/</span>
        <span>Result</span>
      </nav>

      {/* Score hero */}
      <div className="overflow-hidden rounded-card border border-line bg-deep text-paper shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-6 p-8">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="marigold">{test.track.short}</Badge>
              {test.isFree && <Badge variant="teal">Free</Badge>}
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold">{test.title}</h1>
            <p className="mt-1 text-sm text-paper/70">
              Scored {totals.correctCount}/{totals.total} correct
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl font-semibold">
              {totals.score}
              <span className="text-2xl text-paper/60"> / {totals.maxScore}</span>
            </div>
            <p className="mt-1 text-sm text-marigold">{scorePct}%</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard icon={CheckCircle2} tone="text-teal" value={totals.correctCount} label="Correct" />
        <SummaryCard icon={XCircle} tone="text-crimson" value={incorrect} label="Incorrect" />
        <SummaryCard icon={MinusCircle} tone="text-ink-soft" value={unattempted} label="Unattempted" />
        <SummaryCard icon={Target} tone="text-deep" value={`${accuracy}%`} label="Accuracy" />
        <SummaryCard icon={Clock} tone="text-marigold" value={formatDuration(timeTakenSec)} label="Time taken" />
      </div>

      {/* Topic breakdown */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <Award className="size-5 text-crimson" /> Topic-wise breakdown
        </h2>
        <div className="mt-4 space-y-3">
          {topics.map(([topic, { correct, total }]) => {
            const pct = Math.round((correct / total) * 100);
            return (
              <div key={topic} className="rounded-card border border-line bg-paper p-4 shadow-soft">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{topic}</span>
                  <span className="text-ink-soft">
                    {correct}/{total} · {pct}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-paper-2">
                  <div
                    className={cn(
                      "h-full rounded-pill transition-all",
                      pct >= 60 ? "bg-teal" : pct >= 33 ? "bg-marigold" : "bg-crimson",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Per-question review */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Review answers</h2>
        <div className="mt-4 space-y-5">
          {questions.map((q, qi) => {
            const chosen = chosenByQ.get(q.id) ?? [];
            const answer = answersByQ.get(q.id);
            const res = gradeQuestion(
              { id: q.id, marks: q.marks, negativeMarks: q.negativeMarks, options: q.options },
              chosen,
              test.negativeMarking,
            );
            const verdict = !res.attempted ? "skipped" : res.correct ? "correct" : "wrong";

            return (
              <div key={q.id} className="rounded-card border border-line bg-paper p-6 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-ink">Q{qi + 1}.</span>
                  <VerdictBadge verdict={verdict} awarded={res.awarded} />
                </div>

                <div className="mt-2 text-ink">
                  <MathText text={q.body} />
                </div>
                {q.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={q.imageUrl}
                    alt="Question diagram"
                    className="mt-3 max-h-64 rounded-card border border-line"
                  />
                )}

                <ul className="mt-4 space-y-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt.isCorrect;
                    const isChosen = chosen.includes(opt.id);
                    return (
                      <li
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-3 rounded-card border px-4 py-2.5 text-sm",
                          isCorrect
                            ? "border-teal bg-teal/5"
                            : isChosen
                              ? "border-crimson bg-crimson/5"
                              : "border-line",
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-paper-2 text-xs font-semibold text-ink-soft">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <MathText text={opt.body} className="flex-1 text-ink" />
                        {isCorrect && <CheckCircle2 className="size-4 text-teal" />}
                        {isChosen && !isCorrect && <XCircle className="size-4 text-crimson" />}
                      </li>
                    );
                  })}
                </ul>

                {q.explanation && (
                  <div className="mt-4 rounded-card bg-paper-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                      Explanation
                    </p>
                    <div className="mt-1.5 text-sm text-ink">
                      <MathText text={q.explanation} />
                    </div>
                  </div>
                )}

                <p className="mt-3 text-xs text-ink-soft">
                  Time on this question: {formatDuration(answer?.timeSpentSec ?? 0)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/mock-tests/${test.slug}`}>
          <Button>Retake test</Button>
        </Link>
        <Link href="/mock-tests">
          <Button variant="outline">More mock tests</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ElementType;
  tone: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-card border border-line bg-paper p-4 shadow-soft">
      <Icon className={cn("size-5", tone)} />
      <div className="mt-2 font-display text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}

function VerdictBadge({ verdict, awarded }: { verdict: string; awarded: number }) {
  if (verdict === "correct") return <Badge variant="teal">Correct +{awarded}</Badge>;
  if (verdict === "wrong")
    return <Badge variant="crimson">Incorrect {awarded > 0 ? `+${awarded}` : awarded}</Badge>;
  return <Badge variant="neutral">Skipped</Badge>;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
