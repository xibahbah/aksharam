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
  return (
    <div className="letter-grid">
      {letters.map((l) => {
        const level = strength?.(l.id);
        return (
          <button
            className="letter-tile"
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
