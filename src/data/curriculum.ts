import { letters } from "./alphabet";
import type { Letter } from "../types";

/**
 * Learning path. Units are ordered by usefulness rather than by the
 * traditional chart, so learners read real syllables in the first lesson:
 * a few consonants plus a vowel sign come before the full vowel list.
 *
 * Draft order: a native Malayalam educator should review it.
 */
export interface Unit {
  id: string;
  title: string;
  /** Short promise shown on the path: what this unit lets you read. */
  goal: string;
  items: Letter[];
  /** Rare, historic and scholarly forms; optional, after the core path. */
  extra?: boolean;
}

const lookup = new Map(letters.map((l) => [`${l.category}:${l.glyph}`, l]));
function pick(spec: string): Letter[] {
  // "consonants:ക ന മ signs:ാ" → letters, in that order.
  const out: Letter[] = [];
  let category = "";
  for (const token of spec.split(/\s+/).filter(Boolean)) {
    const [maybeCategory, glyph] = token.includes(":")
      ? token.split(":")
      : [category, token];
    category = maybeCategory;
    const letter = lookup.get(`${category}:${glyph}`);
    if (!letter) throw new Error(`Unknown curriculum entry ${token}`);
    out.push(letter);
  }
  return out;
}

const core: [string, string, string][] = [
  ["First syllables", "Read കാ, നാ and മാ", "consonants:ക ന മ signs:ാ"],
  ["The i sound", "Read കി, തി and പാ", "consonants:ത പ ല signs:ി"],
  ["The u sound", "Read രു, വി and യാ", "consonants:ര വ യ signs:ു"],
  [
    "Word endings",
    "Read the -am ending, as in മരം",
    "consonants:ട ണ special:ം ്",
  ],
  [
    "Vowels that start words",
    "Read words that begin with a vowel",
    "vowels:അ ആ ഇ ഈ",
  ],
  ["Long vowels", "Hear and read long ī and ū", "vowels:ഉ ഊ signs:ീ ൂ"],
  ["The e sound", "Read കെ and സെ", "consonants:സ ള ജ signs:െ"],
  ["Long ē", "Read കേ, as in കേരളം", "consonants:ദ ച ഗ signs:േ"],
  ["More starting vowels", "Read എ, ഏ, ഒ and ഓ", "vowels:എ ഏ ഒ ഓ"],
  ["The o sound", "Read കൊ and ശൊ", "consonants:ശ ഷ ഹ signs:ൊ"],
  ["Chillus", "Read word-final n, r, l and ḷ", "chillu:ൻ ർ ൽ ൾ"],
  ["Long ō", "Read കോ and ബോ", "consonants:ബ ഭ ഴ signs:ോ"],
  ["The ai sound", "Read കൈ and റൈ", "consonants:റ ഞ ങ signs:ൈ"],
  [
    "Doubled letters",
    "Read ക്ക, ത്ത, ന്ന and പ്പ",
    "conjuncts:ക്ക ത്ത ന്ന പ്പ",
  ],
  [
    "Breathy sounds",
    "Tell plain and aspirated sounds apart",
    "consonants:ഖ ഘ ഛ ഥ",
  ],
  ["More breathy sounds", "Read ധ, ഫ, ഠ and ഡ", "consonants:ധ ഫ ഠ ഡ"],
  [
    "Rarer vowels",
    "Read ഐ, ഔ and the ṇ chillu",
    "consonants:ഢ chillu:ൺ vowels:ഐ ഔ",
  ],
  [
    "Last signs",
    "Read the au sign, visarga and r̥",
    "signs:ൗ special:ഃ signs:ൃ vowels:ഋ",
  ],
  [
    "More doubled letters",
    "Read മ്മ, ല്ല, ള്ള and ട്ട",
    "conjuncts:മ്മ ല്ല ള്ള ട്ട",
  ],
  ["Nasal pairs", "Read ങ്ങ, ച്ച, ഞ്ഞ and ണ്ണ", "conjuncts:ങ്ങ ച്ച ഞ്ഞ ണ്ണ"],
  [
    "Common clusters",
    "Read ങ്ക, ന്ത, മ്പ and ക്ഷ",
    "conjuncts:ങ്ക ന്ത മ്പ ക്ഷ",
  ],
  ["Sanskrit clusters", "Read ജ്ഞ, ത്ര and ശ്ര", "conjuncts:ജ്ഞ ത്ര ശ്ര"],
];

const coreUnits: Unit[] = core.map(([title, goal, spec], i) => ({
  id: `unit-${i + 1}`,
  title,
  goal,
  items: pick(spec),
}));
const taughtInCore = new Set(
  coreUnits.flatMap((u) => u.items.map((l) => l.id)),
);
const rare = letters.filter((l) => !taughtInCore.has(l.id));
const extraUnits: Unit[] = Array.from(
  { length: Math.ceil(rare.length / 4) },
  (_, i) => ({
    id: `extra-${i + 1}`,
    title: `Rare and historic forms ${i + 1}`,
    goal: "Recognise forms found in older or Sanskrit texts",
    items: rare.slice(i * 4, i * 4 + 4),
    extra: true,
  }),
);

export const units: Unit[] = [...coreUnits, ...extraUnits];
export const coreUnitCount = coreUnits.length;
export const unitById = Object.fromEntries(
  units.map((u) => [u.id, u]),
) as Record<string, Unit>;
/** Unit that teaches each letter. */
export const unitOfLetter = Object.fromEntries(
  units.flatMap((u) => u.items.map((l) => [l.id, u])),
) as Record<string, Unit>;
