import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Timer, Compass } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentProfile, isOnboarded } from "@/lib/auth";
import { TRACK_BY_CODE, type TrackCode } from "@/lib/tracks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/dashboard");
  if (!isOnboarded(profile)) redirect("/onboarding");

  const enrollments = await db.enrollment.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { course: { include: { subject: { include: { track: true } } } } },
  });

  const track = profile.classTrack ? TRACK_BY_CODE[profile.classTrack as TrackCode] : undefined;
  const firstName = profile.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Namaste, {firstName} 👋
          </h1>
          {track && (
            <p className="mt-2 text-ink-soft">
              Preparing for <span className="font-medium text-ink">{track.title}</span>
              {profile.targetExam ? ` · ${profile.targetExam}` : ""}
            </p>
          )}
        </div>
        <Link href={track ? `/courses?track=${track.code}` : "/courses"}>
          <Button variant="outline" size="sm">
            <Compass /> Explore your track
          </Button>
        </Link>
      </header>

      {/* Continue learning */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Continue learning</h2>
          <Link href="/courses" className="text-sm font-medium text-crimson hover:underline">
            Browse all
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-card border border-dashed border-line bg-paper-2 px-6 py-14 text-center">
            <BookOpen className="size-7 text-ink-soft" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">No courses yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              Enroll in a free course to start learning today.
            </p>
            <Link href="/courses?price=free" className="mt-5">
              <Button>
                Find free courses <ArrowRight />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <div
                key={e.id}
                className="flex h-full flex-col rounded-card border border-line bg-paper p-5 shadow-soft"
              >
                <Badge variant="deep">{e.course.subject.track.short}</Badge>
                <h3 className="mt-3 font-display text-base font-semibold text-ink">
                  {e.course.title}
                </h3>
                <p className="mt-1 text-sm text-ink-soft">{e.course.subject.title}</p>
                {/* Progress bars arrive with the player in Phase 2 */}
                <Link href={`/courses/${e.course.slug}`} className="mt-auto pt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Open course
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mock tests shortcut (engine lands in Phase 3) */}
      <section className="mt-12">
        <div className="flex items-center gap-3 rounded-card border border-line bg-paper-2 p-6">
          <div className="flex size-11 items-center justify-center rounded-card bg-crimson/10 text-crimson">
            <Timer className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-ink">Practise with a mock test</h3>
            <p className="text-sm text-ink-soft">
              Sit a free, full-length CBT and get scored instantly.
            </p>
          </div>
          <Link href="/mock-tests">
            <Button size="sm">
              Mock tests <ArrowRight />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
