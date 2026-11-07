"use client";
import { useState } from "react";
import { letters } from "@/data/alphabet";
import { canCombine, makeSyllable } from "@/lib/syllables";
import { AudioButton } from "./audio-button";

const bases = letters.filter(
  (l) => ["consonants", "conjuncts"].includes(l.category) && l.usage === "core",
);
const signs = letters.filter(
  (l) => (l.category === "signs" || l.glyph === "ം") && l.usage === "core",
);

/** Combine any consonant with any vowel sign and see the syllable it makes. */
export function SyllableBuilder() {
  const [baseId, setBaseId] = useState(bases[0].id);
  const [signId, setSignId] = useState(signs[0].id);
  const base = bases.find((b) => b.id === baseId)!;
  const sign = signs.find((s) => s.id === signId)!;
  const syllable = canCombine(base, sign) ? makeSyllable(base, sign) : null;
  return (
    <section
      className="panel reference-intro"
      id="builder"
      aria-label="Syllable builder"
    >
      <div>
        <h3>Syllable builder</h3>
        <p>Pick a consonant and a vowel sign to see the syllable they make.</p>
        <div className="learn-options">
          <div className="select-field">
            <label htmlFor="builder-base">Consonant</label>
            <select
              id="builder-base"
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.glyph} {b.romanization}
                </option>
              ))}
            </select>
          </div>
          <div className="select-field">
            <label htmlFor="builder-sign">Vowel sign</label>
            <select
              id="builder-sign"
              value={signId}
              onChange={(e) => setSignId(e.target.value)}
            >
              {signs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display} {s.romanization}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {syllable && (
        <div className="intro-example" lang="ml" aria-live="polite">
          <span>
            {base.glyph}
            <small>{base.romanization}</small>
          </span>
          <b>+</b>
          <span>
            {sign.display}
            <small>{sign.romanization}</small>
          </span>
          <b>=</b>
          <span>
            {syllable.glyph}
            <small>{syllable.romanization}</small>
          </span>
          <AudioButton key={syllable.id} letter={syllable} />
        </div>
      )}
    </section>
  );
}
