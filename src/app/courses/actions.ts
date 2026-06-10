"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EnrollmentSource, EnrollmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

/**
 * Enroll the current user in a FREE course. Paid enrollment goes through the
 * payment flow (Phase 4); this is a no-op for paid courses.
 */
export async function enrollFree(courseId: string): Promise<void> {
  const profile = await getCurrentProfile();
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) redirect("/courses");

  if (!profile) redirect(`/auth/login?next=/courses/${course.slug}`);
  if (!course.isFree) redirect(`/courses/${course.slug}`);

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: profile.id, courseId } },
    update: {},
    create: {
      userId: profile.id,
      courseId,
      source: EnrollmentSource.FREE,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  revalidatePath(`/courses/${course.slug}`);
  redirect(`/learn/${course.slug}`);
}
