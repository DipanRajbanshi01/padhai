/**
 * Seed script — gives the app a demoable catalog immediately (brief §7):
 * all tracks + subjects, a flagship course (chapters/lessons) per track, a
 * per-track bundle, and one FREE full mock test (~10 questions incl. KaTeX
 * math + an image) per track, plus demo users.
 *
 * Run: `npm run db:seed` (wraps `prisma db seed`). DEV ONLY — it wipes the
 * catalog/attempt tables first so reseeding is clean.
 */
import {
  PrismaClient,
  TrackKind,
  QuestionType,
  Role,
  EnrollmentSource,
  EnrollmentStatus,
} from "@prisma/client";
import { TRACKS, type TrackDef } from "../src/lib/tracks";

const db = new PrismaClient();

function kindEnum(kind: TrackDef["kind"]): TrackKind {
  return kind === "entrance" ? TrackKind.ENTRANCE : kind === "bridge" ? TrackKind.BRIDGE : TrackKind.SCHOOL;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const PLACEHOLDER_VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // unlisted placeholder
const PLACEHOLDER_DIAGRAM = "https://placehold.co/640x320/16314a/fbf6ec?text=Diagram";

/* ----------------------- Mock-test question factory ----------------------- */

interface SeedOption {
  body: string;
  isCorrect?: boolean;
}
interface SeedQuestion {
  body: string;
  options: SeedOption[];
  explanation: string;
  topic: string;
  type?: QuestionType;
  imageUrl?: string;
}

/** Build ~10 believable questions for a track, including math + one image. */
function buildQuestions(track: TrackDef): SeedQuestion[] {
  const topics = track.subjects;
  const t = (i: number) => topics[i % topics.length];

  const questions: SeedQuestion[] = [
    {
      topic: t(0),
      body: "Solve for $x$: $x^2 - 5x + 6 = 0$.",
      explanation: "Factor as $(x-2)(x-3)=0$, so $x = 2$ or $x = 3$.",
      options: [
        { body: "$x = 2,\\ 3$", isCorrect: true },
        { body: "$x = -2,\\ -3$" },
        { body: "$x = 1,\\ 6$" },
        { body: "$x = 0,\\ 5$" },
      ],
    },
    {
      topic: t(1),
      body: "A projectile is launched at angle $\\theta$. Its horizontal range is maximum when $\\theta$ equals:",
      explanation: "Range $R = \\frac{v^2 \\sin 2\\theta}{g}$ is maximised when $\\sin 2\\theta = 1$, i.e. $\\theta = 45^\\circ$.",
      options: [
        { body: "$30^\\circ$" },
        { body: "$45^\\circ$", isCorrect: true },
        { body: "$60^\\circ$" },
        { body: "$90^\\circ$" },
      ],
    },
    {
      topic: t(1),
      imageUrl: PLACEHOLDER_DIAGRAM,
      body: "From the circuit shown in the diagram, the equivalent resistance between the terminals is closest to:",
      explanation: "Combine the series and parallel branches shown to get the equivalent resistance.",
      options: [
        { body: "$2\\,\\Omega$" },
        { body: "$4\\,\\Omega$", isCorrect: true },
        { body: "$6\\,\\Omega$" },
        { body: "$8\\,\\Omega$" },
      ],
    },
    {
      topic: t(2 % topics.length),
      body: "The derivative of $\\sin x$ with respect to $x$ is:",
      explanation: "$\\frac{d}{dx}\\sin x = \\cos x$.",
      options: [
        { body: "$\\cos x$", isCorrect: true },
        { body: "$-\\cos x$" },
        { body: "$\\tan x$" },
        { body: "$-\\sin x$" },
      ],
    },
    {
      topic: t(0),
      body: "If $\\log_{10} 2 \\approx 0.301$, then $\\log_{10} 8$ is approximately:",
      explanation: "$\\log 8 = 3\\log 2 \\approx 3 \\times 0.301 = 0.903$.",
      options: [
        { body: "$0.903$", isCorrect: true },
        { body: "$0.602$" },
        { body: "$1.204$" },
        { body: "$0.301$" },
      ],
    },
    {
      topic: t(3 % topics.length),
      body: "Choose the option that best completes the sentence: \"She has been studying ___ five hours.\"",
      explanation: "\"for\" is used with a duration of time.",
      options: [
        { body: "since" },
        { body: "for", isCorrect: true },
        { body: "from" },
        { body: "during" },
      ],
    },
    {
      topic: t(1),
      body: "The SI unit of electric charge is the:",
      explanation: "Charge is measured in coulombs (C).",
      options: [
        { body: "Ampere" },
        { body: "Coulomb", isCorrect: true },
        { body: "Volt" },
        { body: "Ohm" },
      ],
    },
    {
      topic: t(2 % topics.length),
      body: "Evaluate $\\displaystyle \\int_0^1 2x\\,dx$.",
      explanation: "$\\int_0^1 2x\\,dx = [x^2]_0^1 = 1$.",
      options: [
        { body: "$0$" },
        { body: "$1$", isCorrect: true },
        { body: "$2$" },
        { body: "$\\tfrac{1}{2}$" },
      ],
    },
    {
      topic: t(0),
      body: "The value of $\\binom{5}{2}$ is:",
      explanation: "$\\binom{5}{2} = \\frac{5!}{2!\\,3!} = 10$.",
      options: [
        { body: "$10$", isCorrect: true },
        { body: "$20$" },
        { body: "$15$" },
        { body: "$5$" },
      ],
    },
    {
      topic: t(1),
      body: "Which quantity is a vector?",
      explanation: "Velocity has both magnitude and direction; the others are scalars.",
      options: [
        { body: "Speed" },
        { body: "Velocity", isCorrect: true },
        { body: "Mass" },
        { body: "Temperature" },
      ],
    },
  ];

  return questions;
}

/* --------------------------------- Seed --------------------------------- */

async function main() {
  console.log("🌱 Seeding Padhai…");

  // Clean (dev only) — order respects FKs.
  await db.attemptAnswer.deleteMany();
  await db.attempt.deleteMany();
  await db.questionOption.deleteMany();
  await db.question.deleteMany();
  await db.mockTest.deleteMany();
  await db.lessonProgress.deleteMany();
  await db.lesson.deleteMany();
  await db.chapter.deleteMany();
  await db.bundleCourse.deleteMany();
  await db.enrollment.deleteMany();
  await db.payment.deleteMany();
  await db.bundle.deleteMany();
  await db.course.deleteMany();
  await db.paper.deleteMany();
  await db.subject.deleteMany();
  await db.track.deleteMany();
  await db.otpCode.deleteMany();
  await db.user.deleteMany();

  // Demo users
  const student = await db.user.create({
    data: {
      email: "student@padhai.test",
      name: "Demo Student",
      role: Role.STUDENT,
      classTrack: "SEE",
      targetExam: "SEE",
      location: "Kathmandu",
    },
  });
  await db.user.create({
    data: { email: "admin@padhai.test", name: "Demo Admin", role: Role.ADMIN },
  });
  console.log("  • users: student@padhai.test, admin@padhai.test");

  for (const track of TRACKS) {
    const created = await db.track.create({
      data: {
        code: track.code,
        title: track.title,
        short: track.short,
        blurb: track.blurb,
        kind: kindEnum(track.kind),
        order: track.order,
        subjects: {
          create: track.subjects.map((title, i) => ({ title, order: i })),
        },
      },
      include: { subjects: { orderBy: { order: "asc" } } },
    });

    // Flagship courses in the first up-to-two subjects.
    const courseSubjects = created.subjects.slice(0, 2);
    const courseIds: string[] = [];

    for (let ci = 0; ci < courseSubjects.length; ci++) {
      const subject = courseSubjects[ci];
      const isFlagshipFree = ci === 0 && track.kind === "school"; // a free taster per school track
      const course = await db.course.create({
        data: {
          subjectId: subject.id,
          slug: slugify(`${track.code}-${subject.title}`),
          title: `${subject.title} — ${track.short}`,
          description: `A complete, curriculum-mapped ${subject.title} course for ${track.title}. Taught in Nepali, with chapter-wise videos and practice.`,
          priceNpr: isFlagshipFree ? 0 : track.kind === "entrance" ? 2999 : 1499,
          isFree: isFlagshipFree,
          instructorName: "Padhai Faculty",
          instructorBio: "Experienced Nepali-medium instructors mapped to the NEB/CDC curriculum.",
          level: track.kind === "school" ? "Class 10/12" : "Entrance",
          order: ci,
          chapters: {
            create: [0, 1].map((chIdx) => ({
              title: `Chapter ${chIdx + 1}: ${subject.title} Foundations ${chIdx + 1}`,
              order: chIdx,
              lessons: {
                create: [0, 1, 2].map((lIdx) => ({
                  title: `Lesson ${chIdx + 1}.${lIdx + 1}`,
                  videoUrl: PLACEHOLDER_VIDEO,
                  durationSec: 600 + lIdx * 120,
                  // First lesson of the first chapter is a free preview.
                  isFreePreview: chIdx === 0 && lIdx === 0,
                  order: lIdx,
                })),
              },
            })),
          },
        },
      });
      courseIds.push(course.id);
    }

    // Per-track bundle ("All <track>") grouping its flagship courses.
    if (courseIds.length > 0) {
      await db.bundle.create({
        data: {
          trackId: created.id,
          slug: slugify(`all-${track.code}`),
          title: `All ${track.short}`,
          description: `Every ${track.short} course in one discounted package.`,
          priceNpr: track.kind === "entrance" ? 4999 : 2499,
          courses: { create: courseIds.map((courseId) => ({ courseId })) },
        },
      });
    }

    // One FREE full mock test per track (free sample test, brief §3).
    const mockSubjectId = created.subjects[0]?.id ?? null;
    const seedQs = buildQuestions(track);
    await db.mockTest.create({
      data: {
        trackId: created.id,
        subjectId: mockSubjectId,
        slug: slugify(`${track.code}-mock-1`),
        title: `${track.short} Mock Test 1`,
        description: `A full-length CBT mock for ${track.title} with instant scoring and explanations.`,
        durationMin: track.kind === "entrance" ? 60 : 45,
        negativeMarking: track.kind === "entrance" ? 0.25 : 0,
        defaultMarks: 1,
        isFree: true,
        order: 0,
        questions: {
          create: seedQs.map((q, qi) => ({
            order: qi,
            type: q.type ?? QuestionType.SINGLE_CHOICE,
            body: q.body,
            imageUrl: q.imageUrl,
            explanation: q.explanation,
            marks: 1,
            topic: q.topic,
            options: {
              create: q.options.map((o, oi) => ({
                body: o.body,
                isCorrect: !!o.isCorrect,
                order: oi,
              })),
            },
          })),
        },
      },
    });

    console.log(`  • ${track.short}: ${courseIds.length} course(s) + bundle + 1 free mock`);
  }

  // Enroll the demo student into the first free SEE course for a populated dashboard.
  const freeCourse = await db.course.findFirst({ where: { isFree: true }, orderBy: { createdAt: "asc" } });
  if (freeCourse) {
    await db.enrollment.create({
      data: {
        userId: student.id,
        courseId: freeCourse.id,
        status: EnrollmentStatus.ACTIVE,
        source: EnrollmentSource.FREE,
      },
    });
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
