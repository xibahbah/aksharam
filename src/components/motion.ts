export const ease = "cubic-bezier(.22,1,.36,1)";
export function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** Preserve the glyph's visual position as its detail view opens. */
export function flyGlyph(source: Element | null, target: HTMLElement | null) {
  if (!source || !target || !motionAllowed() || !target.animate) return;
  const from = source.getBoundingClientRect(), to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;
  return target.animate([
    { transform: `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) scale(${from.width / to.width})`, opacity: .6 },
    { transform: "none", opacity: 1 },
  ], { duration: 480, easing: ease });
}
