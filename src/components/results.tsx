import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { categories } from "@/data/alphabet";
import { score, type Answer } from "@/lib/quiz";
export function Results({
  answers,
  onRetry,
  onRestart,
}: {
  answers: Answer[];
  onRetry: () => void;
  onRestart: () => void;
}) {
  const incorrect = answers.filter((a) => !a.correct);
  return (
    <div className="results">
      <div className="results-header panel">
        <h2>Test results</h2>
        <div className="result-score">
          {score(answers)}
          <span>%</span>
        </div>
        <p>
          {answers.filter((a) => a.correct).length} correct out of{" "}
          {answers.length} questions.
        </p>
        <div className="button-row">
          {incorrect.length > 0 && (
            <button className="button primary" onClick={onRetry}>
              <RotateCcw size={17} />
              Retry missed letters
            </button>
          )}
          <button className="button secondary" onClick={onRestart}>
            Start a new test <ArrowRight size={17} />
          </button>
          <Link href="/" className="text-link">
            Back home
          </Link>
        </div>
      </div>
      <div className="results-breakdown panel">
        <h3>By collection</h3>
        {categories
          .filter((c) =>
            answers.some((a) => a.question.letter.category === c.id),
          )
          .map((c) => {
            const group = answers.filter(
              (a) => a.question.letter.category === c.id,
            );
            return (
              <div className="performance-row" key={c.id}>
                <span>{c.name}</span>
                <span>
                  {group.filter((a) => a.correct).length} / {group.length}{" "}
                  correct
                </span>
                <strong>{score(group)}%</strong>
              </div>
            );
          })}
      </div>
      <div className="panel answer-review">
        <h3>Your answers</h3>
        {answers.map((a, i) => (
          <div className="review-row" key={i}>
            <span lang="ml">{a.question.letter.display}</span>
            <div>
              <strong>{a.question.letter.romanization}</strong>
              <p>{a.question.letter.note}</p>
              {!a.correct && (
                <small>
                  Your answer:{" "}
                  {a.question.type === "typing"
                    ? a.response
                    : a.question.options.find((o) => o.id === a.response)
                        ?.romanization}
                </small>
              )}
            </div>
            <span className={a.correct ? "correct-label" : "incorrect-label"}>
              {a.correct ? "Correct" : "Review"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
