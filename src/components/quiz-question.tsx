"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ArrowRight, X } from "lucide-react";
import { almostCorrect, isCorrect, type Question } from "@/lib/quiz";
import { motionAllowed, ease } from "./motion";
import { AudioButton } from "./audio-button";

/** Every accented character used by the romanizations, for phones without an accent picker. */
export const ACCENT_KEYS = [
  "ā",
  "ī",
  "ū",
  "ē",
  "ō",
  "r̥",
  "l̥",
  "ṁ",
  "ḥ",
  "ṅ",
  "ñ",
  "ṭ",
  "ḍ",
  "ṇ",
  "ś",
  "ṣ",
  "ḷ",
  "ḻ",
  "ṟ",
];
export function QuizQuestion({
  question,
  onAnswer,
  onNext,
}: {
  question: Question;
  onAnswer: (response: string, correct: boolean) => void;
  onNext: () => void;
  /** Position in the session; shown by the session header, not here. */
  number?: number;
  total?: number;
}) {
  const [response, setResponse] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const feedbackId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const correct = response !== null && isCorrect(question, response);
  const almost = response !== null && almostCorrect(question, response);
  useEffect(() => {
    if (!correct || !motionAllowed()) return;
    const from = panel.current?.querySelector(".answer-correct")?.getBoundingClientRect();
    const to = document.querySelector(".lesson-step .bloom")?.getBoundingClientRect();
    if (!from || !to || !Element.prototype.animate) return;
    const petal = document.createElement("span");
    petal.setAttribute("aria-hidden", "true");
    Object.assign(petal.style, { position: "fixed", left: `${from.right - 26}px`, top: `${from.top + from.height / 2}px`, width: "14px", height: "22px", background: "var(--coral)", borderRadius: "70% 40% 65% 40%", pointerEvents: "none", zIndex: "50" });
    document.body.appendChild(petal);
    const animation = petal.animate([
      { transform: "translate(0,0) scale(.7)", opacity: 0 },
      { transform: "translate(0,-20px) scale(1)", opacity: 1, offset: .2 },
      { transform: `translate(${to.x - from.right + 30}px,${to.y - from.top - from.height / 2}px) scale(.3)`, opacity: 0 },
    ], { duration: 650, easing: ease });
    animation.onfinish = () => petal.remove();
    return () => { animation.cancel(); petal.remove(); };
  }, [correct]);
  const glyphOptions =
    question.type === "reverse" || question.type === "listen";
  function insert(key: string) {
    const el = input.current;
    const start = el?.selectionStart ?? typed.length;
    const end = el?.selectionEnd ?? typed.length;
    setTyped(typed.slice(0, start) + key + typed.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + key.length, start + key.length);
    });
  }
  function submit(value: string) {
    if (response !== null) return;
    const right = isCorrect(question, value);
    setResponse(value);
    onAnswer(value, right);
    // A short tap for right, a double buzz for wrong (phones that support it).
    navigator.vibrate?.(right ? 12 : [20, 60, 20]);
  }
  // Keyboard: 1–4 or A–D picks an option (not while typing an answer).
  useEffect(() => {
    if (question.type === "typing" || response !== null) return;
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.matches("input,textarea,select")
      )
        return;
      const i =
        "1234".indexOf(e.key) + 1 || "abcd".indexOf(e.key.toLowerCase()) + 1;
      const option = question.options[i - 1];
      if (i && option) {
        e.preventDefault();
        submit(option.id);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  return (
    <div
      ref={panel}
      className={`quiz-panel panel${response !== null ? " quiz-answered" : ""}`}
      data-feedback={response === null ? undefined : correct ? "correct" : "incorrect"}
    >
      <div className="quiz-kicker">
        <span>
          {question.type === "reverse"
            ? "RECALL THE LETTER"
            : question.type === "listen"
              ? "LISTEN"
              : question.type === "typing"
                ? "RECALL THE SOUND"
                : "RECOGNIZE THE SOUND"}
        </span>
      </div>
      <h2>
        {question.type === "reverse"
          ? "Which letter makes this sound?"
          : question.type === "listen"
            ? "Which one did you hear?"
            : question.type === "typing"
              ? "How is this written in romanization?"
              : "What sound does this letter make?"}
      </h2>
      {question.type === "listen" ? (
        <AudioButton letter={question.letter} autoPlay />
      ) : (
        <div
          className={
            question.type === "reverse" ? "question-roman" : "question-glyph"
          }
          lang={question.type === "reverse" ? "en" : "ml"}
        >
          {question.type === "reverse"
            ? question.letter.romanization
            : question.letter.display}
        </div>
      )}
      {question.type === "typing" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) submit(typed);
          }}
        >
          <label className="typing-label" htmlFor="typed-answer">
            Your romanization
          </label>
          <input
            ref={input}
            id="typed-answer"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={response !== null}
            required
          />
          <div
            className="button-row"
            role="group"
            aria-label="Accented letters"
          >
            {ACCENT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="button secondary"
                disabled={response !== null}
                onClick={() => insert(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <button
            className="button primary"
            disabled={response !== null || !typed.trim()}
          >
            Check answer <Check size={17} />
          </button>
        </form>
      ) : (
        <div className="answer-grid">
          {question.options.map((o, i) => (
            <button
              key={o.id}
              disabled={response !== null}
              className={`answer-option ${glyphOptions ? "glyph-option" : ""} ${response !== null && o.id === question.letter.id ? "answer-correct" : ""} ${response === o.id && !correct ? "answer-wrong" : ""}`}
              onClick={() => submit(o.id)}
            >
              <span className="option-number">
                {String.fromCharCode(65 + i)}
              </span>
              <span lang={glyphOptions ? "ml" : "en"}>
                {glyphOptions ? o.display : o.romanization}
              </span>
              {response !== null && o.id === question.letter.id && (
                <Check size={20} />
              )}
            </button>
          ))}
        </div>
      )}
      {response !== null && (
        <div className="answer-dock">
          <div
            className={`answer-feedback ${correct ? "correct" : "incorrect"}`}
          >
            <div className="answer-feedback-copy" role="status" id={feedbackId}>
              <div className="answer-feedback-result">
                {correct ? <Check size={21} /> : <X size={21} />}
                <strong>
                  {correct ? "Correct" : almost ? "Almost!" : "Not quite"}
                </strong>
              </div>
              <p>
                <strong>
                  <span lang="ml">{question.letter.glyph}</span> ·{" "}
                  {question.letter.romanization}
                </strong>{" "}
                —{" "}
                {almost
                  ? `Right letters, but the accents matter: it is ${question.letter.romanization}.`
                  : question.letter.note}
              </p>
            </div>
            <button
              className="button primary"
              aria-describedby={feedbackId}
              ref={(button) => {
                // Move keyboard focus out of disabled answers without scrolling
                // the page; this also dismisses the typing keyboard on phones.
                button?.focus({ preventScroll: true });
              }}
              onClick={onNext}
            >
              Continue <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
