"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, ShieldCheck } from "lucide-react";
import { coreLetters } from "@/data/alphabet";
import { units, coreUnitCount } from "@/data/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { mastered } from "@/lib/progress";
import { currentStreak, needsBackup, xpToday } from "@/lib/habit";
import {
  nextAction,
  strength,
  unitStates,
  type NextAction,
} from "@/lib/lesson";
import { PageHeading, ProgressBar } from "@/components/ui";
import type { LearningReason } from "@/types";

export default function Home() {
  const { ready, progress } = useProgress();
  // Wait for saved progress so a returning learner never sees a zero streak flash.
  if (!ready) return <p role="status">Loading your progress…</p>;
  if (!progress.onboarded && !progress.introduced.length) return <Welcome />;
  return <Path />;
}

const reasons: { id: LearningReason; label: string }[] = [
  { id: "family", label: "To connect with family or a partner" },
  { id: "heritage", label: "It's my heritage language" },
  { id: "travel", label: "For travel to Kerala" },
  { id: "curious", label: "I'm curious about scripts" },
];
const goals = [
  { xp: 10, label: "Casual", detail: "about 3 minutes a day" },
  { xp: 15, label: "Regular", detail: "about 5 minutes a day" },
  { xp: 30, label: "Serious", detail: "about 10 minutes a day" },
  { xp: 50, label: "Intense", detail: "about 15 minutes a day" },
];

function Welcome() {
  const { profile, preferences } = useProgress();
  const [step, setStep] = useState(0);
  return (
    <>
      <PageHeading
        title="Read Malayalam"
        description="Short daily lessons. You'll read your first syllables in five minutes."
      />
      <section className="panel setup-panel" aria-live="polite">
        {step === 0 && (
          <>
            <h2>Why are you learning?</h2>
            <div
              className="learn-modes"
              role="group"
              aria-label="Reason for learning"
            >
              {reasons.map((r) => (
                <button
                  key={r.id}
                  className="learn-mode panel"
                  onClick={() => {
                    profile({ reason: r.id });
                    setStep(1);
                  }}
                >
                  <strong>{r.label}</strong>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2>Pick a daily goal</h2>
            <div className="learn-modes" role="group" aria-label="Daily goal">
              {goals.map((g) => (
                <button
                  key={g.xp}
                  className="learn-mode panel"
                  onClick={() => {
                    preferences({ dailyGoal: g.xp });
                    setStep(2);
                  }}
                >
                  <strong>{g.label}</strong>
                  <span>{g.detail}</span>
                  <small>{g.xp} XP</small>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Do you know any Malayalam letters?</h2>
            <div
              className="learn-modes"
              role="group"
              aria-label="Starting point"
            >
              <Link
                className="learn-mode panel"
                href="/learn"
                onClick={() => profile({ onboarded: true })}
              >
                <strong>Start from scratch</strong>
                <span>Lesson 1 teaches ക, ന, മ and the ā sign.</span>
              </Link>
              <Link
                className="learn-mode panel"
                href="/learn?mode=placement&unit=unit-1"
                onClick={() => profile({ onboarded: true })}
              >
                <strong>I know some already</strong>
                <span>Take a quick check and skip what you know.</span>
              </Link>
            </div>
          </>
        )}
        <p className="muted">
          Step {step + 1} of 3 · No account needed. Progress stays in this
          browser.
        </p>
      </section>
    </>
  );
}

function describe(next: NextAction): { title: string; detail: string } {
  if (next.kind === "unit")
    return {
      title: `Unit ${units.indexOf(next.unit) + 1}: ${next.unit.title}`,
      detail: next.unit.goal,
    };
  if (next.kind === "review")
    return {
      title: `${next.count} letters ready for review`,
      detail: "A quick review now keeps them from slipping.",
    };
  if (next.kind === "weak")
    return {
      title: `Fix ${next.count} weak letter${next.count > 1 ? "s" : ""}`,
      detail: "Practise the letters you have missed.",
    };
  return {
    title: "Keep sharp",
    detail: "Everything is learned. A short practice keeps it fresh.",
  };
}

function Path() {
  const { progress, now } = useProgress();
  const at = now;
  const next = nextAction(progress, at);
  const { title, detail } = describe(next);
  const states = unitStates(progress);
  const goal = progress.preferences.dailyGoal;
  const today = xpToday(progress, at);
  const days = currentStreak(progress, at);
  const learned = coreLetters.filter((l) =>
    progress.introduced.includes(l.id),
  ).length;
  const strong = coreLetters.filter(
    (l) => strength(progress, l.id) >= 3,
  ).length;
  const masteredCount = Object.values(progress.cards).filter(mastered).length;
  return (
    <>
      <PageHeading
        title="Learn"
        action={
          <span className="streak-chip">
            {days}-day streak
            {progress.freezes
              ? ` · ${progress.freezes} rest day${progress.freezes > 1 ? "s" : ""}`
              : ""}
          </span>
        }
      />
      <section className="dashboard-study panel" aria-label="Next lesson">
        <div className="review-summary">
          <div>
            <h2>{title}</h2>
            <p>{detail}</p>
          </div>
        </div>
        <Link className="button primary" href="/learn">
          {progress.introduced.length ? "Continue" : "Start lesson 1"}
          <ArrowRight size={18} />
        </Link>
        {next.kind === "unit" && progress.introduced.length > 0 && (
          <Link
            className="text-link"
            href={`/learn?mode=placement&unit=${next.unit.id}`}
          >
            Already know these? Test out
          </Link>
        )}
      </section>
      {needsBackup(progress, at) && (
        <div className="notice" role="note">
          <ShieldCheck size={18} /> Your progress lives only in this browser.{" "}
          <Link href="/settings#backup">Save a backup</Link> so it can&apos;t be
          lost.
        </div>
      )}
      <section className="daily-goal panel" aria-label="Daily goal">
        <div>
          <h2>Daily goal</h2>
          <p>
            {today} / {goal} XP{today >= goal ? " · Goal reached" : ""}
          </p>
        </div>
        <ProgressBar value={(today / goal) * 100} label="Daily goal" />
      </section>
      <div className="stats-grid" aria-label="Learning statistics">
        {[
          ["Learned", `${learned}`, `/ ${coreLetters.length}`],
          ["Strong", `${strong}`, ""],
          ["Mastered", `${masteredCount}`, ""],
          ["Streak", `${days}`, days === 1 ? " day" : " days"],
        ].map(([label, value, small]) => (
          <div className="stat" key={label}>
            <div>
              <span>{label}</span>
              <strong>
                {value}
                {small && <small> {small}</small>}
              </strong>
            </div>
          </div>
        ))}
      </div>
      <section className="alphabet-section" aria-label="Learning path">
        <div className="section-header">
          <h2>Your path</h2>
          <Link href="/reference">
            Alphabet <ArrowRight size={16} />
          </Link>
        </div>
        <div className="deck-grid" role="list">
          {units.map((u, i) => {
            const state = states[u.id];
            const taught = u.items.filter((l) =>
              progress.introduced.includes(l.id),
            ).length;
            const glyphs = (
              <span className="deck-symbol" lang="ml">
                {u.items.map((l) => l.display).join(" ")}
              </span>
            );
            const body = (
              <>
                <div className="deck-card-top">
                  {glyphs}
                  {state === "done" ? (
                    <Check size={19} aria-label="Done" />
                  ) : state === "locked" ? (
                    <Lock size={17} aria-label="Locked" />
                  ) : null}
                </div>
                <h3>
                  {u.extra ? "Extra" : `Unit ${i + 1}`}: {u.title}
                </h3>
                <p>{u.goal}</p>
                <ProgressBar
                  value={(taught / u.items.length) * 100}
                  label={`${u.title} progress`}
                />
              </>
            );
            return (
              <div
                role="listitem"
                key={u.id}
                aria-current={state === "current" ? "step" : undefined}
              >
                {state === "locked" ? (
                  <div className="deck-card">{body}</div>
                ) : (
                  <Link
                    className="deck-card"
                    href={`/learn?mode=unit&unit=${u.id}`}
                  >
                    {body}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <p className="muted">
          {coreUnitCount} core units. Extra units cover rare and historic forms.
        </p>
      </section>
    </>
  );
}
