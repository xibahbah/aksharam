"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, RotateCcw, Share2, Check } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { unitById, units } from "@/data/curriculum";
import {
  buildPlacement,
  buildReviewLesson,
  buildUnitLesson,
  buildWeakLesson,
  currentUnit,
  nextAction,
  question,
  taughtLetters,
  PLACEMENT_PASS,
  type LessonPlan,
  type LessonStep,
} from "@/lib/lesson";
import {
  currentStreak,
  newMilestones,
  xpToday,
  XP,
  type Milestone,
} from "@/lib/habit";
import type { Answer } from "@/lib/quiz";
import type { Letter, Progress } from "@/types";
import { ProgressBar } from "./ui";
import { QuizQuestion } from "./quiz-question";
import { AudioButton } from "./audio-button";

export type LessonMode = "continue" | "unit" | "review" | "weak" | "placement";
/** Builds the lesson a mode asks for, falling back to whatever comes next. */
export function planFor(
  mode: LessonMode,
  p: Progress,
  now: number,
  unitId?: string | null,
): LessonPlan {
  const unit = unitId ? unitById[unitId] : undefined;
  if (mode === "placement")
    return buildPlacement(unit ?? currentUnit(p) ?? units[0], p);
  if (mode === "unit" && unit) return buildUnitLesson(p, now, unit);
  if (mode === "review" && taughtLetters(p).length)
    return buildReviewLesson(p, now);
  if (mode === "weak") {
    const plan = buildWeakLesson(p);
    if (plan.steps.length) return plan;
  }
  const next = nextAction(p, now);
  if (next.kind === "unit") return buildUnitLesson(p, now, next.unit);
  if (next.kind === "weak") return buildWeakLesson(p);
  if (taughtLetters(p).length) return buildReviewLesson(p, now);
  return buildUnitLesson(p, now, units[0]);
}

/** Answers to original questions only; end-of-lesson retries are practice. */
export function firstTryAnswers(
  steps: LessonStep[],
  answers: Answer[],
): Answer[] {
  const questions = steps.filter((s) => s.kind === "question");
  return answers.filter((_, i) => {
    const s = questions[i];
    return s?.kind === "question" && !s.retry;
  });
}

export function LessonRunner() {
  const { ready } = useProgress();
  return ready ? <Runner /> : <p role="status">Loading your lesson…</p>;
}

function Runner() {
  const params = useSearchParams();
  const { progress, introduce, attempt, completeLesson } = useProgress();
  const [plan, setPlan] = useState<LessonPlan>(() =>
    planFor(
      (params.get("mode") as LessonMode) ?? "continue",
      progress,
      Date.now(),
      params.get("unit"),
    ),
  );
  const [steps, setSteps] = useState<LessonStep[]>(plan.steps);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(false);
  const [xp, setXp] = useState(0);
  function start(next: LessonPlan) {
    setPlan(next);
    setSteps(next.steps);
    setIndex(0);
    setAnswers([]);
    setCombo(0);
    setXp(0);
    setDone(false);
    window.scrollTo?.({ top: 0 });
  }
  const step = steps[index];
  const placement = plan.kind === "placement";
  function record(response: string, correct: boolean) {
    if (step?.kind !== "question") return;
    const { question: q } = step;
    setAnswers((a) => [...a, { question: q, response, correct }]);
    setCombo((c) => (correct ? c + 1 : 0));
    setXp((x) => x + XP.answer + (correct ? XP.correct : 0));
    // Placement answers stay local until the result is known.
    if (!placement) attempt(q.letter.id, correct, step.schedules);
    // A miss comes back once at the end of the lesson, as a fresh question.
    if (!correct && !step.retry && !placement)
      setSteps((s) => [
        ...s,
        {
          kind: "question",
          question: question(
            q.letter,
            q.type === "listen" ? "reverse" : q.type,
            q.options,
          ),
          schedules: false,
          retry: true,
        },
      ]);
  }
  function finish() {
    const firstTry = firstTryAnswers(steps, answers);
    const correct = firstTry.filter((a) => a.correct).length;
    const passed =
      placement &&
      firstTry.length > 0 &&
      correct / firstTry.length >= PLACEMENT_PASS;
    completeLesson(
      { kind: plan.kind, unit: plan.unit?.id, correct, total: firstTry.length },
      passed ? plan.unit!.items.map((l) => l.id) : [],
    );
    setXp(
      (x) =>
        x +
        XP.lesson +
        (correct === firstTry.length && firstTry.length ? XP.perfect : 0),
    );
    setDone(true);
  }
  function next() {
    if (index >= steps.length - 1) finish();
    else setIndex((i) => i + 1);
  }
  if (done)
    return (
      <LessonComplete
        plan={plan}
        steps={steps}
        answers={answers}
        xp={xp}
        onContinue={() => start(planFor("continue", progress, Date.now()))}
        onTestOutNext={() =>
          start(
            planFor(
              "placement",
              progress,
              Date.now(),
              currentUnit(progress)?.id,
            ),
          )
        }
        onRetry={(missed) =>
          start({
            kind: "weak",
            title: "Retry missed",
            teaches: [],
            reads: [],
            steps: missed.map((l) => ({
              kind: "question",
              question: question(l, "recognition", [
                ...taughtLetters(progress),
                ...missed,
              ]),
              schedules: false,
            })),
          })
        }
      />
    );
  const total = steps.length;
  return (
    <>
      <div className="session-wrap">
        <header className="lesson-top">
          <Link className="text-link" href="/">
            Exit
          </Link>
          <div className="lesson-title">
            <h1>{plan.title}</h1>
            {plan.unit?.goal && <span className="muted">{plan.unit.goal}</span>}
          </div>
          <span className="lesson-step">
            {index + 1} / {total}
            {combo >= 3 ? ` · ${combo} in a row!` : ""}
          </span>
        </header>
        <ProgressBar value={(index / total) * 100} label="Lesson progress" />
        {step?.kind === "teach" ? (
          <TeachCard
            key={index}
            letter={step.letter}
            onNext={() => {
              introduce(step.letter.id);
              next();
            }}
          />
        ) : step?.kind === "question" ? (
          <QuizQuestion
            key={index}
            question={step.question}
            onAnswer={record}
            onNext={next}
            number={index + 1}
            total={total}
          />
        ) : null}
      </div>
    </>
  );
}

function TeachCard({ letter, onNext }: { letter: Letter; onNext: () => void }) {
  return (
    <div className="panel reading-card">
      <span className="eyebrow">
        NEW {letter.category === "signs" ? "VOWEL SIGN" : "LETTER"}
        {letter.usage !== "core" ? ` · ${letter.usage}` : ""}
      </span>
      <span className="reading-glyph" lang="ml">
        {letter.display}
      </span>
      <h2>{letter.romanization}</h2>
      <span className="pronunciation">
        {letter.approximation ?? letter.subgroup}
      </span>
      <p>{letter.note}</p>
      {letter.category === "signs" && (
        <p className="combination" lang="ml">
          ക + {letter.display} → ക{letter.glyph}
        </p>
      )}
      <AudioButton letter={letter} />
      <button className="button primary" onClick={onNext}>
        Got it <ArrowRight size={18} />
      </button>
    </div>
  );
}

function LessonComplete({
  plan,
  steps,
  answers,
  xp,
  onContinue,
  onTestOutNext,
  onRetry,
}: {
  plan: LessonPlan;
  steps: LessonStep[];
  answers: Answer[];
  xp: number;
  onContinue: () => void;
  onTestOutNext: () => void;
  onRetry: (missed: Letter[]) => void;
}) {
  const { progress, now, claimMilestones } = useProgress();
  const firstTry = firstTryAnswers(steps, answers);
  const correct = firstTry.filter((a) => a.correct).length;
  const passed =
    plan.kind === "placement" &&
    firstTry.length > 0 &&
    correct / firstTry.length >= PLACEMENT_PASS;
  const missed = Array.from(
    new Map(
      answers
        .filter((a) => !a.correct)
        .map((a) => [a.question.letter.id, a.question.letter]),
    ).values(),
  );
  // Capture milestones once, after the completed lesson reaches the store.
  const [earned, setEarned] = useState<Milestone[] | null>(null);
  const claimed = useRef(false);
  useEffect(() => {
    if (claimed.current || !progress.lessons?.length) return;
    claimed.current = true;
    const found = newMilestones(progress, Date.now());
    setEarned(found);
    claimMilestones(found.map((m) => m.id));
  }, [progress, claimMilestones]);
  const goal = progress.preferences.dailyGoal;
  const today = xpToday(progress, now);
  const streakDays = currentStreak(progress, now);
  const readable = [...plan.teaches, ...plan.reads];
  const title =
    plan.kind === "placement"
      ? passed
        ? "Tested out!"
        : "Let's learn this one"
      : plan.kind === "unit"
        ? "Lesson complete"
        : "Practice complete";
  async function share(m: Milestone) {
    const text = `${m.title} on Aksharam: I'm learning to read Malayalam. ${m.detail}`;
    try {
      if (navigator.share)
        await navigator.share({
          text,
          url: location.href.split("/learn")[0] + "/",
        });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* dismissed */
    }
  }
  return (
    <div className="results">
      <div className="results-header panel">
        <h2>{title}</h2>
        {plan.kind === "placement" && !passed && (
          <p>
            {correct} of {firstTry.length} right. You need{" "}
            {Math.round(PLACEMENT_PASS * 100)}% to skip, so this unit will be
            taught normally.
          </p>
        )}
        {readable.length > 0 && (
          <>
            <p>
              {plan.kind === "unit" ? "You can now read:" : "You practised:"}
            </p>
            <p className="tip-glyphs" lang="ml">
              {readable.map((l) => l.display ?? l.glyph).join("  ")}
            </p>
          </>
        )}
        {passed && plan.unit && (
          <p>
            <span lang="ml">
              {plan.unit.items.map((l) => l.display).join(" ")}
            </span>{" "}
            are marked as learned and will come back in reviews.
          </p>
        )}
        <p>
          +{xp} XP · {correct} of {firstTry.length} right first time ·{" "}
          {streakDays}-day streak
        </p>
        <ProgressBar value={(today / goal) * 100} label="Daily goal" />
        <p>
          {today >= goal
            ? "Daily goal reached."
            : `${goal - today} XP to today's goal.`}
          {progress.freezes
            ? ` · ${progress.freezes} rest day${progress.freezes > 1 ? "s" : ""} saved`
            : ""}
        </p>
        <div className="button-row">
          {plan.kind === "placement" && passed ? (
            <>
              <button className="button primary" onClick={onTestOutNext}>
                Test out of the next unit <ArrowRight size={17} />
              </button>
              <button className="button secondary" onClick={onContinue}>
                Start learning
              </button>
            </>
          ) : (
            <button className="button primary" onClick={onContinue}>
              Continue <ArrowRight size={17} />
            </button>
          )}
          {plan.kind !== "placement" && missed.length > 0 && (
            <button
              className="button secondary"
              onClick={() => onRetry(missed)}
            >
              <RotateCcw size={17} /> Practise missed
            </button>
          )}
          <Link href="/" className="text-link">
            Home
          </Link>
        </div>
      </div>
      {earned && earned.length > 0 && (
        <div className="panel answer-review" aria-live="polite">
          <h3>New milestone{earned.length > 1 ? "s" : ""}</h3>
          {earned.map((m) => (
            <div className="review-row" key={m.id}>
              <Check size={22} />
              <div>
                <strong>{m.title}</strong>
                <p>{m.detail}</p>
              </div>
              <button className="button secondary" onClick={() => share(m)}>
                <Share2 size={16} /> Share
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
