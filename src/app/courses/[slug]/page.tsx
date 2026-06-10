import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Clock,
  PlayCircle,
  Lock,
  CheckCircle2,
  GraduationCap,
  Layers,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCourseBySlug, summariseCourse } from "@/lib/catalog";
import { getCurrentProfile } from "@/lib/auth";
import { enrollFree } from "@/app/courses/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/submit-button";
import { formatNpr } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found" };
  return { title: course.title, description: course.description ?? undefined };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || !course.published) notFound();

  const summary = summariseCourse(course);
  const profile = await getCurrentProfile();
  const enrollment = profile
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId: profile.id, courseId: course.id } },
      })
    : null;
  const isEnrolled = !!enrollment;

  const track = course.subject.track;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/courses" className="hover:text-crimson">
          Courses
        </Link>
        <span className="px-2">/</span>
        <Link href={`/courses?track=${track.code}`} className="hover:text-crimson">
          {track.short}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="deep">{track.title}</Badge>
            <Badge variant="neutral">{course.subject.title}</Badge>
            {course.isFree && <Badge variant="teal">Free</Badge>}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-4 max-w-2xl text-lg text-ink-soft">{course.description}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-5 text-sm text-ink-soft">
            <Stat icon={Layers} label={`${summary.chapterCount} chapters`} />
            <Stat icon={BookOpen} label={`${summary.lessonCount} lessons`} />
            <Stat icon={Clock} label={`${summary.totalMinutes} min`} />
            {course.level && <Stat icon={GraduationCap} label={course.level} />}
          </div>

          {/* Syllabus */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">Syllabus</h2>
            <div className="mt-4 space-y-4">
              {course.chapters.map((chapter, ci) => (
                <div key={chapter.id} className="rounded-card border border-line bg-paper shadow-soft">
                  <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h3 className="font-display text-base font-semibold text-ink">
                      <span className="text-ink-soft">Chapter {ci + 1}.</span> {chapter.title}
                    </h3>
                    <span className="text-xs text-ink-soft">{chapter.lessons.length} lessons</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {chapter.lessons.map((lesson) => {
                      const open = lesson.isFreePreview || isEnrolled;
                      const inner = (
                        <div className="flex items-center gap-3 px-5 py-3">
                          {open ? (
                            <PlayCircle className="size-4 shrink-0 text-crimson" />
                          ) : (
                            <Lock className="size-4 shrink-0 text-ink-soft" />
                          )}
                          <span className={open ? "text-ink" : "text-ink-soft"}>{lesson.title}</span>
                          {lesson.isFreePreview && <Badge variant="teal">Preview</Badge>}
                          <span className="ml-auto text-xs text-ink-soft">
                            {Math.max(1, Math.round(lesson.durationSec / 60))} min
                          </span>
                        </div>
                      );
                      // Free preview opens the external video now; full player is Phase 2.
                      return (
                        <li key={lesson.id}>
                          {lesson.isFreePreview && lesson.videoUrl ? (
                            <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="block hover:bg-paper-2">
                              {inner}
                            </a>
                          ) : (
                            inner
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Enroll panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-paper p-6 shadow-soft">
            <div className="font-display text-3xl font-semibold text-ink">
              {course.isFree ? "Free" : formatNpr(course.priceNpr)}
            </div>

            <div className="mt-5">
              {isEnrolled ? (
                <Link href={`/learn/${course.slug}`} className="block">
                  <Button size="lg" variant="deep" className="w-full">
                    <CheckCircle2 /> Continue learning
                  </Button>
                </Link>
              ) : course.isFree ? (
                <form action={enrollFree.bind(null, course.id)}>
                  <SubmitButton size="lg" className="w-full">
                    Enroll for free
                  </SubmitButton>
                </form>
              ) : (
                <Link href="/pricing" className="block">
                  <Button size="lg" className="w-full">
                    Enroll — {formatNpr(course.priceNpr)}
                  </Button>
                </Link>
              )}
            </div>

            <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
              {[
                `${summary.lessonCount} video lessons`,
                "Nepali-medium teaching",
                "Resume where you left off",
                summary.freePreview ? "Free preview lesson" : "Curriculum-mapped",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal" /> {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Instructor
              </p>
              <p className="mt-2 font-medium text-ink">{course.instructorName ?? "Padhai Faculty"}</p>
              {course.instructorBio && (
                <p className="mt-1 text-sm text-ink-soft">{course.instructorBio}</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4" /> {label}
    </span>
  );
}
