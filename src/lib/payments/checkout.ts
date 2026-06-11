import { db } from "@/lib/db";
import { ProductType, EnrollmentSource, EnrollmentStatus, PaymentStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type ProductRef =
  | { type: "course"; slug: string }
  | { type: "bundle"; slug: string };

export interface ResolvedProduct {
  kind: ProductType;
  id: string;
  slug: string;
  name: string;
  amountNpr: number;
  isFree: boolean;
  trackShort: string;
  /** courses included (1 for a course, many for a bundle) */
  courseCount: number;
  courseSlug?: string;
}

/** Resolve a checkout target (course or bundle) into pricing + metadata. */
export async function resolveProduct(ref: ProductRef): Promise<ResolvedProduct | null> {
  if (ref.type === "course") {
    const course = await db.course.findUnique({
      where: { slug: ref.slug },
      include: { subject: { include: { track: true } } },
    });
    if (!course) return null;
    return {
      kind: ProductType.COURSE,
      id: course.id,
      slug: course.slug,
      name: course.title,
      amountNpr: course.priceNpr,
      isFree: course.isFree,
      trackShort: course.subject.track.short,
      courseCount: 1,
      courseSlug: course.slug,
    };
  }

  const bundle = await db.bundle.findUnique({
    where: { slug: ref.slug },
    include: { track: true, _count: { select: { courses: true } } },
  });
  if (!bundle) return null;
  return {
    kind: ProductType.BUNDLE,
    id: bundle.id,
    slug: bundle.slug,
    name: bundle.title,
    amountNpr: bundle.priceNpr,
    isFree: bundle.priceNpr <= 0,
    trackShort: bundle.track?.short ?? "Bundle",
    courseCount: bundle._count.courses,
  };
}

/** Course ids granted by a payment (the course, or every course in the bundle). */
async function coursesForPayment(payment: {
  courseId: string | null;
  bundleId: string | null;
}): Promise<string[]> {
  if (payment.courseId) return [payment.courseId];
  if (payment.bundleId) {
    const links = await db.bundleCourse.findMany({
      where: { bundleId: payment.bundleId },
      select: { courseId: true },
    });
    return links.map((l) => l.courseId);
  }
  return [];
}

/**
 * Mark a payment PAID and grant enrollments. Idempotent — safe to call from
 * both the gateway callback and any retry. Returns true if it (now) succeeded.
 */
export async function fulfillPayment(paymentId: string, raw?: unknown): Promise<boolean> {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return false;
  if (payment.status === PaymentStatus.PAID) return true;

  const courseIds = await coursesForPayment(payment);
  const rawJson = raw as Prisma.InputJsonValue | undefined;

  await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PAID, paidAt: new Date(), ...(rawJson ? { raw: rawJson } : {}) },
    }),
    ...courseIds.map((courseId) =>
      db.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId } },
        update: { status: EnrollmentStatus.ACTIVE },
        create: {
          userId: payment.userId,
          courseId,
          source: payment.bundleId ? EnrollmentSource.BUNDLE : EnrollmentSource.PURCHASE,
          status: EnrollmentStatus.ACTIVE,
        },
      }),
    ),
  ]);
  return true;
}

/** Mark a payment FAILED (stores the gateway payload for audit). */
export async function failPayment(paymentId: string, raw?: unknown): Promise<void> {
  const rawJson = raw as Prisma.InputJsonValue | undefined;
  await db.payment.updateMany({
    where: { id: paymentId, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.FAILED, ...(rawJson ? { raw: rawJson } : {}) },
  });
}

/** Published bundles for the pricing page. */
export async function getBundles() {
  return db.bundle.findMany({
    where: { published: true },
    orderBy: [{ track: { order: "asc" } }],
    include: { track: true, _count: { select: { courses: true } } },
  });
}
