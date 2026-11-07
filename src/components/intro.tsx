"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./intro.module.css";

/**
 * Opening animation for a first visit (about 5 seconds):
 * a pookalam hops in → two figures grow, lean together and embrace →
 * a card with അ drops into their hands → sparkles and a ring of text →
 * Start. Pure SVG + CSS. Tap anywhere to skip. Reduced motion shows the
 * final frame immediately.
 */

// Limbs are thick round strokes; the goo filter melts them into one form.
// Left figure is taller and leans right; right figure is shorter and leans left.
const bodies = [
  {
    d: "M 200 600 C 168 500 232 440 272 400 C 312 360 300 292 332 238",
    w: "torso",
    delay: 1.3,
  },
  {
    d: "M 640 600 C 680 520 622 470 586 432 C 550 392 560 334 522 292",
    w: "torso",
    delay: 1.4,
  },
];
const arms = [
  // Upper arms come round to hold the card's sides.
  {
    d: "M 300 342 C 236 348 246 278 300 290 C 326 296 336 322 352 336",
    delay: 1.85,
  },
  {
    d: "M 548 382 C 612 362 602 300 550 312 C 516 320 472 334 452 342",
    delay: 1.92,
  },
  // Lower arms wrap around each other: an embrace.
  {
    d: "M 256 432 C 320 524 470 506 522 436 C 542 406 574 410 590 428",
    delay: 2.0,
  },
  {
    d: "M 600 482 C 522 562 360 562 300 502 C 282 484 254 488 240 502",
    delay: 2.06,
  },
];
const heads = [
  { cx: 346, cy: 188, r: 46, delay: 1.72 },
  { cx: 383, cy: 199, r: 13, delay: 1.78 }, // nose, facing right
  { cx: 500, cy: 246, r: 42, delay: 1.8 },
  { cx: 466, cy: 254, r: 12, delay: 1.86 }, // nose, facing left
];
// Fingers fan out from each hand: [hand x, hand y, [dx, dy]...].
const hands: [number, number, [number, number][]][] = [
  [
    352,
    336,
    [
      [12, -26],
      [26, -14],
      [30, 2],
      [22, 18],
    ],
  ],
  [
    452,
    342,
    [
      [-12, -26],
      [-26, -14],
      [-30, 2],
      [-22, 18],
    ],
  ],
  [
    590,
    428,
    [
      [24, -18],
      [30, 2],
      [20, 22],
    ],
  ],
  [
    240,
    502,
    [
      [-24, -18],
      [-30, 2],
      [-20, 22],
    ],
  ],
];
const sparkles: [number, number, number][] = [
  [300, 92, 0.55],
  [520, 70, 0.42],
  [690, 300, 0.5],
  [118, 330, 0.46],
  [470, 568, 0.36],
  [140, 120, 0.3],
];

function Flower() {
  return (
    <g className={styles.cream}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-22}
          rx={10}
          ry={17}
          transform={`rotate(${i * 45})`}
        />
      ))}
      <circle r={12} />
    </g>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const ringText = useRef<SVGTextElement>(null);
  // Fill exactly one loop by widening the gaps between words. Letter spacing
  // is never changed: it would break Malayalam conjuncts apart.
  useEffect(() => {
    let cancelled = false;
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      const text = ringText.current;
      const path = document.getElementById("intro-ring");
      if (
        cancelled ||
        !text?.getComputedTextLength ||
        !(path instanceof SVGPathElement) ||
        !path.getTotalLength
      )
        return;
      const gaps = (text.textContent?.match(/ /g) ?? []).length;
      const spare = path.getTotalLength() - text.getComputedTextLength() - 6;
      if (gaps && spare > 0) text.style.wordSpacing = `${spare / gaps}px`;
    });
    return () => {
      cancelled = true;
    };
  }, []);
  function finish() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onDone, 450);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const ring =
    "അക്ഷരം • Aksharam • learn to read Malayalam • ഒരു സമ്മാനം • a gift • ";
  const limb = (d: string, cls: string, delay: number) => (
    <path
      key={d}
      className={`${styles.limb} ${cls}`}
      pathLength={1}
      d={d}
      style={{ animationDelay: `${delay}s` }}
    />
  );
  return (
    <div
      className={`${styles.stage} ${leaving ? styles.leaving : ""}`}
      onClick={finish}
      role="dialog"
      aria-label="Welcome to Aksharam"
    >
      <svg
        className={styles.art}
        viewBox="0 0 800 600"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Melts overlapping strokes into one liquid shape. */}
          <filter id="intro-goo" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
            <feColorMatrix
              in="b"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            />
          </filter>
          <path
            id="intro-ring"
            d="M 400 34 a 350 268 0 1 1 -0.1 0"
            fill="none"
          />
        </defs>

        {/* 1. Loader: a pookalam hops across the dark. */}
        <g className={styles.hopper}>
          <Flower />
        </g>

        {/* 2. Two figures grow, lean in and embrace. */}
        <g filter="url(#intro-goo)" className={styles.figures}>
          {bodies.map((b) => limb(b.d, styles.torso, b.delay))}
          {heads.map((h) => (
            <circle
              key={`${h.cx}`}
              className={styles.head}
              cx={h.cx}
              cy={h.cy}
              r={h.r}
              style={{ animationDelay: `${h.delay}s` }}
            />
          ))}
          {arms.map((a) => limb(a.d, styles.arm, a.delay))}
        </g>

        {/* 3. The gift: a card with the first letter. */}
        <g className={styles.cardDrop}>
          <g transform="translate(401 300)">
            <path
              className={styles.card}
              d="M -48 78 V -26 A 48 48 0 0 1 48 -26 V 78 Z"
            />
            <path
              className={styles.cardLine}
              d="M -38 68 V -24 A 38 38 0 0 1 38 -24 V 68 Z"
            />
            <text className={styles.letter} lang="ml" y={2} textAnchor="middle">
              അ
            </text>
          </g>
        </g>

        {/* Fingers sit in front of the card, so the hands hold it. */}
        <g filter="url(#intro-goo)">
          {hands.flatMap(([x, y, fingers], h) =>
            fingers.map(([dx, dy], i) =>
              limb(
                `M ${x} ${y} l ${dx} ${dy}`,
                styles.finger,
                2.3 + h * 0.06 + i * 0.04,
              ),
            ),
          )}
        </g>

        {/* 4. Sparkles and an orbiting ring of words. */}
        {sparkles.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g
              className={styles.sparkle}
              style={{ animationDelay: `${3.2 + i * 0.12}s` }}
            >
              <Flower />
            </g>
          </g>
        ))}
        <g className={styles.ringWrap}>
          <g className={styles.ringSpin}>
            <text className={styles.ringText} ref={ringText}>
              <textPath href="#intro-ring" lang="ml">
                {ring.repeat(2)}
              </textPath>
            </text>
          </g>
        </g>
      </svg>

      <button
        className={`button primary ${styles.start}`}
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        Start
      </button>
      <span className={styles.skip}>Tap anywhere to skip</span>
    </div>
  );
}
