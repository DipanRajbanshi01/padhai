"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import type { QuestionType } from "@prisma/client";
import { MathText } from "@/components/math-text";
import { Button } from "@/components/ui/button";
import { saveAnswer, setAttemptState, submitAttempt } from "@/app/mock-tests/actions";
import { cn } from "@/lib/utils";

export interface RunnerOption {
  id: string;
  body: string;
}
export interface RunnerQuestion {
  id: string;
  type: QuestionType;
  body: string;
  imageUrl: string | null;
  marks: number;
  topic: string | null;
  options: RunnerOption[];
}

interface AnswerState {
  chosen: string[];
  marked: boolean;
  time: number;
}

interface TestRunnerProps {
  attemptId: string;
  slug: string;
  title: string;
  trackShort: string;
  durationMin: number;
  negativeMarking: number;
  expiresAtMs: number;
  questions: RunnerQuestion[];
  initialAnswers: Record<string, { chosen: string[]; marked: boolean; time: number }>;
  initialQuestionId?: string;
}

type PaletteState = "current" | "answered" | "marked" | "marked-answered" | "unanswered" | "not-visited";

export function TestRunner({
  attemptId,
  title,
  trackShort,
  negativeMarking,
  expiresAtMs,
  questions,
  initialAnswers,
  initialQuestionId,
}: TestRunnerProps) {
  const startIndex = (() => {
    const i = questions.findIndex((q) => q.id === initialQuestionId);
    return i >= 0 ? i : 0;
  })();

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const base: Record<string, AnswerState> = {};
    for (const q of questions) {
      const init = initialAnswers[q.id];
      base[q.id] = { chosen: init?.chosen ?? [], marked: init?.marked ?? false, time: init?.time ?? 0 };
    }
    return base;
  });
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([questions[startIndex].id]));
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const current = questions[currentIndex];

  // Latest values for fire-and-forget saves without stale closures.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  });
  const currentQidRef = useRef(questions[startIndex].id);
  useEffect(() => {
    currentQidRef.current = questions[currentIndex].id;
  }, [currentIndex, questions]);

  const persist = useCallback(
    (qid: string) => {
      const a = answersRef.current[qid];
      if (!a) return Promise.resolve({ ok: false });
      return saveAnswer({
        attemptId,
        questionId: qid,
        chosenOptionIds: a.chosen,
        markedForReview: a.marked,
        timeSpentSec: a.time,
      });
    },
    [attemptId],
  );

  const submitNow = useCallback(async () => {
    setSubmitting(true);
    await persist(currentQidRef.current);
    await submitAttempt(attemptId); // grades + redirects to /results/[id]
  }, [attemptId, persist]);

  // Timer + per-question time + periodic autosave. Restarts each question.
  useEffect(() => {
    if (submitting) return;
    const qid = questions[currentIndex].id;
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      const rem = Math.max(0, Math.round((expiresAtMs - Date.now()) / 1000));
      setRemaining(rem);
      setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], time: prev[qid].time + 1 } }));
      if (rem <= 0) {
        clearInterval(id);
        void submitNow();
        return;
      }
      if (tick % 15 === 0) void persist(qid);
    }, 1000);
    return () => clearInterval(id);
  }, [currentIndex, submitting, questions, expiresAtMs, persist, submitNow]);

  // Best-effort save when leaving the runner.
  useEffect(() => {
    return () => {
      void persist(currentQidRef.current);
    };
  }, [persist]);

  function selectOption(optId: string) {
    const qid = current.id;
    const a = answers[qid];
    const chosen =
      current.type === "MULTI_SELECT"
        ? a.chosen.includes(optId)
          ? a.chosen.filter((x) => x !== optId)
          : [...a.chosen, optId]
        : [optId];
    const nextA = { ...a, chosen };
    setAnswers((prev) => ({ ...prev, [qid]: nextA }));
    void saveAnswer({
      attemptId,
      questionId: qid,
      chosenOptionIds: chosen,
      markedForReview: nextA.marked,
      timeSpentSec: nextA.time,
    });
  }

  function clearResponse() {
    const qid = current.id;
    const nextA = { ...answers[qid], chosen: [] };
    setAnswers((prev) => ({ ...prev, [qid]: nextA }));
    void saveAnswer({
      attemptId,
      questionId: qid,
      chosenOptionIds: [],
      markedForReview: nextA.marked,
      timeSpentSec: nextA.time,
    });
  }

  function toggleMark() {
    const qid = current.id;
    const nextA = { ...answers[qid], marked: !answers[qid].marked };
    setAnswers((prev) => ({ ...prev, [qid]: nextA }));
    void saveAnswer({
      attemptId,
      questionId: qid,
      chosenOptionIds: nextA.chosen,
      markedForReview: nextA.marked,
      timeSpentSec: nextA.time,
    });
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length || index === currentIndex) return;
    void persist(current.id);
    const qid = questions[index].id;
    setCurrentIndex(index);
    setVisited((v) => {
      const n = new Set(v);
      n.add(qid);
      return n;
    });
    void setAttemptState(attemptId, { currentQuestionId: qid });
  }

  function paletteState(qid: string): PaletteState {
    if (qid === current.id) return "current";
    const a = answers[qid];
    const answered = a.chosen.length > 0;
    if (a.marked) return answered ? "marked-answered" : "marked";
    if (answered) return "answered";
    if (visited.has(qid)) return "unanswered";
    return "not-visited";
  }

  const counts = useMemo(() => {
    let answered = 0,
      marked = 0,
      notVisited = 0,
      unanswered = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (a.marked) marked += 1;
      if (a.chosen.length > 0) answered += 1;
      else if (visited.has(q.id)) unanswered += 1;
      else notVisited += 1;
    }
    return { answered, marked, notVisited, unanswered };
  }, [answers, visited, questions]);

  const lowTime = remaining <= 300;
  const currentAnswer = answers[current.id];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-paper p-4 shadow-soft">
        <div>
          <p className="text-xs font-medium text-ink-soft">{trackShort} · Mock test</p>
          <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-pill px-4 py-2 font-display text-lg font-semibold tabular-nums",
              lowTime ? "bg-crimson text-paper" : "bg-paper-2 text-ink",
            )}
            aria-live="polite"
          >
            <Clock className="size-4" /> {formatTime(remaining)}
          </div>
          <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
            Submit
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Question */}
        <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">
              Question {currentIndex + 1}
              <span className="text-ink-soft"> / {questions.length}</span>
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-soft">
              {current.topic && (
                <span className="rounded-pill bg-paper-2 px-2.5 py-1">{current.topic}</span>
              )}
              <span className="rounded-pill bg-teal/10 px-2.5 py-1 font-medium text-teal">
                +{current.marks}
                {negativeMarking > 0 ? ` / −${negativeMarking}` : ""}
              </span>
            </span>
          </div>

          <div className="mt-4 text-base leading-relaxed text-ink">
            <MathText text={current.body} />
          </div>

          {current.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.imageUrl}
              alt="Question diagram"
              className="mt-4 max-h-72 rounded-card border border-line"
            />
          )}

          <ul className="mt-6 space-y-3">
            {current.options.map((opt, i) => {
              const selected = currentAnswer.chosen.includes(opt.id);
              const multi = current.type === "MULTI_SELECT";
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => selectOption(opt.id)}
                    disabled={submitting}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-crimson bg-crimson/5 text-ink"
                        : "border-line bg-paper text-ink hover:bg-paper-2",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center text-xs font-semibold",
                        multi ? "rounded-md" : "rounded-pill",
                        selected ? "bg-crimson text-paper" : "bg-paper-2 text-ink-soft",
                      )}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <MathText text={opt.body} className="flex-1" />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <Button variant="ghost" size="sm" onClick={clearResponse} disabled={submitting}>
              <Eraser /> Clear
            </Button>
            <Button
              variant={currentAnswer.marked ? "accent" : "outline"}
              size="sm"
              onClick={toggleMark}
              disabled={submitting}
            >
              <Flag /> {currentAnswer.marked ? "Marked for review" : "Mark for review"}
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goTo(currentIndex - 1)}
                disabled={submitting || currentIndex === 0}
              >
                <ChevronLeft /> Prev
              </Button>
              <Button
                size="sm"
                onClick={() => goTo(currentIndex + 1)}
                disabled={submitting || currentIndex === questions.length - 1}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <aside className="rounded-card border border-line bg-paper p-5 shadow-soft">
          <p className="font-display text-sm font-semibold text-ink">Question palette</p>

          <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-5">
            {questions.map((q, i) => {
              const state = paletteState(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  disabled={submitting}
                  aria-label={`Go to question ${i + 1} (${state})`}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md text-sm font-semibold transition-transform hover:scale-105",
                    paletteClass(state),
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <ul className="mt-5 space-y-1.5 text-xs text-ink-soft">
            <Legend swatch="bg-teal text-paper" label={`Answered (${counts.answered})`} />
            <Legend swatch="bg-marigold text-ink" label={`Marked (${counts.marked})`} />
            <Legend swatch="border border-crimson text-crimson" label={`Not answered (${counts.unanswered})`} />
            <Legend swatch="bg-paper-2 text-ink-soft" label={`Not visited (${counts.notVisited})`} />
          </ul>

          <Button className="mt-5 w-full" onClick={() => setShowConfirm(true)} disabled={submitting}>
            Submit test
          </Button>
        </aside>
      </div>

      {showConfirm && (
        <ConfirmDialog
          counts={counts}
          total={questions.length}
          submitting={submitting}
          onCancel={() => setShowConfirm(false)}
          onConfirm={submitNow}
        />
      )}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("flex size-4 items-center justify-center rounded", swatch)} />
      {label}
    </li>
  );
}

function paletteClass(state: PaletteState): string {
  switch (state) {
    case "current":
      return "bg-crimson text-paper ring-2 ring-crimson/30 ring-offset-1 ring-offset-paper";
    case "answered":
      return "bg-teal text-paper";
    case "marked":
      return "bg-marigold text-ink";
    case "marked-answered":
      return "bg-marigold text-ink ring-2 ring-teal";
    case "unanswered":
      return "border border-crimson bg-paper text-crimson";
    default:
      return "bg-paper-2 text-ink-soft";
  }
}

function ConfirmDialog({
  counts,
  total,
  submitting,
  onCancel,
  onConfirm,
}: {
  counts: { answered: number; marked: number; notVisited: number; unanswered: number };
  total: number;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const unattempted = counts.unanswered + counts.notVisited;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-card border border-line bg-paper p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Submit test?</h2>
          <button onClick={onCancel} aria-label="Close" className="text-ink-soft hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat value={counts.answered} label="Answered" tone="text-teal" />
          <Stat value={unattempted} label="Unattempted" tone="text-crimson" />
          <Stat value={counts.marked} label="Marked" tone="text-marigold" />
        </div>

        {unattempted > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-card bg-marigold/10 px-3 py-2.5 text-sm text-ink">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-marigold" />
            You have {unattempted} of {total} questions unattempted. You can&apos;t change answers
            after submitting.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Keep working
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-card bg-paper-2 p-3">
      <div className={cn("font-display text-2xl font-semibold", tone)}>{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
