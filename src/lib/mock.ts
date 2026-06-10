import { db } from "@/lib/db";

/** True if a time is at/before now (server clock). Kept out of components. */
export function isPast(date: Date): boolean {
  return date.getTime() <= Date.now();
}

/* ------------------------------- Catalog ------------------------------- */

export async function getMockCatalog(trackCode?: string) {
  return db.mockTest.findMany({
    where: { published: true, ...(trackCode ? { track: { code: trackCode } } : {}) },
    orderBy: [{ track: { order: "asc" } }, { order: "asc" }],
    include: {
      track: true,
      subject: true,
      _count: { select: { questions: true } },
    },
  });
}

export type MockCatalogItem = Awaited<ReturnType<typeof getMockCatalog>>[number];

/** Instructions-page data: meta + computed totals, no question content. */
export async function getMockBySlug(slug: string) {
  const test = await db.mockTest.findUnique({
    where: { slug },
    include: {
      track: true,
      subject: true,
      questions: { select: { marks: true, topic: true } },
    },
  });
  if (!test) return null;

  const totalMarks = test.questions.reduce((s, q) => s + q.marks, 0);
  const topics = Array.from(new Set(test.questions.map((q) => q.topic).filter(Boolean))) as string[];

  return {
    ...test,
    questionCount: test.questions.length,
    totalMarks,
    topics,
  };
}

/* --------------------------- Runner (sanitized) --------------------------- */
/**
 * Data for the live CBT runner. CRITICAL: option `isCorrect` and explanations
 * are never selected here, so correct answers never reach the client mid-test.
 */
export async function getRunnerData(userId: string, slug: string) {
  const test = await db.mockTest.findUnique({
    where: { slug },
    include: {
      track: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          type: true,
          body: true,
          imageUrl: true,
          marks: true,
          topic: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, body: true, order: true },
          },
        },
      },
    },
  });
  if (!test) return null;

  const attempt = await db.attempt.findFirst({
    where: { userId, mockTestId: test.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (!attempt) return { test, attempt: null, answers: [] as RunnerAnswer[] };

  const answers = await db.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
    select: {
      questionId: true,
      chosenOptionIds: true,
      numericAnswer: true,
      markedForReview: true,
      timeSpentSec: true,
    },
  });

  return { test, attempt, answers };
}

export interface RunnerAnswer {
  questionId: string;
  chosenOptionIds: string[];
  numericAnswer: number | null;
  markedForReview: boolean;
  timeSpentSec: number;
}

/* ------------------------------- Result ------------------------------- */

export async function getAttemptResult(userId: string, attemptId: string) {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      mockTest: { include: { track: true, subject: true } },
      answers: true,
    },
  });
  if (!attempt || attempt.userId !== userId) return null;

  const questions = await db.question.findMany({
    where: { mockTestId: attempt.mockTestId },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });

  return { attempt, questions };
}

/* ------------------------------- Scoring ------------------------------- */

export interface GradableOption {
  id: string;
  isCorrect: boolean;
}
export interface GradableQuestion {
  id: string;
  marks: number;
  negativeMarks: number | null;
  options: GradableOption[];
}

export interface QuestionResult {
  attempted: boolean;
  correct: boolean;
  awarded: number;
}

/** Grade a single question against the chosen option ids. */
export function gradeQuestion(
  q: GradableQuestion,
  chosen: string[],
  negativeFraction: number,
): QuestionResult {
  const correctIds = q.options
    .filter((o) => o.isCorrect)
    .map((o) => o.id)
    .sort();
  const chosenSorted = [...chosen].sort();

  if (chosenSorted.length === 0) return { attempted: false, correct: false, awarded: 0 };

  const correct =
    correctIds.length > 0 &&
    correctIds.length === chosenSorted.length &&
    correctIds.every((id, i) => id === chosenSorted[i]);

  const penalty = q.negativeMarks ?? negativeFraction * q.marks;
  return { attempted: true, correct, awarded: correct ? q.marks : -penalty };
}

/** Aggregate a whole attempt. Returns totals + per-question result map. */
export function computeScore(
  questions: GradableQuestion[],
  answersByQuestion: Map<string, string[]>,
  negativeFraction: number,
) {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let attemptedCount = 0;
  const perQuestion = new Map<string, QuestionResult>();

  for (const q of questions) {
    maxScore += q.marks;
    const chosen = answersByQuestion.get(q.id) ?? [];
    const res = gradeQuestion(q, chosen, negativeFraction);
    perQuestion.set(q.id, res);
    score += res.awarded;
    if (res.attempted) attemptedCount += 1;
    if (res.correct) correctCount += 1;
  }

  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    correctCount,
    attemptedCount,
    total: questions.length,
    perQuestion,
  };
}
