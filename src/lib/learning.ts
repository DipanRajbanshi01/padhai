import { db } from "@/lib/db";

/** A lesson flattened out of the chapter tree, with the user's progress merged. */
export interface LearnLesson {
  id: string;
  title: string;
  videoUrl: string | null;
  durationSec: number;
  isFreePreview: boolean;
  content: string | null;
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  /** global index across the whole course (for next/prev + numbering) */
  index: number;
  secondsWatched: number;
  completed: boolean;
}

export interface LearnData {
  course: {
    id: string;
    slug: string;
    title: string;
    subjectTitle: string;
    trackShort: string;
  };
  chapters: { id: string; title: string; lessons: LearnLesson[] }[];
  lessons: LearnLesson[]; // flat, in order
  completedCount: number;
  percent: number;
}

/**
 * Load an enrolled course with the user's per-lesson progress merged in.
 * Returns `null` if the course doesn't exist or the user isn't enrolled.
 */
export async function getLearnData(slug: string, userId: string): Promise<LearnData | null> {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      subject: { include: { track: true } },
      chapters: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) return null;

  const progress = await db.lessonProgress.findMany({
    where: { userId, lesson: { chapter: { courseId: course.id } } },
  });
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));

  let index = 0;
  const chapters = course.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    lessons: chapter.lessons.map((lesson): LearnLesson => {
      const p = progressByLesson.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        durationSec: lesson.durationSec,
        isFreePreview: lesson.isFreePreview,
        content: lesson.content,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        index: index++,
        secondsWatched: p?.secondsWatched ?? 0,
        completed: p?.completed ?? false,
      };
    }),
  }));

  const lessons = chapters.flatMap((c) => c.lessons);
  const completedCount = lessons.filter((l) => l.completed).length;
  const percent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subjectTitle: course.subject.title,
      trackShort: course.subject.track.short,
    },
    chapters,
    lessons,
    completedCount,
    percent,
  };
}

/** Pick the lesson to open: the requested one, else first incomplete, else first. */
export function resolveActiveLesson(data: LearnData, requestedId?: string): LearnLesson | null {
  if (data.lessons.length === 0) return null;
  if (requestedId) {
    const match = data.lessons.find((l) => l.id === requestedId);
    if (match) return match;
  }
  return data.lessons.find((l) => !l.completed) ?? data.lessons[0];
}

/** Completion stats for a single course (used on the dashboard). */
export async function getCourseProgress(userId: string, courseId: string) {
  const [total, completed] = await Promise.all([
    db.lesson.count({ where: { chapter: { courseId } } }),
    db.lessonProgress.count({
      where: { userId, completed: true, lesson: { chapter: { courseId } } },
    }),
  ]);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}
