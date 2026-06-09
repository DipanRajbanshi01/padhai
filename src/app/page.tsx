import Link from "next/link";
import {
  GraduationCap,
  Timer,
  ListChecks,
  BarChart3,
  Sigma,
  FileText,
  PlayCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TRACKS } from "@/lib/tracks";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <TracksSection />
      <MockEngineSection />
      <HowItWorks />
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* warm radial wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(242,165,22,0.18) 0%, rgba(242,165,22,0) 70%), radial-gradient(40% 40% at 85% 10%, rgba(197,19,46,0.10) 0%, rgba(197,19,46,0) 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-paper px-4 py-1.5 text-xs font-medium text-ink-soft shadow-soft">
            <span className="size-1.5 rounded-pill bg-teal" />
            Curriculum-mapped • Nepali-medium • CBT mock tests
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Pass the exam that{" "}
            <span className="relative whitespace-nowrap text-crimson">
              opens the next door
              <Underline />
            </span>
            .
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft">
            Recorded courses and serious CBT mock tests for{" "}
            <strong className="font-semibold text-ink">SEE, +2, and the big entrances</strong> —
            IOE, CEE, CSIT and CMAT. Learn at your pace, then practise like it&apos;s exam day.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/courses">
              <Button size="lg">
                Explore courses <ArrowRight />
              </Button>
            </Link>
            <Link href="/mock-tests">
              <Button size="lg" variant="outline">
                <Timer /> Try a free mock test
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Free tier: sample lessons + one full mock test per track. No card needed.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Underline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 12"
      className="absolute -bottom-1 left-0 h-3 w-full text-marigold"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8 C 80 2, 220 2, 298 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */
function TrustStrip() {
  const stats = [
    { value: "8", label: "Exam tracks" },
    { value: "CBT", label: "Real test patterns" },
    { value: "नेपाली", label: "Medium teaching", devanagari: true },
    { value: "100%", label: "Curriculum-mapped" },
  ];
  return (
    <section className="border-y border-line bg-paper-2">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-8 sm:px-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 80} className="px-2 text-center">
            <div
              className={`font-display text-3xl font-semibold text-crimson ${
                s.devanagari ? "font-devanagari" : ""
              }`}
            >
              {s.value}
            </div>
            <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tracks                                                              */
/* ------------------------------------------------------------------ */
function TracksSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <ScrollReveal className="max-w-2xl">
        <SectionKicker>The full journey</SectionKicker>
        <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          From Class 9 to the entrance hall
        </h2>
        <p className="mt-4 text-ink-soft">
          Every gate that matters in Nepal&apos;s system — choose your track and follow a clear,
          curriculum-mapped path.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t, i) => (
          <ScrollReveal key={t.code} delay={(i % 3) * 90}>
            <Link
              href={`/courses?track=${t.code}`}
              className="group flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-crimson/30 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex rounded-pill px-3 py-1 text-xs font-semibold ${kindStyle(
                    t.kind,
                  )}`}
                >
                  {t.kind === "entrance" ? "Entrance" : t.kind === "bridge" ? "Bridge" : "School"}
                </span>
                <GraduationCap className="size-5 text-ink-soft transition-colors group-hover:text-crimson" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{t.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{t.blurb}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {t.subjects.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="rounded-pill bg-paper-2 px-2.5 py-1 text-xs text-ink-soft"
                  >
                    {s}
                  </span>
                ))}
                {t.subjects.length > 4 && (
                  <span className="rounded-pill bg-paper-2 px-2.5 py-1 text-xs text-ink-soft">
                    +{t.subjects.length - 4}
                  </span>
                )}
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function kindStyle(kind: "school" | "entrance" | "bridge") {
  switch (kind) {
    case "entrance":
      return "bg-crimson/10 text-crimson-deep";
    case "bridge":
      return "bg-deep/10 text-deep";
    default:
      return "bg-teal/10 text-teal";
  }
}

/* ------------------------------------------------------------------ */
/* Mock-test engine — the core differentiator                         */
/* ------------------------------------------------------------------ */
function MockEngineSection() {
  const features = [
    {
      icon: Timer,
      title: "Timed, exam-accurate",
      body: "Real CBT patterns for IOE, CEE, CSIT and CMAT — with the same clock pressure.",
    },
    {
      icon: ListChecks,
      title: "Question palette",
      body: "Answered, unanswered and marked-for-review at a glance. Jump anywhere instantly.",
    },
    {
      icon: Sigma,
      title: "Math & diagrams",
      body: "Crisp KaTeX equations and per-question images for physics and chemistry.",
    },
    {
      icon: BarChart3,
      title: "Instant analysis",
      body: "Score the moment you submit — topic breakdown, time per question, full explanations.",
    },
  ];
  return (
    <section className="bg-deep text-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-pill bg-paper/10 px-3 py-1 text-xs font-medium text-marigold">
              The core of {site.name}
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              A mock-test engine built like the real thing
            </h2>
            <p className="mt-4 max-w-lg text-paper/75">
              This is what wins exam season. Sit a full-length CBT, get scored instantly, and see
              exactly which topics to fix next. Your answers autosave — a dropped connection never
              costs you a test.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-card bg-paper/10 text-marigold">
                    <f.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-paper">{f.title}</h3>
                    <p className="mt-1 text-sm text-paper/70">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/mock-tests" className="mt-9 inline-block">
              <Button size="lg" variant="accent">
                Take a free mock test <ArrowRight />
              </Button>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <MockPreviewCard />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

/** Static visual mock-up of the CBT runner (illustrative, not interactive). */
function MockPreviewCard() {
  const palette = [
    "done",
    "done",
    "review",
    "current",
    "todo",
    "todo",
    "done",
    "todo",
    "review",
    "todo",
  ] as const;
  const paletteColor: Record<(typeof palette)[number], string> = {
    done: "bg-teal text-paper",
    review: "bg-marigold text-ink",
    current: "bg-crimson text-paper ring-2 ring-paper",
    todo: "bg-paper/15 text-paper/70",
  };
  return (
    <div className="rounded-card bg-paper p-5 text-ink shadow-lift">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-xs font-semibold text-ink-soft">IOE Mock — Physics</span>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-crimson/10 px-3 py-1 text-xs font-semibold text-crimson-deep">
          <Timer className="size-3.5" /> 58:24
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-ink-soft">Question 4 of 10</p>
        <p className="mt-2 font-medium text-ink">
          A body is thrown with velocity <em>v</em> at angle θ. Its range is maximum when θ equals:
        </p>
        <div className="mt-4 space-y-2">
          {["30°", "45°", "60°", "90°"].map((opt, i) => (
            <div
              key={opt}
              className={`flex items-center gap-3 rounded-card border px-3 py-2.5 text-sm ${
                i === 1
                  ? "border-crimson bg-crimson/5 font-medium text-ink"
                  : "border-line text-ink-soft"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-pill text-xs ${
                  i === 1 ? "bg-crimson text-paper" : "bg-paper-2 text-ink-soft"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold text-ink-soft">Question palette</p>
        <div className="grid grid-cols-10 gap-1.5">
          {palette.map((state, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold ${paletteColor[state]}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */
function HowItWorks() {
  const steps = [
    {
      icon: PlayCircle,
      title: "Learn from recorded courses",
      body: "Chapter-by-chapter video lessons in Nepali, with resume-where-you-left-off and progress ticks.",
    },
    {
      icon: Timer,
      title: "Practise with CBT mocks",
      body: "Full-length and chapter-wise tests that mirror the real exam, scored the instant you submit.",
    },
    {
      icon: FileText,
      title: "Review past papers",
      body: "Solved past and model papers by subject and chapter, downloadable as PDF.",
    },
    {
      icon: BarChart3,
      title: "Track your progress",
      body: "Watch your scores trend up and see which topics still need work before the real day.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <ScrollReveal className="max-w-2xl">
        <SectionKicker>How it works</SectionKicker>
        <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          A clear path, all the way to the result
        </h2>
      </ScrollReveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <ScrollReveal key={s.title} delay={(i % 4) * 80}>
            <div className="flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-card bg-marigold/15 text-crimson">
                <s.icon className="size-5" />
              </div>
              <div className="mt-4 text-xs font-semibold text-ink-soft">Step {i + 1}</div>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */
function FinalCta() {
  const points = [
    "Sample lessons free in every track",
    "One full mock test, free, per track",
    "Pay in NPR with eSewa or Khalti",
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-card bg-crimson px-6 py-14 text-center text-paper shadow-lift sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0 opacity-30"
            style={{
              background:
                "radial-gradient(50% 60% at 80% 0%, rgba(242,165,22,0.6) 0%, rgba(242,165,22,0) 70%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
              Start free today. Walk in ready on exam day.
            </h2>
            <div className="mx-auto mt-7 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              {points.map((p) => (
                <span key={p} className="inline-flex items-center gap-2 text-sm text-paper/90">
                  <CheckCircle2 className="size-4 text-marigold" /> {p}
                </span>
              ))}
            </div>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" variant="accent">
                  Create a free account <ArrowRight />
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-paper/40 text-paper hover:bg-paper/10"
                >
                  Browse courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-crimson">
      <span className="h-px w-6 bg-crimson" />
      {children}
    </span>
  );
}
