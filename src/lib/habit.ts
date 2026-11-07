import { coreLetters } from "../data/alphabet";
import { units, coreUnitCount } from "../data/curriculum";
import { DAY, localDay, streak } from "./progress";
import type { Progress } from "../types";

/** XP rules: 1 per answer, +1 if correct, +5 per finished lesson, +5 if perfect. */
export const XP = { answer: 1, correct: 1, lesson: 5, perfect: 5, rating: 1 };
export const MAX_FREEZES = 2;
/** A rest day is earned on each 5th consecutive day the goal is reached. */
export const FREEZE_EVERY = 5;

export const xpToday = (p: Progress, now = Date.now()) =>
  p.xp?.[localDay(now)] ?? 0;
export const currentStreak = (p: Progress, now = Date.now()) =>
  streak(p.studyDays, now, p.frozenDays ?? []);

/**
 * Adds XP for today. Crossing the daily goal on a streak day divisible by
 * FREEZE_EVERY earns a rest day (up to MAX_FREEZES).
 */
export function addXp(p: Progress, amount: number, now = Date.now()): Progress {
  const today = localDay(now);
  const before = p.xp?.[today] ?? 0;
  const after = before + amount;
  const studyDays = p.studyDays.includes(today)
    ? p.studyDays
    : [...p.studyDays, today];
  let freezes = p.freezes ?? 0;
  const goal = p.preferences.dailyGoal;
  if (before < goal && after >= goal) {
    const s = streak(studyDays, now, p.frozenDays ?? []);
    if (s > 0 && s % FREEZE_EVERY === 0)
      freezes = Math.min(MAX_FREEZES, freezes + 1);
  }
  return { ...p, xp: { ...p.xp, [today]: after }, studyDays, freezes };
}

/**
 * Spends rest days on missed days since the last practice, if there are
 * enough to cover the whole gap. Run once when progress loads.
 */
export function applyFreezes(p: Progress, now = Date.now()): Progress {
  const freezes = p.freezes ?? 0;
  const covered = new Set([...p.studyDays, ...(p.frozenDays ?? [])]);
  if (!freezes || !covered.size) return p;
  const missed: string[] = [];
  const date = new Date(now);
  date.setDate(date.getDate() - 1); // today can still be practised
  for (let i = 0; i <= MAX_FREEZES; i++) {
    const d = localDay(date.getTime());
    if (covered.has(d)) break;
    missed.push(d);
    date.setDate(date.getDate() - 1);
  }
  const last = localDay(date.getTime());
  if (!missed.length || !covered.has(last) || missed.length > freezes) return p;
  return {
    ...p,
    freezes: freezes - missed.length,
    frozenDays: [...(p.frozenDays ?? []), ...missed],
  };
}

export interface Milestone {
  id: string;
  title: string;
  detail: string;
}
const coreVowels = coreLetters.filter((l) => l.category === "vowels");
const unitDone = (p: Progress, i: number) =>
  units[i].items.every((l) => p.introduced.includes(l.id));
const taughtCore = (p: Progress) =>
  coreLetters.filter((l) => p.introduced.includes(l.id)).length;
const checks: [Milestone, (p: Progress, now: number) => boolean][] = [
  [
    {
      id: "first-lesson",
      title: "First lesson",
      detail: "You started reading Malayalam.",
    },
    (p) => (p.lessons?.length ?? 0) > 0,
  ],
  [
    {
      id: "first-syllables",
      title: "First syllables",
      detail: "You can read കാ, നാ and മാ.",
    },
    (p) => unitDone(p, 0),
  ],
  [
    {
      id: "word-endings",
      title: "Word endings",
      detail: "You can read the -am ending of words like മരം.",
    },
    (p) => unitDone(p, 3),
  ],
  [
    {
      id: "kerala",
      title: "You can read കേരളം",
      detail: "Every letter in Kerala's name is yours.",
    },
    (p) => [0, 1, 2, 3, 6, 7].every((i) => unitDone(p, i)),
  ],
  [
    {
      id: "vowels",
      title: "All vowels",
      detail: "Every core vowel is learned.",
    },
    (p) => coreVowels.every((l) => p.introduced.includes(l.id)),
  ],
  [
    {
      id: "letters-25",
      title: "25 letters",
      detail: "A quarter of the way there.",
    },
    (p) => taughtCore(p) >= 25,
  ],
  [
    {
      id: "letters-50",
      title: "50 letters",
      detail: "More than half the core script.",
    },
    (p) => taughtCore(p) >= 50,
  ],
  [
    {
      id: "core-complete",
      title: "Whole core script",
      detail: "Every core letter, sign and cluster.",
    },
    (p) => units.slice(0, coreUnitCount).every((_, i) => unitDone(p, i)),
  ],
  [
    {
      id: "perfect",
      title: "Perfect lesson",
      detail: "A lesson with no mistakes.",
    },
    (p) => !!p.lessons?.some((l) => l.total > 0 && l.correct === l.total),
  ],
  [
    { id: "goal", title: "Goal reached", detail: "You hit your daily goal." },
    (p) => Object.values(p.xp ?? {}).some((x) => x >= p.preferences.dailyGoal),
  ],
  [
    { id: "streak-3", title: "3-day streak", detail: "Three days in a row." },
    (p, now) => currentStreak(p, now) >= 3,
  ],
  [
    { id: "streak-7", title: "7-day streak", detail: "A full week." },
    (p, now) => currentStreak(p, now) >= 7,
  ],
  [
    { id: "streak-30", title: "30-day streak", detail: "A month of reading." },
    (p, now) => currentStreak(p, now) >= 30,
  ],
];
export const milestones = checks.map(([m]) => m);
export const milestoneById = Object.fromEntries(
  milestones.map((m) => [m.id, m]),
);
/** Milestones earned by the current state but not yet recorded. */
export function newMilestones(p: Progress, now = Date.now()): Milestone[] {
  const have = new Set(p.milestones ?? []);
  return checks
    .filter(([m, test]) => !have.has(m.id) && test(p, now))
    .map(([m]) => m);
}

/** Show a backup reminder once real progress exists and no recent backup. */
export function needsBackup(p: Progress, now = Date.now()): boolean {
  return (
    p.introduced.length >= 8 &&
    (!p.lastBackupAt || now - p.lastBackupAt > 21 * DAY)
  );
}

/** Daily reminder as an iCalendar file (works with Apple, Google, Outlook). */
export function reminderCalendar(time: string, url: string): string {
  const [h, m] = time.split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const stamp = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h)}${pad(m)}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aksharam//Daily reminder//EN",
    "BEGIN:VEVENT",
    `UID:aksharam-daily-${stamp}@aksharam`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${stamp}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Aksharam: 5 minutes of Malayalam",
    `DESCRIPTION:Keep your streak going. ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time for your Malayalam lesson",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
