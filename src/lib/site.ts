/**
 * Single source of truth for brand/site identity.
 * Brand name is a placeholder per brief §5 — change it here only.
 */
export const site = {
  /** Latin wordmark */
  name: "Padhai",
  /** Devanagari wordmark (rendered with Tiro Devanagari Hindi) */
  nameNe: "पढाइ",
  tagline: "Learn. Practise. Pass.",
  taglineNe: "सिक। अभ्यास गर। पास गर।",
  description:
    "Recorded courses and CBT mock tests for Nepali students — SEE, +2, and entrance exams (IOE, CEE, CSIT, CMAT).",
  /** Default currency for all pricing */
  currency: "NPR",
  locale: "en", // 'en' | 'ne' — i18n toggle default
  contactEmail: "hello@padhai.example",
} as const;

export type Site = typeof site;
