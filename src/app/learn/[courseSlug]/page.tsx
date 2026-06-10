import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getLearnData, resolveActiveLesson } from "@/lib/learning";
import { db } from "@/lib/db";
import { LearnClient } from "@/components/learn/learn-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await db.course.findUnique({ where: { slug: courseSlug }, select: { title: true } });
  return { title: course ? `Learn · ${course.title}` : "Learn" };
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { courseSlug } = await params;
  const { lesson: requestedLesson } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=/learn/${courseSlug}`);

  const data = await getLearnData(courseSlug, profile.id);

  // No data => course missing, or the user isn't enrolled.
  if (!data) {
    const exists = await db.course.findUnique({ where: { slug: courseSlug }, select: { slug: true } });
    if (!exists) notFound();
    redirect(`/courses/${courseSlug}`); // prompt them to enroll
  }

  if (data.lessons.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">No lessons yet</h1>
        <p className="mt-2 text-ink-soft">This course doesn&apos;t have any lessons published yet.</p>
      </div>
    );
  }

  const active = resolveActiveLesson(data, requestedLesson);

  return <LearnClient data={data} initialLessonId={active!.id} />;
}
