"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { letterById } from "@/data/alphabet";
import { useProgress } from "@/hooks/use-progress";
import {
  shuffled,
  type QuestionType,
  type Answer,
  type Question,
} from "@/lib/quiz";
import { question, taughtLetters } from "@/lib/lesson";
import type { Deck, Letter } from "@/types";
import { PageHeading, ProgressBar } from "./ui";
import { DeckSelector } from "./deck-selector";
import { QuizQuestion } from "./quiz-question";
import { Results } from "./results";

/** Self-test on letters already taught. Each letter appears once. */
export function Practice() {
  const { ready } = useProgress();
  return ready ? <TestSession /> : <p role="status">Loading progress…</p>;
}
function TestSession() {
  const { progress, attempt } = useProgress();
  const [deck, setDeck] = useState<Deck>("all");
  const [count, setCount] = useState(10);
  const [types, setTypes] = useState<QuestionType[]>([
    "recognition",
    "reverse",
  ]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [phase, setPhase] = useState<"setup" | "session" | "results">("setup");
  const taught = taughtLetters(progress);
  const pool = taught.filter((l) => deck === "all" || l.category === deck);
  function start(custom?: Letter[]) {
    const chosen = custom ?? shuffled(pool).slice(0, count);
    if (!chosen.length || !types.length) return;
    setQuestions(
      chosen.map((l, i) => question(l, types[i % types.length], taught)),
    );
    setIndex(0);
    setAnswers([]);
    setPhase("session");
  }
  function record(response: string, correct: boolean) {
    const q = questions[index];
    setAnswers((a) => [...a, { question: q, response, correct }]);
    attempt(q.letter.id, correct, true);
  }
  const step = questions[index];
  return (
    <>
      <PageHeading
        title="Test"
        description="Check the letters you have learned. No Malayalam keyboard needed."
      />
      {phase === "setup" ? (
        taught.length < 3 ? (
          <div className="empty-state">
            <Check size={32} />
            <h2>Learn a few letters first</h2>
            <p>
              Tests use letters you have been taught. One lesson is enough to
              start.
            </p>
            <Link className="button primary" href="/learn">
              Start a lesson <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="test-setup">
            <section className="panel setup-panel">
              <h2>Test setup</h2>
              <p>{taught.length} learned letters available.</p>
              <DeckSelector value={deck} onChange={setDeck} review={false} />
              <div className="select-field">
                <label htmlFor="question-count">Number of questions</label>
                <select
                  id="question-count"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[5, 10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} questions
                    </option>
                  ))}
                </select>
                <small>
                  {pool.length
                    ? `${Math.min(pool.length, count)} distinct letters from this collection.`
                    : "You have not learned letters in this collection yet."}
                </small>
              </div>
              <fieldset className="type-options">
                <legend>Question types</legend>
                {(
                  [
                    {
                      id: "recognition",
                      name: "Recognize the sound",
                      sub: "Malayalam → romanization",
                    },
                    {
                      id: "reverse",
                      name: "Find the letter",
                      sub: "Romanization → Malayalam",
                    },
                    {
                      id: "typing",
                      name: "Type the romanization",
                      sub: "Accent buttons included",
                    },
                  ] as const
                ).map((t) => (
                  <label key={t.id}>
                    <input
                      type="checkbox"
                      checked={types.includes(t.id)}
                      onChange={(e) =>
                        setTypes((v) =>
                          e.target.checked
                            ? [...v, t.id]
                            : v.filter((x) => x !== t.id),
                        )
                      }
                    />
                    <span>
                      {t.name}
                      <small>{t.sub}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                className="button primary wide"
                disabled={!types.length || !pool.length}
                onClick={() => start()}
              >
                Start test <ArrowRight size={18} />
              </button>
            </section>
          </div>
        )
      ) : phase === "results" ? (
        <Results
          answers={answers}
          onRestart={() => setPhase("setup")}
          onRetry={() =>
            start(
              Array.from(
                new Set(
                  answers
                    .filter((a) => !a.correct)
                    .map((a) => a.question.letter.id),
                ),
              ).map((id) => letterById[id]),
            )
          }
        />
      ) : (
        <div className="session-wrap">
          <div className="session-heading">
            <button className="text-link" onClick={() => setPhase("setup")}>
              End test
            </button>
            <span>
              Question {index + 1} of {questions.length}
            </span>
          </div>
          <ProgressBar
            value={(index / questions.length) * 100}
            label="Test progress"
          />
          {step && (
            <QuizQuestion
              key={index}
              question={step}
              onAnswer={record}
              onNext={() =>
                index === questions.length - 1
                  ? setPhase("results")
                  : setIndex((i) => i + 1)
              }
              number={index + 1}
              total={questions.length}
            />
          )}
        </div>
      )}
    </>
  );
}
