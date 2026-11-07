import { letters } from "../data/alphabet";
import type { Letter } from "../types";

/**
 * Consonant + vowel-sign syllables generated from the dataset. ISO 15919
 * romanization is compositional: drop the consonant's inherent "a" and add
 * the sign's vowel (ka + ി i → ki). The glyph is plain Unicode composition;
 * the font draws the joined shape.
 */
const bases = new Set(["consonants", "conjuncts"]);
export function canCombine(base: Letter, sign: Letter): boolean {
  return (
    bases.has(base.category) &&
    base.romanization.endsWith("a") &&
    (sign.category === "signs" ||
      (sign.category === "special" && sign.glyph === "ം"))
  );
}
export function makeSyllable(base: Letter, sign: Letter): Letter {
  const glyph = base.glyph + sign.glyph;
  const romanization =
    sign.glyph === "ം"
      ? `${base.romanization}${sign.romanization}`
      : `${base.romanization.slice(0, -1)}${sign.romanization}`;
  return {
    id: `syl-${Array.from(glyph)
      .map((c) => c.codePointAt(0)!.toString(16))
      .join("-")}`,
    glyph,
    display: glyph,
    category: sign.category,
    subgroup: "Syllable",
    romanization,
    approximation: undefined,
    note: `${base.glyph} (${base.romanization}) + ${sign.display ?? sign.glyph} (${sign.romanization}) → ${glyph} (${romanization}).`,
    order: 0,
    usage: "core",
    syllable: { base: base.id, sign: sign.id },
  };
}
const byId = Object.fromEntries(letters.map((l) => [l.id, l]));
/** All syllables buildable from the given letters, newest letters first. */
export function syllablesFrom(known: Letter[], focus: Letter[] = []): Letter[] {
  const signs = known.filter((l) => l.category === "signs" || l.glyph === "ം");
  const consonants = known.filter((l) => bases.has(l.category));
  const focusIds = new Set(focus.map((l) => l.id));
  const all = consonants.flatMap((c) =>
    signs.filter((s) => canCombine(c, s)).map((s) => makeSyllable(c, s)),
  );
  const score = (s: Letter) =>
    Number(focusIds.has(s.syllable!.base)) +
    Number(focusIds.has(s.syllable!.sign));
  return all.sort((a, b) => score(b) - score(a));
}
export function syllableParts(s: Letter): [Letter, Letter] | null {
  if (!s.syllable) return null;
  return [byId[s.syllable.base], byId[s.syllable.sign]];
}
