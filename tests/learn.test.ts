import { describe, expect, it } from "vitest";
import { letters } from "@/data/alphabet";
import {
  emptyProgress,
  reviewCard,
  parseProgress,
  saveProgress,
  loadProgress,
  DAY,
} from "@/lib/progress";
import { learnPools, difficultIds } from "@/lib/learn";
const now = 1_800_000_000_000;
const [a, b, c, d] = letters;
describe("v1 progress compatibility", () => {
  it("preserves a complete v1 export without changing schedules, mastery or results", () => {
    const p = reviewCard(emptyProgress(), a.id, "easy", now);
    p.introduced.push(b.id);
    p.favorites.push(a.id);
    p.attempts.push({
      at: now,
      cardId: a.id,
      category: a.category,
      correct: true,
    });
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });
  it("additively repairs missing introduced IDs from saved reviews and answers", () => {
    const p = reviewCard(emptyProgress(), a.id, "hard", now);
    p.attempts.push({
      at: now,
      cardId: b.id,
      category: b.category,
      correct: false,
    });
    const raw = { ...p, introduced: [c.id] };
    const recovered = parseProgress(JSON.stringify(raw));
    expect(recovered.introduced).toEqual([c.id, a.id, b.id]);
    expect(recovered.cards).toEqual(p.cards);
    expect(recovered.attempts).toEqual(p.attempts);
    const missing = { ...p, introduced: undefined };
    expect(parseProgress(JSON.stringify(missing)).introduced).toEqual([
      a.id,
      b.id,
    ]);
    saveProgress(localStorage, recovered);
    expect(loadProgress(localStorage).progress).toEqual(recovered);
  });
  it("does not overwrite incompatible saved data during load", () => {
    localStorage.setItem(
      "aksharam.progress.v1",
      '{"version":99,"cards":{"saved":true}}',
    );
    const raw = localStorage.getItem("aksharam.progress.v1");
    expect(loadProgress(localStorage).readOnly).toBe(true);
    expect(localStorage.getItem("aksharam.progress.v1")).toBe(raw);
  });
});
describe("Learn pool selection", () => {
  it("separates all new, explicitly introduced, and answered letters", () => {
    const p = reviewCard(emptyProgress(), a.id, "good", now);
    p.introduced.push(b.id);
    p.favorites.push(d.id);
    p.attempts.push({
      at: now,
      cardId: c.id,
      category: c.category,
      correct: true,
    });
    const pool = learnPools(p, now);
    expect(pool.learned.map((l) => l.id)).toEqual(
      expect.arrayContaining([a.id, b.id, c.id]),
    );
    expect(pool.learned).toHaveLength(3);
    expect(pool.new).toHaveLength(letters.length - 3);
    expect(pool.new.every((l) => ![a.id, b.id, c.id].includes(l.id))).toBe(
      true,
    );
    expect(pool.difficult).toHaveLength(0); // Introduction, a correct answer, and a bookmark are not difficulty evidence.
  });
  it("uses Again, Hard, unrecovered lapses and recent incorrect answers for difficulty", () => {
    let p = reviewCard(emptyProgress(), a.id, "again", now);
    p = reviewCard(p, b.id, "hard", now);
    p.introduced.push(c.id);
    p.attempts.push({
      at: now,
      cardId: d.id,
      category: d.category,
      correct: false,
    });
    expect([...difficultIds(p)].sort()).toEqual([a.id, b.id, d.id].sort());
    p = reviewCard(p, b.id, "good", now + DAY);
    p = reviewCard(p, d.id, "good", now + DAY);
    expect(difficultIds(p).has(b.id)).toBe(false);
    expect(difficultIds(p).has(d.id)).toBe(false);
    for (let i = 1; i <= 4; i++) p = reviewCard(p, a.id, "good", now + i * DAY);
    expect(difficultIds(p).has(a.id)).toBe(false);
  });
  it("has no new candidates after every letter has been introduced", () => {
    const p = emptyProgress();
    p.introduced = letters.map((l) => l.id);
    expect(learnPools(p, now).new).toEqual([]);
    expect(learnPools(p, now).learned).toHaveLength(letters.length);
  });
  it("review answers extend the same scheduler and keep prior history", () => {
    const p = reviewCard(emptyProgress(), a.id, "good", now - 2 * DAY);
    const updated = reviewCard(p, a.id, "good", now);
    expect(updated.cards[a.id].history).toHaveLength(2);
    expect(updated.cards[a.id].interval).toBe(2);
    expect(updated.cards[a.id].nextReview).toBe(now + 2 * DAY);
    expect(updated.introduced).toEqual([a.id]);
  });
});
