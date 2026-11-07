import { describe, expect, it } from "vitest";
import { coreLetters, letters } from "@/data/alphabet";
import { units, coreUnitCount } from "@/data/curriculum";
import {
  emptyProgress,
  parseProgress,
  reviewCard,
  streak,
  localDay,
  DAY,
} from "@/lib/progress";
import {
  buildPlacement,
  buildUnitLesson,
  chooseOptions,
  nextAction,
  unitStates,
  type LessonStep,
} from "@/lib/lesson";
import { canCombine, makeSyllable } from "@/lib/syllables";
import {
  addXp,
  applyFreezes,
  newMilestones,
  reminderCalendar,
  FREEZE_EVERY,
} from "@/lib/habit";
import { almostCorrect, type Question } from "@/lib/quiz";
import type { Progress } from "@/types";

const now = new Date(2026, 10, 7, 12).getTime();
const glyph = (g: string, category?: string) =>
  letters.find((l) => l.glyph === g && (!category || l.category === category))!;
const questions = (steps: LessonStep[]) =>
  steps.filter(
    (s): s is Extract<LessonStep, { kind: "question" }> =>
      s.kind === "question",
  );
const teachAll = (p: Progress, count: number) => {
  for (const u of units.slice(0, count))
    p.introduced.push(...u.items.map((l) => l.id));
  return p;
};

describe("curriculum", () => {
  it("teaches every letter exactly once, core letters in the core path", () => {
    const ids = units.flatMap((u) => u.items.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(letters.length);
    const coreIds = units
      .slice(0, coreUnitCount)
      .flatMap((u) => u.items.map((l) => l.id));
    expect(new Set(coreIds)).toEqual(new Set(coreLetters.map((l) => l.id)));
    expect(units.slice(coreUnitCount).every((u) => u.extra)).toBe(true);
  });
  it("teaches a vowel sign in lesson 1 and word endings by lesson 4", () => {
    expect(units[0].items.some((l) => l.category === "signs")).toBe(true);
    const firstFour = units
      .slice(0, 4)
      .flatMap((u) => u.items.map((l) => l.glyph));
    expect(firstFour).toEqual(expect.arrayContaining(["ം", "്"]));
    const core = units.slice(0, coreUnitCount);
    expect(core.every((u) => u.items.length >= 3 && u.items.length <= 4)).toBe(
      true,
    );
  });
});

describe("syllables", () => {
  it("compose glyphs and ISO romanization", () => {
    const ka = glyph("ക", "consonants");
    expect(makeSyllable(ka, glyph("ി", "signs"))).toMatchObject({
      glyph: "കി",
      romanization: "ki",
    });
    expect(makeSyllable(ka, glyph("ം", "special")).romanization).toBe("kaṁ");
    expect(makeSyllable(glyph("ക്ക"), glyph("ാ", "signs")).romanization).toBe(
      "kkā",
    );
    expect(canCombine(glyph("ൻ"), glyph("ാ", "signs"))).toBe(false);
  });
});

describe("lesson engine", () => {
  it("teaches each new letter before asking about it, then reads syllables", () => {
    const plan = buildUnitLesson(emptyProgress(), now, units[0], () => 0.3);
    expect(plan.teaches).toEqual(units[0].items);
    const firstTaught = new Map<string, number>();
    plan.steps.forEach((s, i) => {
      if (s.kind === "teach") firstTaught.set(s.letter.id, i);
      else if (!s.question.letter.syllable)
        expect(firstTaught.get(s.question.letter.id)).toBeLessThan(i);
    });
    expect(plan.reads.map((s) => s.glyph)).toEqual(
      expect.arrayContaining(["കാ"]),
    );
    expect(questions(plan.steps).length).toBeGreaterThanOrEqual(10);
  });
  it("schedules only the first question per letter and never syllables", () => {
    const plan = buildUnitLesson(emptyProgress(), now, units[0]);
    const scheduling = questions(plan.steps).filter((s) => s.schedules);
    expect(scheduling.map((s) => s.question.letter.id).sort()).toEqual(
      units[0].items.map((l) => l.id).sort(),
    );
    expect(
      questions(plan.steps).some(
        (s) => s.question.letter.syllable && s.schedules,
      ),
    ).toBe(false);
  });
  it("uses only met letters as distractors when enough exist", () => {
    const p = teachAll(emptyProgress(), 3);
    const known = new Set([
      ...p.introduced,
      ...units[3].items.map((l) => l.id),
    ]);
    const plan = buildUnitLesson(p, now, units[3]);
    for (const s of questions(plan.steps))
      if (
        ["consonants", "vowels"].includes(s.question.letter.category) &&
        !s.question.letter.syllable
      )
        s.question.options.forEach((o) => expect(known.has(o.id)).toBe(true));
  });
  it("prefers look-alike and sound-alike distractors", () => {
    const na = glyph("ന", "consonants");
    const nna = glyph("ണ", "consonants");
    const pool = [
      na,
      nna,
      glyph("ക", "consonants"),
      glyph("മ", "consonants"),
      glyph("ത", "consonants"),
      glyph("പ", "consonants"),
    ];
    for (let i = 0; i < 10; i++)
      expect(chooseOptions(na, pool).map((l) => l.id)).toContain(nna.id);
  });
  it("mixes up to three due reviews into a unit lesson", () => {
    let p = teachAll(emptyProgress(), 1);
    for (const l of units[0].items)
      p = reviewCard(p, l.id, "good", now - 2 * DAY);
    const plan = buildUnitLesson(p, now, units[1]);
    expect(questions(plan.steps).filter((s) => s.review)).toHaveLength(3);
  });
  it("test-outs never teach or schedule", () => {
    const plan = buildPlacement(units[0], emptyProgress());
    expect(plan.steps.every((s) => s.kind === "question" && !s.schedules)).toBe(
      true,
    );
  });
});

describe("continue and path", () => {
  it("starts at unit 1, moves forward, and clears a review backlog first", () => {
    const p = emptyProgress();
    expect(nextAction(p, now)).toMatchObject({ kind: "unit", unit: units[0] });
    teachAll(p, 1);
    expect(nextAction(p, now)).toMatchObject({ kind: "unit", unit: units[1] });
    let q = teachAll(emptyProgress(), 2);
    for (const l of [...units[0].items, ...units[1].items])
      q = reviewCard(q, l.id, "good", now - 3 * DAY);
    expect(nextAction(q, now)).toMatchObject({ kind: "review" });
  });
  it("unlocks core units in order and extras after the core path", () => {
    const states = unitStates(emptyProgress());
    expect(states["unit-1"]).toBe("current");
    expect(states["unit-2"]).toBe("locked");
    expect(states["extra-1"]).toBe("locked");
    const done = unitStates(teachAll(emptyProgress(), coreUnitCount));
    expect(done["extra-1"]).toBe("available");
  });
});

describe("habit", () => {
  it("earns a rest day when the goal is reached on a 5-day streak", () => {
    const p = emptyProgress();
    for (let i = 1; i < FREEZE_EVERY; i++)
      p.studyDays.push(localDay(now - i * DAY));
    const after = addXp(p, p.preferences.dailyGoal, now);
    expect(after.freezes).toBe(1);
    expect(after.xp?.[localDay(now)]).toBe(p.preferences.dailyGoal);
  });
  it("spends rest days to cover a short gap, but not a long one", () => {
    const p: Progress = {
      ...emptyProgress(),
      freezes: 2,
      studyDays: [localDay(now - 2 * DAY)],
    };
    const covered = applyFreezes(p, now);
    expect(covered.freezes).toBe(1);
    expect(covered.frozenDays).toEqual([localDay(now - DAY)]);
    expect(streak(covered.studyDays, now, covered.frozenDays)).toBe(2);
    const long: Progress = { ...p, studyDays: [localDay(now - 4 * DAY)] };
    expect(applyFreezes(long, now)).toBe(long);
  });
  it("reports milestones once", () => {
    const p: Progress = {
      ...emptyProgress(),
      lessons: [
        { at: now, kind: "unit", unit: "unit-1", correct: 3, total: 3 },
      ],
    };
    const found = newMilestones(p, now).map((m) => m.id);
    expect(found).toEqual(expect.arrayContaining(["first-lesson", "perfect"]));
    expect(newMilestones({ ...p, milestones: found }, now)).toEqual([]);
  });
  it("builds a repeating calendar reminder", () => {
    const ics = reminderCalendar("07:30", "https://example.com/aksharam/");
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toMatch(/DTSTART:\d{8}T073000/);
  });
});

describe("progress file additions", () => {
  it("round-trip and validate optional fields", () => {
    const p: Progress = {
      ...emptyProgress(),
      xp: { [localDay(now)]: 12 },
      lessons: [
        { at: now, kind: "unit", unit: "unit-1", correct: 4, total: 5 },
      ],
      freezes: 1,
      frozenDays: [localDay(now - DAY)],
      milestones: ["first-lesson"],
      onboarded: true,
      reason: "family",
      lastBackupAt: now,
    };
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(() => parseProgress(JSON.stringify({ ...p, freezes: 9 }))).toThrow();
    expect(() =>
      parseProgress(JSON.stringify({ ...p, lessons: [{ kind: "x" }] })),
    ).toThrow();
  });
});

describe("typing feedback", () => {
  it("flags right letters with wrong accents as almost", () => {
    const q: Question = { letter: glyph("ആ"), type: "typing", options: [] };
    expect(almostCorrect(q, "a")).toBe(true);
    expect(almostCorrect(q, "ā")).toBe(false);
    expect(almostCorrect(q, "e")).toBe(false);
  });
});
