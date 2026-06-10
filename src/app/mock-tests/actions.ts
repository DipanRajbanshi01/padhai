"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { computeScore } from "@/lib/mock";

/* --------------------------- Start / resume --------------------------- */

export async function startAttempt(slug: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=/mock-tests/${slug}`);

  const test = await db.mockTest.findUnique({ where: { slug } });
  if (!test || !test.published) redirect("/mock-tests");
  if (!test.isFree) redirect("/pricing"); // paid mocks unlock with payments (Phase 4)

  const now = Date.now();
  const existing = await db.attempt.findFirst({
    where: { userId: profile.id, mockTestId: test.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    if (existing.expiresAt.getTime() > now) {
      redirect(`/mock-tests/${slug}/attempt`); // resume the live attempt
    }
    await finalizeAttempt(existing.id); // expired & unsubmitted → grade it, then start fresh
  }

  await db.attempt.create({
    data: {
      userId: profile.id,
      mockTestId: test.id,
      expiresAt: new Date(now + test.durationMin * 60_000),
    },
  });

  redirect(`/mock-tests/${slug}/attempt`);
}

/* --------------------------- Autosave answers --------------------------- */

export async function saveAnswer(input: {
  attemptId: string;
  questionId: string;
  chosenOptionIds: string[];
  numericAnswer?: number | null;
  markedForReview: boolean;
  timeSpentSec: number;
}): Promise<{ ok: boolean; expired?: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false };

  const attempt = await db.attempt.findUnique({
    where: { id: input.attemptId },
    select: { userId: true, status: true, expiresAt: true, mockTestId: true },
  });
  if (!attempt || attempt.userId !== profile.id || attempt.status !== "IN_PROGRESS") {
    return { ok: false };
  }
  // Small grace window for clock skew / in-flight saves.
  if (attempt.expiresAt.getTime() < Date.now() - 3000) return { ok: false, expired: true };

  // Validate the question belongs to this test, and the options are real.
  const question = await db.question.findFirst({
    where: { id: input.questionId, mockTestId: attempt.mockTestId },
    select: { id: true, options: { select: { id: true } } },
  });
  if (!question) return { ok: false };

  const valid = new Set(question.options.map((o) => o.id));
  const chosen = input.chosenOptionIds.filter((id) => valid.has(id));

  const existing = await db.attemptAnswer.findUnique({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    select: { timeSpentSec: true },
  });
  const timeSpentSec = Math.max(existing?.timeSpentSec ?? 0, Math.floor(input.timeSpentSec || 0));

  await db.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
    update: {
      chosenOptionIds: chosen,
      markedForReview: input.markedForReview,
      numericAnswer: input.numericAnswer ?? null,
      timeSpentSec,
    },
    create: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      chosenOptionIds: chosen,
      markedForReview: input.markedForReview,
      numericAnswer: input.numericAnswer ?? null,
      timeSpentSec,
    },
  });

  return { ok: true };
}

/** Persist lightweight UI recovery state (current question) for resume. */
export async function setAttemptState(
  attemptId: string,
  state: { currentQuestionId?: string },
): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  await db.attempt.updateMany({
    where: { id: attemptId, userId: profile.id, status: "IN_PROGRESS" },
    data: { autosaveState: state },
  });
}

/* ------------------------------- Submit ------------------------------- */

export async function submitAttempt(attemptId: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    select: { userId: true },
  });
  if (!attempt || attempt.userId !== profile.id) redirect("/mock-tests");

  await finalizeAttempt(attemptId);
  redirect(`/results/${attemptId}`);
}

/**
 * Grade an attempt and persist results. Idempotent: a no-op if the attempt is
 * already submitted. Shared by manual submit, auto-submit and expiry handling.
 */
export async function finalizeAttempt(attemptId: string): Promise<void> {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { mockTest: { select: { negativeMarking: true } } },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") return;

  const questions = await db.question.findMany({
    where: { mockTestId: attempt.mockTestId },
    select: {
      id: true,
      marks: true,
      negativeMarks: true,
      options: { select: { id: true, isCorrect: true } },
    },
  });
  const answers = await db.attemptAnswer.findMany({ where: { attemptId } });
  const answersByQuestion = new Map(answers.map((a) => [a.questionId, a.chosenOptionIds]));

  const result = computeScore(questions, answersByQuestion, attempt.mockTest.negativeMarking);

  await db.$transaction([
    ...answers.map((a) =>
      db.attemptAnswer.update({
        where: { id: a.id },
        data: { isCorrect: result.perQuestion.get(a.questionId)?.correct ?? false },
      }),
    ),
    db.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        score: result.score,
        maxScore: result.maxScore,
      },
    }),
  ]);
}
