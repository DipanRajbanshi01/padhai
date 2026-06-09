import type { Metadata } from "next";
import { Suspense } from "react";
import { BookX } from "lucide-react";
import { getCatalog, type CatalogFilters } from "@/lib/catalog";
import { CatalogFilters as Filters } from "@/components/courses/catalog-filters";
import { CourseCard } from "@/components/courses/course-card";
import { TRACK_BY_CODE, type TrackCode } from "@/lib/tracks";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse recorded courses across SEE, +2 and the major entrance exams.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: CatalogFilters = {
    track: typeof sp.track === "string" ? sp.track : undefined,
    subject: typeof sp.subject === "string" ? sp.subject : undefined,
    price: sp.price === "free" || sp.price === "paid" ? sp.price : undefined,
    q: typeof sp.q === "string" ? sp.q : undefined,
  };

  const courses = await getCatalog(filters);
  const track = filters.track ? TRACK_BY_CODE[filters.track as TrackCode] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          {track ? track.title : "All courses"}
        </h1>
        <p className="mt-3 text-ink-soft">
          {track
            ? track.blurb
            : "Curriculum-mapped, Nepali-medium courses from Class 9 through the entrance exams."}
        </p>
      </header>

      <div className="mt-8">
        <Suspense fallback={<div className="h-32" />}>
          <Filters />
        </Suspense>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        {courses.length} course{courses.length === 1 ? "" : "s"}
      </p>

      {courses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-card border border-dashed border-line bg-paper-2 px-6 py-16 text-center">
      <BookX className="size-8 text-ink-soft" />
      <p className="mt-4 font-display text-lg font-semibold text-ink">No courses match those filters</p>
      <p className="mt-1 text-sm text-ink-soft">Try clearing the filters or searching for something else.</p>
    </div>
  );
}
