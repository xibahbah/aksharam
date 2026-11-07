import { letters, letterById } from "../data/alphabet";
import { units, coreUnitCount, type Unit } from "../data/curriculum";
import { mastered } from "./progress";
import { shuffled, type Question, type QuestionType } from "./quiz";
import { syllablesFrom } from "./syllables";
import { hasClip } from "./audio";
import { difficultIds } from "./learn";
import type { LessonKind, Letter, Progress } from "../types";

export type LessonStep =
  | { kind: "teach"; letter: Letter }
  | {
      kind: "question";
      question: Question;
      /** Only the first question per letter in a session schedules its card. */
      schedules: boolean;
      retry?: boolean;
      review?: boolean;
    };
export interface LessonPlan {
  kind: LessonKind;
  unit?: Unit;
  title: string;
  steps: LessonStep[];
  /** New letters taught by this lesson. */
  teaches: Letter[];
  /** Syllables read in this lesson. */
  reads: Letter[];
}
type Random = () => number;

// Pairs learners confuse by sound or by shape. Used as deliberate distractors.
const confusableGroups = [
  "അ ആ",
  "ഇ ഈ",
  "ഉ ഊ",
  "എ ഏ",
  "ഒ ഓ",
  "ി ീ",
  "ു ൂ",
  "െ േ",
  "ൊ ോ",
  "ന ണ",
  "ല ള ഴ",
  "ര റ",
  "ത ട",
  "ദ ഡ",
  "ഥ ഠ",
  "ധ ഢ",
  "ശ ഷ സ",
  "ൻ ൺ",
  "ൽ ൾ",
  "ക ഖ",
  "ഗ ഘ",
  "ച ഛ",
  "പ ഫ",
  "ബ ഭ",
  "ത ഥ",
  "ദ ധ",
  "ട ഠ",
  "ഡ ഢ",
  "ന്ന ണ്ണ",
  "ല്ല ള്ള",
  "ൗ ൈ",
].map((g) => g.split(" "));
const confusables = new Map<string, Set<string>>();
for (const group of confusableGroups)
  for (const glyph of group) {
    const set = confusables.get(glyph) ?? new Set<string>();
    group.filter((g) => g !== glyph).forEach((g) => set.add(g));
    confusables.set(glyph, set);
  }
export function confusableWith(a: Letter, b: Letter): boolean {
  return !!confusables.get(a.glyph)?.has(b.glyph);
}
const family = (l: Letter) =>
  l.syllable
    ? "syllable"
    : ["consonants", "conjuncts", "chillu"].includes(l.category)
      ? "consonant"
      : ["signs", "special"].includes(l.category)
        ? "sign"
        : "vowel";

/**
 * Up to three wrong answers from letters the learner has met: confusables
 * first, then the same category, then the same family. Unseen letters are a
 * last resort so a question always has at least three choices.
 */
export function chooseOptions(
  target: Letter,
  pool: Letter[],
  random: Random = Math.random,
): Letter[] {
  const used = new Set([target.romanization, target.glyph]);
  const picked: Letter[] = [];
  const take = (candidates: Letter[], limit = 3) => {
    for (const c of shuffled(candidates, random)) {
      if (picked.length >= limit) break;
      if (used.has(c.romanization) || used.has(c.glyph)) continue;
      used.add(c.romanization);
      used.add(c.glyph);
      picked.push(c);
    }
  };
  const others = pool.filter((l) => l.id !== target.id);
  take(
    others.filter((l) => confusableWith(target, l) || sharesPart(target, l)),
    2,
  );
  take(
    others.filter(
      (l) => l.category === target.category && !l.syllable === !target.syllable,
    ),
  );
  take(others.filter((l) => family(l) === family(target)));
  if (picked.length < 2)
    take(
      letters.filter(
        (l) =>
          l.category === target.category &&
          l.usage === "core" &&
          l.id !== target.id,
      ),
      2,
    );
  return shuffled([target, ...picked], random);
}
function sharesPart(a: Letter, b: Letter): boolean {
  // Syllables that share a consonant or a sign make good contrasts.
  if (!a.syllable || !b.syllable) return false;
  return (
    a.syllable.base === b.syllable.base || a.syllable.sign === b.syllable.sign
  );
}
export function question(
  letter: Letter,
  type: QuestionType,
  pool: Letter[],
  random: Random = Math.random,
): Question {
  const t = type === "listen" && !hasClip(letter) ? "reverse" : type;
  return { letter, type: t, options: chooseOptions(letter, pool, random) };
}

export const taughtIds = (p: Progress) => new Set(p.introduced);
export const taughtLetters = (p: Progress) =>
  letters.filter((l) => p.introduced.includes(l.id));
export function unitComplete(p: Progress, unit: Unit): boolean {
  const taught = taughtIds(p);
  return unit.items.every((l) => taught.has(l.id));
}
export type UnitState = "done" | "current" | "locked" | "available";
/** Core units unlock in order; extra units open once the core path is done. */
export function unitStates(p: Progress): Record<string, UnitState> {
  const states: Record<string, UnitState> = {};
  let currentFound = false;
  units.forEach((u, i) => {
    if (unitComplete(p, u)) states[u.id] = "done";
    else if (u.extra)
      states[u.id] = units
        .slice(0, coreUnitCount)
        .every((c) => unitComplete(p, c))
        ? "available"
        : "locked";
    else if (!currentFound) {
      states[u.id] = "current";
      currentFound = true;
    } else states[u.id] = i < coreUnitCount ? "locked" : "available";
  });
  return states;
}
export function currentUnit(p: Progress): Unit | undefined {
  const states = unitStates(p);
  return (
    units.find((u) => states[u.id] === "current") ??
    units.find((u) => states[u.id] === "available")
  );
}
export function dueLetters(p: Progress, now: number): Letter[] {
  return taughtLetters(p)
    .filter((l) => (p.cards[l.id]?.nextReview ?? Infinity) <= now)
    .sort((a, b) => p.cards[a.id].nextReview - p.cards[b.id].nextReview);
}
export function weakLetters(p: Progress): Letter[] {
  const weak = difficultIds(p);
  return taughtLetters(p).filter((l) => weak.has(l.id));
}
/** 0 new · 1 learning · 2 known · 3 strong · 4 mastered */
export function strength(p: Progress, id: string): 0 | 1 | 2 | 3 | 4 {
  const card = p.cards[id];
  if (mastered(card)) return 4;
  if (card && card.successStreak >= 2 && card.interval >= 3) return 3;
  if (card && card.successStreak >= 1) return 2;
  return p.introduced.includes(id) ? 1 : 0;
}
export const strengthNames = ["New", "Learning", "Known", "Strong", "Mastered"];

export type NextAction =
  | { kind: "unit"; unit: Unit }
  | { kind: "review"; count: number }
  | { kind: "weak"; count: number }
  | { kind: "practice" };
/** What "Continue" does: clear a backlog first, otherwise keep moving forward. */
export function nextAction(p: Progress, now: number): NextAction {
  const due = dueLetters(p, now).length;
  if (due >= 6) return { kind: "review", count: due };
  const unit = currentUnit(p);
  if (unit && !unit.extra) return { kind: "unit", unit };
  if (due) return { kind: "review", count: due };
  const weak = weakLetters(p).length;
  if (weak) return { kind: "weak", count: weak };
  return { kind: "practice" };
}

function pickType(letter: Letter, i: number): QuestionType {
  if (hasClip(letter) && i % 3 === 2) return "listen";
  return i % 2 ? "reverse" : "recognition";
}
/** Each real letter's first question schedules its card; repeats do not. */
function markScheduling(steps: LessonStep[]): LessonStep[] {
  const seen = new Set<string>();
  return steps.map((s) => {
    if (s.kind !== "question") return s;
    const id = s.question.letter.id;
    const schedules = !s.question.letter.syllable && !seen.has(id);
    seen.add(id);
    return { ...s, schedules };
  });
}
function spreadReviews(
  main: LessonStep[],
  reviews: LessonStep[],
): LessonStep[] {
  if (!reviews.length) return main;
  const out = [...main];
  const gap = Math.max(2, Math.floor(out.length / (reviews.length + 1)));
  reviews.forEach((r, i) =>
    out.splice(Math.min(out.length, gap * (i + 1) + i), 0, r),
  );
  return out;
}

export function buildUnitLesson(
  p: Progress,
  now: number,
  unit: Unit,
  random: Random = Math.random,
): LessonPlan {
  const taught = taughtIds(p);
  const fresh = unit.items.filter((l) => !taught.has(l.id));
  const known = taughtLetters(p);
  const pool = [...known, ...fresh];
  const q = (l: Letter, type: QuestionType, extra: Partial<LessonStep> = {}) =>
    ({
      kind: "question",
      question: question(l, type, pool, random),
      schedules: false,
      ...extra,
    }) as LessonStep;
  const main: LessonStep[] = [];
  const targets = fresh.length ? fresh : unit.items;
  if (fresh.length) {
    for (const group of [fresh.slice(0, 2), fresh.slice(2)]) {
      if (!group.length) continue;
      group.forEach((letter) => main.push({ kind: "teach", letter }));
      group.forEach((l) => main.push(q(l, "recognition")));
    }
  }
  shuffled(targets, random).forEach((l, i) =>
    main.push(q(l, hasClip(l) && i % 2 === 0 ? "listen" : "reverse")),
  );
  // Read syllables built from everything known, favouring this unit's letters.
  const syllablePool = syllablesFrom(pool, targets);
  const focus = new Set(targets.map((l) => l.id));
  const reads = syllablePool
    .filter((s) => focus.has(s.syllable!.base) || focus.has(s.syllable!.sign))
    .slice(0, 3);
  const readPool = [
    ...syllablePool,
    ...pool.filter((l) => family(l) === "consonant"),
  ];
  reads.forEach((s, i) =>
    main.push({
      kind: "question",
      question: question(
        s,
        i === 2 ? "reverse" : hasClip(s) && i === 1 ? "listen" : "recognition",
        readPool,
        random,
      ),
      schedules: false,
    }),
  );
  const reviews = dueLetters(p, now)
    .filter((l) => !focus.has(l.id))
    .slice(0, 3)
    .map((l, i) => q(l, pickType(l, i + 1), { review: true }));
  return {
    kind: "unit",
    unit,
    title: unit.title,
    steps: markScheduling(spreadReviews(main, reviews)),
    teaches: fresh,
    reads,
  };
}

export function buildReviewLesson(
  p: Progress,
  now: number,
  size = p.preferences.lessonSize,
  random: Random = Math.random,
): LessonPlan {
  const known = taughtLetters(p);
  const due = dueLetters(p, now);
  // Top up with the weakest, soonest-due letters when few are due.
  const rest = known
    .filter((l) => !due.includes(l))
    .sort(
      (a, b) =>
        strength(p, a.id) - strength(p, b.id) ||
        (p.cards[a.id]?.nextReview ?? 0) - (p.cards[b.id]?.nextReview ?? 0),
    );
  const targets = [...due, ...rest].slice(0, Math.max(1, size));
  const steps: LessonStep[] = targets.map((l, i) => ({
    kind: "question",
    question: question(l, pickType(l, i), known, random),
    schedules: true,
    review: true,
  }));
  const syllables = shuffled(syllablesFrom(known), random).slice(0, 2);
  syllables.forEach((s) =>
    steps.push({
      kind: "question",
      question: question(
        s,
        "recognition",
        [...syllablesFrom(known), ...known],
        random,
      ),
      schedules: false,
    }),
  );
  return {
    kind: "review",
    title: due.length ? "Review" : "Keep sharp",
    steps: markScheduling(shuffled(steps, random)),
    teaches: [],
    reads: syllables,
  };
}

export function buildWeakLesson(
  p: Progress,
  random: Random = Math.random,
): LessonPlan {
  const known = taughtLetters(p);
  const targets = weakLetters(p).slice(0, 8);
  const steps: LessonStep[] = [];
  targets.forEach((l) =>
    steps.push({
      kind: "question",
      question: question(l, "recognition", known, random),
      schedules: true,
    }),
  );
  shuffled(targets, random).forEach((l) =>
    steps.push({
      kind: "question",
      question: question(l, "reverse", known, random),
      schedules: false,
    }),
  );
  return {
    kind: "weak",
    title: "Fix weak letters",
    steps: markScheduling(steps),
    teaches: [],
    reads: [],
  };
}

/** Test out of a unit: no teaching, no scheduling until the result is known. */
export function buildPlacement(
  unit: Unit,
  p: Progress,
  random: Random = Math.random,
): LessonPlan {
  const pool = [...taughtLetters(p), ...unit.items];
  const steps: LessonStep[] = [];
  unit.items.forEach((l) =>
    steps.push({
      kind: "question",
      question: question(l, "recognition", pool, random),
      schedules: false,
    }),
  );
  shuffled(unit.items, random).forEach((l) =>
    steps.push({
      kind: "question",
      question: question(l, "reverse", pool, random),
      schedules: false,
    }),
  );
  return {
    kind: "placement",
    unit,
    title: `Test out: ${unit.title}`,
    steps,
    teaches: [],
    reads: [],
  };
}
export const PLACEMENT_PASS = 0.8;

export { letterById };
