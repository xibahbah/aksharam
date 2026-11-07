export type Category =
  "vowels" | "consonants" | "chillu" | "signs" | "special" | "conjuncts";
export type Usage = "core" | "uncommon" | "historic" | "scholarly";
export interface Letter {
  id: string;
  glyph: string;
  category: Category;
  subgroup: string;
  romanization: string;
  approximation?: string;
  note: string;
  order: number;
  usage: Usage;
  display?: string;
  audioUrl?: string;
  example?: { word: string; romanization: string; meaning: string };
  /** Present on generated consonant + vowel-sign practice syllables. */
  syllable?: { base: string; sign: string };
}
export type Rating = "again" | "hard" | "good" | "easy";
export interface Review {
  rating: Rating;
  at: number;
}
export interface CardProgress {
  lastReviewed: number;
  nextReview: number;
  interval: number;
  lapses: number;
  successStreak: number;
  history: Review[];
}
export interface Attempt {
  at: number;
  cardId: string;
  correct: boolean;
  category: Category;
}
export type LessonKind = "unit" | "review" | "weak" | "placement" | "test";
export interface LessonLog {
  at: number;
  kind: LessonKind;
  unit?: string;
  correct: number;
  total: number;
}
export type LearningReason = "family" | "travel" | "heritage" | "curious";
export interface Progress {
  version: 1;
  cards: Record<string, CardProgress>;
  favorites: string[];
  /** Letters taught by a Learn reading card (or tested out of). */
  introduced: string[];
  attempts: Attempt[];
  studyDays: string[];
  /** dailyGoal is measured in XP; lessonSize is the review-session size. */
  preferences: { dailyGoal: number; lessonSize: number };
  // Optional v1 additions. Older files without them stay valid.
  /** XP earned per local day (YYYY-MM-DD). */
  xp?: Record<string, number>;
  lessons?: LessonLog[];
  /** Rest days available to protect the streak (0–2). */
  freezes?: number;
  /** Local days covered by a rest day. */
  frozenDays?: string[];
  milestones?: string[];
  onboarded?: boolean;
  reason?: LearningReason;
  lastBackupAt?: number;
}
export type Deck = Category | "all" | "review";
