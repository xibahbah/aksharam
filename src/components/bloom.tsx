import { useId, type CSSProperties } from "react";
import { FINAL_FLOWER, COLORS, scaleOutline } from "./intro-art";
const outlines = FINAL_FLOWER.map(path => scaleOutline(path, .25));

/** Reuse the approved asymmetric landing flower; progress fills six sectors. */
export function Bloom({ progress = 1, celebrate = false }: { progress?: number; celebrate?: boolean }) {
  const id = useId();
  const point = (angle: number) => `${80 * Math.cos(angle)} ${80 * Math.sin(angle)}`;
  return <svg className={`bloom ${celebrate ? "bloom-celebrate" : ""}`} viewBox="-60 -60 120 120" aria-hidden="true">
    <path d={outlines[0]} fill="var(--coral)" opacity=".13" />
    <defs>{Array.from({ length: 6 }, (_, i) => <clipPath id={`${id}-${i}`} key={i}>
      <path d={`M0 0 L${point(-Math.PI / 2 + i * Math.PI / 3)} A80 80 0 0 1 ${point(-Math.PI / 2 + (i + 1) * Math.PI / 3)} Z`} />
    </clipPath>)}</defs>
    {Array.from({ length: 6 }, (_, i) => <g key={i} clipPath={`url(#${id}-${i})`} className="bloom-sector" style={{ "--petal-delay": `${i * 65}ms`, opacity: progress >= (i + 1) / 6 ? 1 : 0 } as CSSProperties}>
      {outlines.map((d, n) => <path key={n} d={d} fill={COLORS[n]} />)}
    </g>)}
  </svg>;
}
