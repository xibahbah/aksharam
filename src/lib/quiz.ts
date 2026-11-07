import { letters } from "@/data/alphabet";
import type { Letter } from "@/types";
export type QuestionType = "recognition" | "reverse" | "typing" | "listen";
export interface Question {
  letter: Letter;
  type: QuestionType;
  options: Letter[];
}
export interface Answer {
  question: Question;
  response: string;
  correct: boolean;
}
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function makeQuestion(
  letter: Letter,
  type: QuestionType,
  random = Math.random,
): Question {
  const used = new Set([letter.romanization]);
  const distractors = shuffled(
    letters.filter(
      (l) =>
        l.category === letter.category &&
        l.id !== letter.id &&
        l.usage === "core",
    ),
    random,
  )
    .filter((l) => {
      if (used.has(l.romanization)) return false;
      used.add(l.romanization);
      return true;
    })
    .slice(0, 3);
  return { letter, type, options: shuffled([letter, ...distractors], random) };
}
export function normalizeAnswer(value: string): string {
  return value.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}
export function isCorrect(q: Question, response: string): boolean {
  return q.type === "typing"
    ? normalizeAnswer(response) === normalizeAnswer(q.letter.romanization)
    : response === q.letter.id;
}
/** Right letters, wrong accents: "a" for "ā", "n" for "ṇ". Still scored wrong. */
export function almostCorrect(q: Question, response: string): boolean {
  if (q.type !== "typing" || isCorrect(q, response)) return false;
  const bare = (v: string) =>
    normalizeAnswer(v)
      .normalize("NFD")
      .replace(/[\u0300-\u036f’']/g, "");
  return bare(response) === bare(q.letter.romanization);
}
export function score(answers: Answer[]): number {
  return answers.length
    ? Math.round(
        (100 * answers.filter((a) => a.correct).length) / answers.length,
      )
    : 0;
}
