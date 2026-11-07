"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Shuffle,
  ArrowLeftRight,
  Check,
  Keyboard,
} from "lucide-react";
import { letters, categories } from "@/data/alphabet";
import { useProgress } from "@/hooks/use-progress";
import { shuffled } from "@/lib/quiz";
import type { Deck, Rating } from "@/types";
import { Card } from "./card";
import { DeckSelector } from "./deck-selector";
import { AudioButton } from "./audio-button";
import { PageHeading, ProgressBar } from "./ui";
export function Flashcards() {
  const { ready } = useProgress();
  return ready ? (
    <FlashcardsSession />
  ) : (
    <p className="muted">Loading flashcards…</p>
  );
}
function FlashcardsSession() {
  const params = useSearchParams();
  const initial = params.get("deck");
  const valid = (v: string | null): v is Deck =>
    v === "all" || v === "review" || categories.some((c) => c.id === v);
  const [deck, setDeck] = useState<Deck>(valid(initial) ? initial : "all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [includeRare, setIncludeRare] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [tally, setTally] = useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [finished, setFinished] = useState(false);
  const { progress, rate, favorite } = useProgress();
  // Freeze the custom review selection for this session, so rating a due card does not remove it mid-flip.
  const [reviewIds] = useState(() =>
    letters
      .filter(
        (l) =>
          progress.introduced.includes(l.id) &&
          (progress.favorites.includes(l.id) ||
            (progress.cards[l.id]?.nextReview ?? Infinity) <= Date.now()),
      )
      .sort(
        (a, b) =>
          (progress.cards[a.id]?.nextReview ?? Infinity) -
          (progress.cards[b.id]?.nextReview ?? Infinity),
      )
      .map((l) => l.id),
  );
  const pool = useMemo(
    () =>
      letters.filter(
        (l) =>
          // Only taught letters: flashcards practise, Learn teaches.
          progress.introduced.includes(l.id) &&
          (deck === "all" ||
            (deck === "review" && reviewIds.includes(l.id)) ||
            l.category === deck) &&
          (includeRare || l.usage === "core"),
      ),
    [deck, includeRare, reviewIds, progress.introduced],
  );
  const cards = useMemo(
    () =>
      deck === "review" && !order.length
        ? [...pool].sort(
            (a, b) => reviewIds.indexOf(a.id) - reviewIds.indexOf(b.id),
          )
        : order.length
          ? [...pool].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
          : pool,
    [order, pool, deck, reviewIds],
  );
  const letter = cards[index % Math.max(1, cards.length)];
  const navigate = useCallback(
    (by: number) => {
      setIndex((i) => (i + by + cards.length) % Math.max(1, cards.length));
      setFlipped(false);
      setFeedback("");
    },
    [cards.length],
  );
  const flip = useCallback(() => setFlipped((f) => !f), []);
  const rating = useCallback(
    (value: Rating) => {
      // Rate only after seeing the answer.
      if (!letter || !flipped) return;
      rate(letter.id, value);
      setTally((t) => ({ ...t, [value]: t[value] + 1 }));
      setFeedback(`${letter.romanization} saved as ${value}.`);
      setFlipped(false);
      if (index < cards.length - 1) setIndex((i) => i + 1);
      else setFinished(true);
    },
    [letter, flipped, rate, index, cards.length],
  );
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLElement &&
        (e.target.matches("input,textarea,select") ||
          e.target.isContentEditable)
      )
        return;
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLElement && e.target.closest("button,a"))
      ) {
        e.preventDefault();
        flip();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      }
      const r: Record<string, Rating> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      if (r[e.key]) rating(r[e.key]);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [flip, navigate, rating]);
  function changeDeck(d: Deck) {
    setDeck(d);
    setIndex(0);
    setFlipped(false);
    setOrder([]);
    setFeedback("");
    setFinished(false);
  }
  return (
    <>
      <PageHeading title="Flashcards" />
      <div className="study-layout">
        <section className="study-main" aria-label="Flashcard study">
          <div className="study-toolbar">
            <DeckSelector value={deck} onChange={changeDeck} />
            <div className="toolbar-actions">
              <button
                className={`icon-button ${order.length ? "selected" : ""}`}
                aria-label={
                  order.length ? "Use alphabet order" : "Shuffle cards"
                }
                title={order.length ? "Use alphabet order" : "Shuffle cards"}
                onClick={() => {
                  setOrder(order.length ? [] : shuffled(pool).map((c) => c.id));
                  setIndex(0);
                  setFlipped(false);
                }}
              >
                <Shuffle size={18} />
              </button>
              <button
                className={`icon-button ${reverse ? "selected" : ""}`}
                aria-label="Reverse card direction"
                aria-pressed={reverse}
                title="Reverse card direction"
                onClick={() => {
                  setReverse((v) => !v);
                  setFlipped(false);
                }}
              >
                <ArrowLeftRight size={18} />
              </button>
            </div>
          </div>
          {finished ? (
            <div className="empty-state" role="status">
              <Check size={32} />
              <h2>Deck complete</h2>
              <p>
                {tally.again + tally.hard + tally.good + tally.easy} cards rated
                · {tally.good + tally.easy} known · {tally.again + tally.hard}{" "}
                to see again soon.
              </p>
              <div className="button-row">
                <button
                  className="button secondary"
                  onClick={() => {
                    setFinished(false);
                    setIndex(0);
                    setTally({ again: 0, hard: 0, good: 0, easy: 0 });
                  }}
                >
                  Go again
                </button>
                <Link className="button primary" href="/">
                  Continue learning <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          ) : letter ? (
            <>
              <div className="study-meta">
                <span />
                <button
                  className={`bookmark-button ${progress.favorites.includes(letter.id) ? "selected" : ""}`}
                  aria-label={
                    progress.favorites.includes(letter.id)
                      ? "Remove bookmark"
                      : "Bookmark letter"
                  }
                  aria-pressed={progress.favorites.includes(letter.id)}
                  onClick={() => favorite(letter.id)}
                >
                  <Bookmark
                    size={17}
                    fill={
                      progress.favorites.includes(letter.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {progress.favorites.includes(letter.id)
                    ? "Bookmarked"
                    : "Bookmark"}
                </button>
              </div>
              <Card
                key={letter.id}
                letter={letter}
                flipped={flipped}
                onFlip={flip}
                reverse={reverse}
                onNavigate={navigate}
              />
              <div className="card-controls">
                <div className="card-navigation">
                  <button
                    className="round-button"
                    aria-label="Previous card"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span>
                    <strong>{(index % cards.length) + 1}</strong> /{" "}
                    {cards.length} cards
                  </span>
                  <button
                    className="round-button"
                    aria-label="Next card"
                    onClick={() => navigate(1)}
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
                <AudioButton key={letter.id} letter={letter} />
              </div>
              <ProgressBar
                value={((index + 1) / cards.length) * 100}
                label="Position in deck"
              />
              {flipped ? (
                <div className="rating-area">
                  <div className="rating-grid">
                    {(["again", "hard", "good", "easy"] as const).map(
                      (r, i) => (
                        <button
                          key={r}
                          onClick={() => rating(r)}
                          className={`rating ${r}`}
                        >
                          <span>{i + 1}</span>
                          {r[0].toUpperCase() + r.slice(1)}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
              {/* Announced to screen readers only; sighted users see the card move on. */}
              <p className="sr-only" role="status">
                {feedback}
              </p>
            </>
          ) : (
            <div className="empty-state">
              <Check size={32} />
              <h2>
                {progress.introduced.length
                  ? "No cards here yet"
                  : "Learn some letters first"}
              </h2>
              <p>
                {progress.introduced.length
                  ? deck === "review"
                    ? "Nothing is due or bookmarked. Come back when a review is due."
                    : "You have not learned letters in this collection yet."
                  : "Flashcards practise letters you have learned. Lesson 1 takes about five minutes."}
              </p>
              <Link className="button primary" href="/learn">
                {progress.introduced.length
                  ? "Continue learning"
                  : "Start lesson 1"}{" "}
                <ArrowRight size={17} />
              </Link>
            </div>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeRare}
              onChange={(e) => {
                setIncludeRare(e.target.checked);
                setIndex(0);
                setFlipped(false);
              }}
            />{" "}
            Include uncommon, historic & scholarly forms
          </label>
          <p className="keyboard-guide">
            <Keyboard size={16} aria-hidden="true" />
            <kbd>space</kbd> flip · <kbd>←</kbd>
            <kbd>→</kbd> move · <kbd>1</kbd>–<kbd>4</kbd> rate
          </p>
        </section>
      </div>
    </>
  );
}
