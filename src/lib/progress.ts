import { letterById } from "@/data/alphabet";
import type { CardProgress, Progress, Rating } from "@/types";
export const STORAGE_KEY = "aksharam.progress.v1";
export const DAY = 86_400_000;
export function emptyProgress(): Progress {
  return {
    version: 1,
    cards: {},
    favorites: [],
    introduced: [],
    attempts: [],
    studyDays: [],
    preferences: { dailyGoal: 15, lessonSize: 10 },
  };
}
export function localDay(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function schedule(
  previous: CardProgress | undefined,
  rating: Rating,
  now: number,
): CardProgress {
  const old = previous?.interval ?? 0;
  const interval =
    rating === "again"
      ? 10 / 1440
      : rating === "hard"
        ? Math.max(1, old * 1.2)
        : rating === "good"
          ? Math.max(1, old * 2)
          : Math.max(3, old * 2.5);
  return {
    lastReviewed: now,
    nextReview: now + interval * DAY,
    interval,
    lapses: (previous?.lapses ?? 0) + (rating === "again" ? 1 : 0),
    successStreak:
      rating === "again" || rating === "hard"
        ? 0
        : (previous?.successStreak ?? 0) + 1,
    history: [...(previous?.history ?? []), { rating, at: now }],
  };
}
export function mastered(card: CardProgress | undefined): boolean {
  return !!card && card.successStreak >= 3 && card.interval >= 7;
}
export function reviewCard(
  progress: Progress,
  id: string,
  rating: Rating,
  now = Date.now(),
): Progress {
  if (!letterById[id]) return progress;
  return {
    ...progress,
    cards: {
      ...progress.cards,
      [id]: schedule(progress.cards[id], rating, now),
    },
    introduced: Array.from(new Set([...progress.introduced, id])),
    studyDays: Array.from(new Set([...progress.studyDays, localDay(now)])),
  };
}
/** Consecutive practiced days, counting rest days that protected the streak. */
export function streak(
  days: string[],
  now = Date.now(),
  frozen: string[] = [],
): number {
  if (frozen.length) days = [...days, ...frozen];
  const date = new Date(now);
  let count = 0;
  if (!days.includes(localDay(date.getTime())))
    date.setDate(date.getDate() - 1);
  while (days.includes(localDay(date.getTime()))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const numeric = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const ratings = ["again", "hard", "good", "easy"];
const ids = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.every((id) => typeof id === "string" && Object.hasOwn(letterById, id)) &&
  new Set(v).size === v.length;
export function parseProgress(raw: string): Progress {
  if (raw.length > 10_000_000)
    throw new Error(
      "This file is too large. Choose an Aksharam progress export under 10 MB.",
    );
  const p: unknown = JSON.parse(raw);
  if (
    !record(p) ||
    p.version !== 1 ||
    !record(p.cards) ||
    !ids(p.favorites) ||
    (p.introduced !== undefined && !ids(p.introduced)) ||
    !Array.isArray(p.attempts) ||
    !Array.isArray(p.studyDays) ||
    !record(p.preferences)
  )
    throw new Error("This is not a supported Aksharam v1 progress file.");
  const pref = p.preferences;
  if (
    !Number.isInteger(pref.dailyGoal) ||
    Number(pref.dailyGoal) < 1 ||
    Number(pref.dailyGoal) > 100 ||
    !Number.isInteger(pref.lessonSize) ||
    Number(pref.lessonSize) < 1 ||
    Number(pref.lessonSize) > 20
  )
    throw new Error("Invalid study preferences.");
  for (const [id, c] of Object.entries(p.cards)) {
    if (
      !Object.hasOwn(letterById, id) ||
      !record(c) ||
      ![
        "lastReviewed",
        "nextReview",
        "interval",
        "lapses",
        "successStreak",
      ].every((k) => numeric(c[k])) ||
      !Number.isInteger(c.lapses) ||
      !Number.isInteger(c.successStreak) ||
      !Array.isArray(c.history) ||
      !c.history.length ||
      !c.history.every(
        (h) => record(h) && numeric(h.at) && ratings.includes(String(h.rating)),
      )
    )
      throw new Error("Invalid card review data.");
    const history = c.history as { at: number; rating: Rating }[];
    if (
      history.some((h, i) => i > 0 && h.at < history[i - 1].at) ||
      history.at(-1)?.at !== c.lastReviewed
    )
      throw new Error("Review history is inconsistent.");
  }
  if (
    !p.attempts.every(
      (a) =>
        record(a) &&
        numeric(a.at) &&
        typeof a.correct === "boolean" &&
        typeof a.cardId === "string" &&
        Object.hasOwn(letterById, a.cardId) &&
        letterById[a.cardId].category === a.category,
    )
  )
    throw new Error("Invalid quiz history.");
  if (
    !p.studyDays.every(
      (d) =>
        typeof d === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        !Number.isNaN(Date.parse(d)),
    ) ||
    new Set(p.studyDays).size !== p.studyDays.length
  )
    throw new Error("Invalid study dates.");
  const extras = parseExtras(p);
  // Explicit construction strips unrecognized top-level fields from imported files.
  return {
    version: 1,
    cards: p.cards as Progress["cards"],
    favorites: p.favorites,
    // Additive v1 compatibility repair: explicit study evidence implies introduced.
    // Preserve every existing ID and every review/attempt field; never reschedule.
    introduced: Array.from(
      new Set([
        ...((p.introduced ?? []) as string[]),
        ...Object.keys(p.cards),
        ...(p.attempts as Progress["attempts"]).map((a) => a.cardId),
      ]),
    ),
    attempts: p.attempts as Progress["attempts"],
    studyDays: p.studyDays as string[],
    preferences: {
      dailyGoal: Number(pref.dailyGoal),
      lessonSize: Number(pref.lessonSize),
    },
    ...extras,
  };
}
const day = (d: unknown) =>
  typeof d === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  !Number.isNaN(Date.parse(d));
const lessonKinds = ["unit", "review", "weak", "placement", "test"];
const reasons = ["family", "travel", "heritage", "curious"];
/** Validates the optional v1 additions; absent fields stay absent. */
function parseExtras(p: Record<string, unknown>): Partial<Progress> {
  const out: Partial<Progress> = {};
  if (p.xp !== undefined) {
    if (
      !record(p.xp) ||
      !Object.entries(p.xp).every(([k, v]) => day(k) && numeric(v))
    )
      throw new Error("Invalid XP history.");
    out.xp = p.xp as Record<string, number>;
  }
  if (p.lessons !== undefined) {
    if (
      !Array.isArray(p.lessons) ||
      !p.lessons.every(
        (l) =>
          record(l) &&
          numeric(l.at) &&
          lessonKinds.includes(String(l.kind)) &&
          (l.unit === undefined || typeof l.unit === "string") &&
          Number.isInteger(l.correct) &&
          Number.isInteger(l.total) &&
          numeric(l.correct) &&
          Number(l.correct) <= Number(l.total),
      )
    )
      throw new Error("Invalid lesson history.");
    out.lessons = p.lessons as Progress["lessons"];
  }
  if (p.freezes !== undefined) {
    if (
      !Number.isInteger(p.freezes) ||
      Number(p.freezes) < 0 ||
      Number(p.freezes) > 2
    )
      throw new Error("Invalid rest days.");
    out.freezes = Number(p.freezes);
  }
  for (const key of ["frozenDays", "milestones"] as const) {
    const v = p[key];
    if (v === undefined) continue;
    if (
      !Array.isArray(v) ||
      !v.every((x) => typeof x === "string" && (key !== "frozenDays" || day(x)))
    )
      throw new Error("Invalid saved milestones or rest days.");
    out[key] = v as string[];
  }
  if (p.onboarded !== undefined) {
    if (typeof p.onboarded !== "boolean") throw new Error("Invalid profile.");
    out.onboarded = p.onboarded;
  }
  if (p.reason !== undefined) {
    if (!reasons.includes(String(p.reason)))
      throw new Error("Invalid profile.");
    out.reason = p.reason as Progress["reason"];
  }
  if (p.lastBackupAt !== undefined) {
    if (!numeric(p.lastBackupAt)) throw new Error("Invalid backup date.");
    out.lastBackupAt = Number(p.lastBackupAt);
  }
  return out;
}
export function loadProgress(storage: Pick<Storage, "getItem">): {
  progress: Progress;
  error?: string;
  readOnly?: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { progress: raw ? parseProgress(raw) : emptyProgress() };
  } catch {
    return {
      progress: emptyProgress(),
      readOnly: true,
      error:
        "Saved progress could not be read and has been left unchanged. This session is temporary. Export a backup or restore a valid file in Settings.",
    };
  }
}
export function saveProgress(
  storage: Pick<Storage, "setItem">,
  p: Progress,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(p));
}
