"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import type { LearnData, LearnLesson } from "@/lib/learning";
import { youtubeId } from "@/lib/youtube";
import { saveLessonProgress } from "@/app/learn/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Load the player only on the client (it touches window/YT). */
const YouTubePlayer = dynamic(
  () => import("@/components/learn/youtube-player").then((m) => m.YouTubePlayer),
  { ssr: false },
);

interface LocalProgress {
  completed: boolean;
  secondsWatched: number;
}

export function LearnClient({ data, initialLessonId }: { data: LearnData; initialLessonId: string }) {
  const [progress, setProgress] = useState<Record<string, LocalProgress>>(() =>
    Object.fromEntries(
      data.lessons.map((l) => [l.id, { completed: l.completed, secondsWatched: l.secondsWatched }]),
    ),
  );
  const [activeId, setActiveId] = useState(initialLessonId);
  const [, startTransition] = useTransition();

  const active = useMemo(
    () => data.lessons.find((l) => l.id === activeId) ?? data.lessons[0],
    [data.lessons, activeId],
  );

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const percent = data.lessons.length
    ? Math.round((completedCount / data.lessons.length) * 100)
    : 0;

  function selectLesson(id: string) {
    setActiveId(id);
    // Update the URL for shareability without re-running the server component.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lesson", id);
      window.history.replaceState(null, "", url.toString());
    }
  }

  function persist(lessonId: string, seconds: number, completed: boolean) {
    setProgress((prev) => {
      const cur = prev[lessonId] ?? { completed: false, secondsWatched: 0 };
      return {
        ...prev,
        [lessonId]: {
          completed: cur.completed || completed,
          secondsWatched: Math.max(cur.secondsWatched, seconds),
        },
      };
    });
    startTransition(async () => {
      await saveLessonProgress({ lessonId, secondsWatched: seconds, completed });
    });
  }

  function toggleComplete(lesson: LearnLesson) {
    const next = !(progress[lesson.id]?.completed ?? false);
    setProgress((prev) => ({
      ...prev,
      [lesson.id]: {
        completed: next,
        secondsWatched: prev[lesson.id]?.secondsWatched ?? 0,
      },
    }));
    startTransition(async () => {
      await saveLessonProgress({
        lessonId: lesson.id,
        secondsWatched: progress[lesson.id]?.secondsWatched ?? 0,
        completed: next,
      });
    });
  }

  const prevLesson = active ? data.lessons[active.index - 1] : undefined;
  const nextLesson = active ? data.lessons[active.index + 1] : undefined;
  const vid = youtubeId(active?.videoUrl);
  const activeDone = active ? (progress[active.id]?.completed ?? false) : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/courses/${data.course.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-crimson"
          >
            <ArrowLeft className="size-4" /> {data.course.title}
          </Link>
          <p className="mt-1 text-xs text-ink-soft">
            {data.course.trackShort} · {data.course.subjectTitle}
          </p>
        </div>
        <div className="min-w-48">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>Progress</span>
            <span className="font-semibold text-teal">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Player + lesson */}
        <div>
          {active && vid ? (
            <YouTubePlayerMount
              key={active.id}
              lesson={active}
              startSeconds={progress[active.id]?.secondsWatched ?? 0}
              completed={activeDone}
              onProgress={(seconds, finished) => persist(active.id, seconds, finished)}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-card border border-dashed border-line bg-paper-2 text-sm text-ink-soft">
              This lesson has no video yet.
            </div>
          )}

          {active && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {active.chapterTitle}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{active.title}</h1>

              {active.content && (
                <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{active.content}</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  variant={activeDone ? "outline" : "primary"}
                  onClick={() => toggleComplete(active)}
                >
                  <CheckCircle2 />
                  {activeDone ? "Completed — undo" : "Mark as complete"}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && selectLesson(prevLesson.id)}
                  >
                    <ChevronLeft /> Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && selectLesson(nextLesson.id)}
                  >
                    Next <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-card border border-line bg-paper shadow-soft">
            <div className="border-b border-line px-4 py-3">
              <p className="font-display text-sm font-semibold text-ink">Course content</p>
              <p className="text-xs text-ink-soft">
                {completedCount} / {data.lessons.length} lessons complete
              </p>
            </div>
            <div className="divide-y divide-line">
              {data.chapters.map((chapter, ci) => (
                <div key={chapter.id} className="py-2">
                  <p className="px-4 py-1.5 text-xs font-semibold text-ink-soft">
                    Chapter {ci + 1}: {chapter.title}
                  </p>
                  <ul>
                    {chapter.lessons.map((lesson) => {
                      const done = progress[lesson.id]?.completed ?? false;
                      const isActive = lesson.id === active?.id;
                      return (
                        <li key={lesson.id}>
                          <button
                            onClick={() => selectLesson(lesson.id)}
                            className={cn(
                              "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors",
                              isActive ? "bg-crimson/5 text-crimson-deep" : "text-ink hover:bg-paper-2",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="size-4 shrink-0 text-teal" />
                            ) : isActive ? (
                              <PlayCircle className="size-4 shrink-0 text-crimson" />
                            ) : (
                              <Circle className="size-4 shrink-0 text-ink-soft/50" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            <span className="text-xs text-ink-soft">
                              {Math.max(1, Math.round(lesson.durationSec / 60))}m
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-pill bg-paper-2">
      <div
        className="h-full rounded-pill bg-teal transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function YouTubePlayerMount({
  lesson,
  startSeconds,
  completed,
  onProgress,
}: {
  lesson: LearnLesson;
  startSeconds: number;
  completed: boolean;
  onProgress: (seconds: number, finished: boolean) => void;
}) {
  const vid = youtubeId(lesson.videoUrl)!;
  return (
    <YouTubePlayer
      videoId={vid}
      startSeconds={startSeconds}
      resume={!completed}
      onProgress={onProgress}
    />
  );
}
