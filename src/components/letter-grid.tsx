"use client";
import { useLayoutEffect, useRef } from "react";
import { motionAllowed, ease } from "./motion";
import type { Letter } from "@/types";
import { strengthNames } from "@/lib/lesson";
import { ProgressBar } from "./ui";
export function LetterGrid({
  letters,
  onSelect,
  strength,
}: {
  letters: Letter[];
  onSelect: (letter: Letter) => void;
  /** 0–4 learning strength; shows a small bar on each tile when given. */
  strength?: (id: string) => number;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const next = new Map<string, DOMRect>();
    grid.current?.querySelectorAll<HTMLElement>("[data-letter-id]").forEach(tile => {
      const id = tile.dataset.letterId!;
      const rect = tile.getBoundingClientRect(), old = previous.current.get(id);
      next.set(id, rect);
      if (motionAllowed() && tile.animate) {
        if (old && (old.x !== rect.x || old.y !== rect.y)) tile.animate([
          { transform: `translate(${old.x - rect.x}px,${old.y - rect.y}px)` }, { transform: "none" },
        ], { duration: 380, easing: ease });
        else if (!old) tile.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: ease });
      }
    });
    previous.current = next;
  }, [letters]);
  return (
    <div ref={grid} className="letter-grid">
      {letters.map((l) => {
        const level = strength?.(l.id);
        return (
          <button
            className="letter-tile"
            data-letter-id={l.id}
            key={l.id}
            onClick={() => onSelect(l)}
            aria-label={`${l.romanization}, ${l.subgroup}, ${l.usage}${level !== undefined ? `, ${strengthNames[level]}` : ""}`}
          >
            <span lang="ml">{l.display}</span>
            <strong>{l.romanization}</strong>
            {l.usage !== "core" && <small>{l.usage}</small>}
            {level !== undefined && level > 0 && (
              <ProgressBar
                value={level * 25}
                label={`${l.romanization} strength`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
