import manifest from "../data/audio-manifest.json";
import type { Letter } from "../types";

/**
 * Text that is spoken for an entry. A dependent sign has no sound on its own,
 * so it is voiced on ക; anusvara and virama likewise.
 */
export function speechText(letter: Letter): string {
  if (letter.syllable) return letter.glyph;
  if (letter.category === "signs") return `ക${letter.glyph}`;
  if (letter.category === "special") return `ക${letter.glyph}`;
  return letter.glyph;
}
/** Stable file name for a spoken text: its code points in hex. */
export function clipKey(text: string): string {
  return Array.from(text.normalize("NFC"))
    .map((c) => c.codePointAt(0)!.toString(16))
    .join("-");
}
const clips = new Set<string>((manifest as { clips: string[] }).clips);
/** Voice used for generated clips; shown so learners know it is synthetic. */
export const clipVoice = (manifest as { voice: string | null }).voice;
/** Public path of a generated clip for this entry, if one exists. */
export function clipPath(letter: Letter): string | undefined {
  const key = clipKey(speechText(letter));
  return clips.has(key) ? `/audio/${key}.m4a` : undefined;
}
export function hasClip(letter: Letter): boolean {
  return !!clipPath(letter) || !!letter.audioUrl;
}
