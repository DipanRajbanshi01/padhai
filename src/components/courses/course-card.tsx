import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNpr } from "@/lib/utils";
import type { CatalogCourse } from "@/lib/catalog";

export function CourseCard({ course }: { course: CatalogCourse }) {
  const track = course.subject.track;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-crimson/30 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="deep">{track.short}</Badge>
        {course.isFree ? (
          <Badge variant="teal">Free</Badge>
        ) : (
          <span className="font-display text-lg font-semibold text-ink">
            {formatNpr(course.priceNpr)}
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-ink group-hover:text-crimson-deep">
        {course.title}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">{course.subject.title}</p>

      {course.description ? (
        <p className="mt-3 line-clamp-2 flex-1 text-sm text-ink-soft">{course.description}</p>
      ) : (
        <div className="flex-1" />
      )}

      <div className="mt-5 flex items-center gap-4 border-t border-line pt-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5" /> {course._count.chapters} chapters
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" /> {course._count.enrollments} enrolled
        </span>
      </div>
    </Link>
  );
}
