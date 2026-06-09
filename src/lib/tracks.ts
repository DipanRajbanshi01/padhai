/**
 * Canonical track + subject taxonomy (brief §2).
 * This is the single source of truth consumed by BOTH the seed script and
 * the UI nav, so tracks are never hardcoded in components ad hoc. The DB is
 * still authoritative at runtime; this drives seeding and static fallbacks.
 */

export type TrackCode =
  | "SEE"
  | "PLUS2_SCIENCE"
  | "PLUS2_MANAGEMENT"
  | "IOE"
  | "CEE"
  | "CSIT"
  | "CMAT"
  | "BACHELOR_BRIDGE";

export interface TrackDef {
  code: TrackCode;
  title: string;
  /** Short label for chips/nav */
  short: string;
  blurb: string;
  /** "exam" tracks are CBT-entrance focused; "school" tracks are curriculum */
  kind: "school" | "entrance" | "bridge";
  subjects: string[];
  order: number;
}

export const TRACKS: TrackDef[] = [
  {
    code: "SEE",
    title: "SEE — Class 9 & 10",
    short: "SEE",
    blurb: "Build a strong GPA. Maths, Opt. Maths, Science, English, Nepali, Social, Computer.",
    kind: "school",
    subjects: [
      "Mathematics",
      "Optional Mathematics",
      "Science",
      "English",
      "Nepali",
      "Social Studies",
      "Computer",
    ],
    order: 1,
  },
  {
    code: "PLUS2_SCIENCE",
    title: "+2 Science — Class 11 & 12",
    short: "+2 Science",
    blurb: "Physics, Chemistry, Biology, Maths and more — the gateway to entrances.",
    kind: "school",
    subjects: [
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
      "Computer Science",
      "English",
      "Nepali",
    ],
    order: 2,
  },
  {
    code: "PLUS2_MANAGEMENT",
    title: "+2 Management — Class 11 & 12",
    short: "+2 Mgmt",
    blurb: "Accountancy, Economics, Business Studies and the management foundation.",
    kind: "school",
    subjects: [
      "Accountancy",
      "Economics",
      "Business Studies",
      "Mathematics",
      "Computer",
      "English",
      "Nepali",
    ],
    order: 3,
  },
  {
    code: "IOE",
    title: "IOE — Engineering Entrance",
    short: "IOE",
    blurb: "CBT-format prep for the IOE engineering entrance. Physics, Chemistry, Maths, English.",
    kind: "entrance",
    subjects: ["Physics", "Chemistry", "Mathematics", "English"],
    order: 4,
  },
  {
    code: "CEE",
    title: "CEE / MECEE-BL — Medical Entrance",
    short: "CEE",
    blurb: "MBBS/BDS/Nursing entrance prep. Physics, Chemistry, Biology with full-length mocks.",
    kind: "entrance",
    subjects: ["Physics", "Chemistry", "Biology"],
    order: 5,
  },
  {
    code: "CSIT",
    title: "BSc CSIT Entrance",
    short: "CSIT",
    blurb: "TU/IOST pattern entrance. Maths, Physics, Aptitude, English.",
    kind: "entrance",
    subjects: ["Mathematics", "Physics", "Aptitude", "English"],
    order: 6,
  },
  {
    code: "CMAT",
    title: "CMAT — BBA / Management Entrance",
    short: "CMAT",
    blurb: "Verbal, Quantitative, Logical and General Awareness for the BBA entrance.",
    kind: "entrance",
    subjects: ["Verbal", "Quantitative", "Logical", "General Awareness"],
    order: 7,
  },
  {
    code: "BACHELOR_BRIDGE",
    title: "Bachelor & Bridge",
    short: "Bridge",
    blurb: "Bachelor semester support and the SEE → +2 bridge course.",
    kind: "bridge",
    subjects: ["Bridge: SEE to +2", "Bachelor Semester Support"],
    order: 8,
  },
];

export const TRACK_BY_CODE: Record<TrackCode, TrackDef> = Object.fromEntries(
  TRACKS.map((t) => [t.code, t]),
) as Record<TrackCode, TrackDef>;
