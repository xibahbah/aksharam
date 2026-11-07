"use client";
/* eslint-disable react-hooks/set-state-in-effect -- LocalStorage hydration and storage failure reporting synchronize with an external browser system. */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  reviewCard,
  localDay,
} from "@/lib/progress";
import { letterById } from "@/data/alphabet";
import { addXp, applyFreezes, XP } from "@/lib/habit";
import type { LessonLog, Progress, Rating } from "@/types";
interface Store {
  progress: Progress;
  ready: boolean;
  now: number;
  error: string;
  dismissError: () => void;
  rate: (id: string, rating: Rating) => void;
  introduce: (id: string) => void;
  answer: (id: string, correct: boolean) => void;
  /**
   * Records an answer. `schedules` decides whether it moves the card's review
   * date (first question per letter in a session) or only logs the attempt.
   * Syllables earn XP only.
   */
  attempt: (id: string, correct: boolean, schedules: boolean) => void;
  completeLesson: (log: Omit<LessonLog, "at">, passedIds?: string[]) => void;
  claimMilestones: (ids: string[]) => void;
  profile: (p: Pick<Progress, "onboarded" | "reason">) => void;
  markBackup: () => void;
  favorite: (id: string) => void;
  replace: (p: Progress) => void;
  preferences: (p: Partial<Progress["preferences"]>) => void;
}
const Context = createContext<Store | null>(null);
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [writable, setWritable] = useState(false);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const loaded = loadProgress(window.localStorage);
      setProgress(applyFreezes(loaded.progress));
      setError(loaded.error ?? "");
      setWritable(!loaded.readOnly);
    } catch {
      setError(
        "Browser storage is unavailable. You can study in this tab and export a backup in Settings.",
      );
    }
    setNow(Date.now());
    setReady(true);
  }, []); // Hydrate only after the server and initial client renders agree.
  useEffect(() => {
    if (ready && writable)
      try {
        saveProgress(window.localStorage, progress);
      } catch {
        setError(
          "Your browser could not save progress. Export a backup before closing this tab.",
        );
      }
  }, [progress, ready, writable]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  const rate = useCallback(
    (id: string, rating: Rating) =>
      setProgress((p) => addXp(reviewCard(p, id, rating), XP.rating)),
    [],
  );
  const introduce = useCallback(
    (id: string) =>
      setProgress((p) =>
        p.introduced.includes(id)
          ? p
          : { ...p, introduced: [...p.introduced, id] },
      ),
    [],
  );
  const attempt = useCallback(
    (id: string, correct: boolean, schedules: boolean) =>
      setProgress((p) => {
        const xp = XP.answer + (correct ? XP.correct : 0);
        if (!letterById[id]) return addXp(p, xp);
        const base = schedules
          ? reviewCard(p, id, correct ? "good" : "again")
          : p;
        return addXp(
          {
            ...base,
            attempts: [
              ...p.attempts,
              {
                at: Date.now(),
                cardId: id,
                correct,
                category: letterById[id].category,
              },
            ],
            studyDays: Array.from(new Set([...base.studyDays, localDay()])),
          },
          xp,
        );
      }),
    [],
  );
  const answer = useCallback(
    (id: string, correct: boolean) => attempt(id, correct, true),
    [attempt],
  );
  const completeLesson = useCallback(
    (log: Omit<LessonLog, "at">, passedIds: string[] = []) => {
      setProgress((p) => {
        const now = Date.now();
        let next = passedIds.reduce(
          (acc, id) =>
            letterById[id] ? reviewCard(acc, id, "good", now) : acc,
          p,
        );
        next = {
          ...next,
          lessons: [...(p.lessons ?? []), { ...log, at: now }],
        };
        const perfect = log.total > 0 && log.correct === log.total;
        return addXp(next, XP.lesson + (perfect ? XP.perfect : 0), now);
      });
      // Ask the browser not to evict progress once there is something to keep.
      void navigator.storage?.persist?.().catch(() => undefined);
    },
    [],
  );
  const claimMilestones = useCallback(
    (ids: string[]) =>
      ids.length &&
      setProgress((p) => ({
        ...p,
        milestones: Array.from(new Set([...(p.milestones ?? []), ...ids])),
      })),
    [],
  );
  const profile = useCallback(
    (values: Pick<Progress, "onboarded" | "reason">) =>
      setProgress((p) => ({ ...p, ...values })),
    [],
  );
  const markBackup = useCallback(
    () => setProgress((p) => ({ ...p, lastBackupAt: Date.now() })),
    [],
  );
  const favorite = useCallback(
    (id: string) =>
      setProgress((p) => ({
        ...p,
        favorites: p.favorites.includes(id)
          ? p.favorites.filter((v) => v !== id)
          : [...p.favorites, id],
      })),
    [],
  );
  return (
    <Context.Provider
      value={{
        progress,
        ready,
        now,
        error,
        dismissError: () => setError(""),
        rate,
        introduce,
        answer,
        attempt,
        completeLesson,
        claimMilestones,
        profile,
        markBackup,
        favorite,
        replace: (p) => {
          setError("");
          setWritable(true);
          setProgress(p);
        },
        preferences: (p) =>
          setProgress((old) => ({
            ...old,
            preferences: { ...old.preferences, ...p },
          })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useProgress() {
  const context = useContext(Context);
  if (!context) throw new Error("ProgressProvider is missing");
  return context;
}
