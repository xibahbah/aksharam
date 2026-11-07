"use client";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Target,
  Layers,
  ClipboardCheck,
} from "lucide-react";
import { useProgress } from "@/hooks/use-progress";
import { dueLetters, taughtLetters, weakLetters } from "@/lib/lesson";
import { PageHeading } from "@/components/ui";

export default function PracticePage() {
  const { ready, progress, now } = useProgress();
  if (!ready) return <p role="status">Loading your progress…</p>;
  const learned = taughtLetters(progress).length;
  const due = dueLetters(progress, now).length;
  const weak = weakLetters(progress).length;
  const options = [
    {
      href: "/learn?mode=review",
      icon: Clock,
      title: due
        ? `Review ${due} due letter${due > 1 ? "s" : ""}`
        : "Review learned letters",
      detail: due
        ? "Letters scheduled for today, then your weakest."
        : "Nothing is due. Practise your weakest letters anyway.",
    },
    {
      href: "/learn?mode=weak",
      icon: Target,
      title: weak
        ? `Fix ${weak} weak letter${weak > 1 ? "s" : ""}`
        : "Weak letters",
      detail: weak
        ? "Letters you missed or found hard, with look-alikes."
        : "No weak letters right now.",
      disabled: !weak,
    },
    {
      href: "/flashcards",
      icon: Layers,
      title: "Flashcards",
      detail: "Flip through learned letters at your own pace.",
    },
    {
      href: "/test",
      icon: ClipboardCheck,
      title: "Test yourself",
      detail: "A scored check, with typing if you want it.",
    },
  ];
  return (
    <>
      <PageHeading title="Practice" />
      {!learned ? (
        <div className="empty-state">
          <h2>Nothing to practise yet</h2>
          <p>
            Practice uses letters you have learned. Your first lesson takes
            about five minutes.
          </p>
          <Link className="button primary" href="/learn">
            Start lesson 1 <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <nav className="learn-modes" aria-label="Practice options">
          {options.map((o) =>
            o.disabled ? (
              <div
                key={o.href}
                className="learn-mode panel"
                aria-disabled="true"
              >
                <o.icon size={20} />
                <strong>{o.title}</strong>
                <span>{o.detail}</span>
              </div>
            ) : (
              <Link key={o.href} href={o.href} className="learn-mode panel">
                <o.icon size={20} />
                <strong>{o.title}</strong>
                <span>{o.detail}</span>
              </Link>
            ),
          )}
        </nav>
      )}
    </>
  );
}
