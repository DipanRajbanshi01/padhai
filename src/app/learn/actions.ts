"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

/** Resolve the lesson + owning course, verifying the user is enrolled. */
async function authorizeLesson(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, durationSec: true, chapter: { select: { course: { select: { id: true, slug: true } } } } },
  });
  if (!lesson) return null;
  const courseId = lesson.chapter.course.id;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) return null;
  return { lesson, courseSlug: lesson.chapter.course.slug };
}

/**
 * Autosave watch progress. Called frequently from the player, so it stays
 * silent (no revalidation). `secondsWatched` is kept monotonic and the lesson
 * auto-completes once ~95% is watched.
 */
export async function saveLessonProgress(input: {
  lessonId: string;
  secondsWatched: number;
  completed?: boolean;
}): Promise<{ ok: boolean; completed?: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false };

  const auth = await authorizeLesson(profile.id, input.lessonId);
  if (!auth) return { ok: false };

  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: profile.id, lessonId: input.lessonId } },
  });

  const seconds = Math.max(existing?.secondsWatched ?? 0, Math.floor(input.secondsWatched || 0));
  const duration = auth.lesson.durationSec || 0;
  const reachedEnd = duration > 0 && seconds >= duration * 0.95;
  const completed = input.completed || existing?.completed || reachedEnd;

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: profile.id, lessonId: input.lessonId } },
    update: { secondsWatched: seconds, completed },
    create: { userId: profile.id, lessonId: input.lessonId, secondsWatched: seconds, completed },
  });

  return { ok: true, completed };
}

/** Explicitly mark a lesson complete (or incomplete) and refresh the view. */
export async function setLessonComplete(
  lessonId: string,
  completed: boolean,
): Promise<{ ok: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false };

  const auth = await authorizeLesson(profile.id, lessonId);
  if (!auth) return { ok: false };

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: profile.id, lessonId } },
    update: { completed },
    create: { userId: profile.id, lessonId, completed, secondsWatched: 0 },
  });

  revalidatePath(`/learn/${auth.courseSlug}`);
  return { ok: true };
}
