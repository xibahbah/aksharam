// Writes scripts/tts/clips.json: every text the site can play, most useful first.
// Run with: npm run audio:list
import { writeFileSync } from "node:fs";
import { letters } from "../../src/data/alphabet";
import { units } from "../../src/data/curriculum";
import { syllablesFrom } from "../../src/lib/syllables";
import { clipKey, speechText } from "../../src/lib/audio";
import type { Letter } from "../../src/types";

const clips = new Map<string, { key: string; text: string; label: string }>();
const add = (l: Letter) => {
  const text = speechText(l);
  const key = clipKey(text);
  if (!clips.has(key)) clips.set(key, { key, text, label: l.romanization });
};
// 1. Letters in teaching order, so a partial run covers early lessons first.
const known: Letter[] = [];
for (const unit of units) {
  unit.items.forEach(add);
  known.push(...unit.items);
  // 2. Syllables that this unit makes possible.
  if (!unit.extra) syllablesFrom(known, unit.items).forEach(add);
}
// 3. Anything else in the dataset.
letters.forEach(add);
const list = [...clips.values()];
writeFileSync(
  new URL("./clips.json", import.meta.url),
  `${JSON.stringify(list, null, 2)}\n`,
);
console.log(`Wrote ${list.length} clips to scripts/tts/clips.json`);
