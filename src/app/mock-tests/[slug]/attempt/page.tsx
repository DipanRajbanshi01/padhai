import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getRunnerData, isPast } from "@/lib/mock";
import { finalizeAttempt } from "@/app/mock-tests/actions";
import { TestRunner, type RunnerQuestion } from "@/components/mock/test-runner";

export const metadata = { title: "Mock test in progress" };

export default async function AttemptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=/mock-tests/${slug}`);

  const data = await getRunnerData(profile.id, slug);
  if (!data) notFound();

  // No live attempt → send them to the instructions page to start one.
  if (!data.attempt) redirect(`/mock-tests/${slug}`);

  // Expired but not yet submitted → grade it and show the result.
  if (isPast(data.attempt.expiresAt)) {
    await finalizeAttempt(data.attempt.id);
    redirect(`/results/${data.attempt.id}`);
  }

  const questions: RunnerQuestion[] = data.test.questions.map((q) => ({
    id: q.id,
    type: q.type,
    body: q.body,
    imageUrl: q.imageUrl,
    marks: q.marks,
    topic: q.topic,
    options: q.options.map((o) => ({ id: o.id, body: o.body })),
  }));

  const initialAnswers = Object.fromEntries(
    data.answers.map((a) => [
      a.questionId,
      {
        chosen: a.chosenOptionIds,
        marked: a.markedForReview,
        time: a.timeSpentSec,
      },
    ]),
  );

  const state = data.attempt.autosaveState as { currentQuestionId?: string } | null;

  return (
    <TestRunner
      attemptId={data.attempt.id}
      slug={slug}
      title={data.test.title}
      trackShort={data.test.track.short}
      durationMin={data.test.durationMin}
      negativeMarking={data.test.negativeMarking}
      expiresAtMs={data.attempt.expiresAt.getTime()}
      questions={questions}
      initialAnswers={initialAnswers}
      initialQuestionId={state?.currentQuestionId}
    />
  );
}
