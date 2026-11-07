import { letters } from "@/data/alphabet";
import { mastered } from "@/lib/progress";
import type { Category, Letter, Progress } from "@/types";
export type LearnMode = "new" | "review" | "difficult";
export type LearnDeck = Category | "all";
export function encounteredIds(progress: Progress): Set<string> {
  return new Set([
    ...progress.introduced,
    ...Object.keys(progress.cards),
    ...progress.attempts.map((a) => a.cardId),
  ]);
}
export function difficultIds(progress: Progress): Set<string> {
  const lastAttempts = new Map<string, Progress["attempts"][number]>();
  for (const attempt of progress.attempts) {
    if ((lastAttempts.get(attempt.cardId)?.at ?? -1) <= attempt.at)
      lastAttempts.set(attempt.cardId, attempt);
  }
  const found = new Set<string>();
  for (const id of encounteredIds(progress)) {
    const card = progress.cards[id];
    const lastRating = card?.history.at(-1)?.rating;
    const attempt = lastAttempts.get(id);
    if (
      lastRating === "again" ||
      lastRating === "hard" ||
      (card && card.lapses > 0 && !mastered(card)) ||
      (attempt?.correct === false && attempt.at >= (card?.lastReviewed ?? 0))
    )
      found.add(id);
  }
  return found;
}
export function learnPools(
  progress: Progress,
  now: number,
  deck: LearnDeck = "all",
) {
  const encountered = encounteredIds(progress);
  const difficult = difficultIds(progress);
  const pool = letters.filter((l) => deck === "all" || l.category === deck);
  const learned = pool.filter((l) => encountered.has(l.id));
  const dueFirst = (a: Letter, b: Letter) => {
    const ap = progress.cards[a.id],
      bp = progress.cards[b.id];
    const ad = !!ap && ap.nextReview <= now,
      bd = !!bp && bp.nextReview <= now;
    if (ad !== bd) return ad ? -1 : 1;
    return (
      (ap?.nextReview ?? Infinity) - (bp?.nextReview ?? Infinity) ||
      letters.indexOf(a) - letters.indexOf(b)
    );
  };
  return {
    new: pool
      .filter((l) => !encountered.has(l.id))
      .sort((a, b) => Number(a.usage !== "core") - Number(b.usage !== "core")),
    learned: [...learned].sort(dueFirst),
    due: learned
      .filter(
        (l) => !!progress.cards[l.id] && progress.cards[l.id].nextReview <= now,
      )
      .sort(dueFirst),
    difficult: learned.filter((l) => difficult.has(l.id)).sort(dueFirst),
  };
}
