import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface CatalogFilters {
  track?: string; // Track.code
  subject?: string; // Subject.title
  price?: "free" | "paid";
  q?: string; // search across course + lesson titles
}

/** Course list for the catalog, with subject + track and lightweight counts. */
export async function getCatalog(filters: CatalogFilters) {
  const where: Prisma.CourseWhereInput = { published: true };

  const subjectWhere: Prisma.SubjectWhereInput = {};
  if (filters.track) subjectWhere.track = { code: filters.track };
  if (filters.subject) subjectWhere.title = filters.subject;
  if (Object.keys(subjectWhere).length > 0) where.subject = subjectWhere;

  if (filters.price === "free") where.isFree = true;
  if (filters.price === "paid") where.isFree = false;

  if (filters.q) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      // search lesson titles too (brief §3: "Search across courses and lessons")
      { chapters: { some: { lessons: { some: { title: { contains: q, mode: "insensitive" } } } } } },
    ];
  }

  return db.course.findMany({
    where,
    orderBy: [{ subject: { track: { order: "asc" } } }, { order: "asc" }],
    include: {
      subject: { include: { track: true } },
      _count: { select: { chapters: true, enrollments: true } },
    },
  });
}

export type CatalogCourse = Awaited<ReturnType<typeof getCatalog>>[number];

/** Full course detail for the course page (syllabus, instructor, pricing). */
export async function getCourseBySlug(slug: string) {
  return db.course.findUnique({
    where: { slug },
    include: {
      subject: { include: { track: true } },
      chapters: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>;

/** Distinct subjects available within a track (for the secondary filter). */
export async function getSubjectsForTrack(trackCode: string) {
  return db.subject.findMany({
    where: { track: { code: trackCode }, courses: { some: { published: true } } },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });
}

/** Total minutes + lesson count summarised from a course detail record. */
export function summariseCourse(course: CourseDetail) {
  const lessons = course.chapters.flatMap((c) => c.lessons);
  const totalSec = lessons.reduce((sum, l) => sum + l.durationSec, 0);
  return {
    lessonCount: lessons.length,
    chapterCount: course.chapters.length,
    totalMinutes: Math.round(totalSec / 60),
    freePreview: lessons.find((l) => l.isFreePreview) ?? null,
  };
}
