"use client";
import { useEffect, useState } from "react";
import styles from "./intro.module.css";

/**
 * Opening animation for a first visit (about 5 seconds):
 * a pookalam hops in → two figures lean in from either side, face each
 * other and hold up a card → the card's letter അ appears → one line of
 * text and a few flowers → Start. Pure SVG + CSS. Tap anywhere to skip.
 * Reduced motion shows the final frame immediately.
 */

// Silhouettes in a 1000 × 620 scene. Left figure faces right; right figure
// faces left and wears a bun. Their hands hold the card's lower corners.
const LEFT =
  "M 246 620 C 262 560 222 500 244 440 C 262 392 262 345 268 310 C 240 290 228 250 236 210 C 246 150 300 122 350 132 C 385 140 405 165 408 188 C 410 200 428 208 436 216 C 440 222 432 228 420 230 C 426 238 428 246 420 250 C 426 256 424 264 414 266 C 412 278 400 286 386 286 C 378 300 380 318 390 330 C 404 352 418 372 440 384 C 466 372 492 362 502 372 C 508 382 490 388 476 392 C 500 390 514 398 508 410 C 502 418 486 414 472 414 C 494 416 500 426 492 434 C 484 440 470 434 456 434 C 470 442 468 452 456 452 C 440 452 426 440 410 436 C 384 430 368 442 358 462 C 344 492 352 540 362 574 C 368 596 372 610 376 620 Z";
const RIGHT =
  "M 764 620 C 750 566 786 504 762 452 C 744 405 752 360 742 332 C 772 318 788 280 780 240 C 772 196 740 170 700 172 C 664 174 640 196 636 220 C 634 230 618 238 606 246 C 600 252 606 258 618 258 C 612 266 612 274 622 276 C 616 284 620 292 630 292 C 630 304 642 312 656 312 C 662 326 658 340 648 352 C 632 372 614 388 594 398 C 568 392 538 392 536 404 C 534 414 552 416 566 418 C 544 424 538 434 546 440 C 554 446 568 438 578 436 C 562 446 562 458 572 460 C 584 462 592 452 598 448 C 594 458 602 468 614 462 C 640 448 654 440 672 430 C 690 462 674 512 670 548 C 666 584 664 608 666 620 Z";
// The left figure's other arm reaches under the card to the other's waist.
const REACH = "M 352 478 C 420 548 560 556 650 490";
const REACH_FINGERS = [
  "M 650 490 l 6 -24",
  "M 650 490 l 20 -16",
  "M 650 490 l 24 -2",
];
const FLOWERS: [number, number, number][] = [
  [150, 150, 0.42],
  [870, 120, 0.5],
  [905, 430, 0.34],
  [95, 420, 0.3],
];
// Phones are portrait: crop the side margins so the figures stay large.
const WIDE = "0 0 1000 620";
const NARROW = "196 28 618 592";

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
  const [viewBox] = useState(() =>
    window.matchMedia?.("(max-aspect-ratio: 4/5)").matches ? NARROW : WIDE,
  );
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
  return (
    <div
      className={`${styles.stage} ${leaving ? styles.leaving : ""}`}
      onClick={finish}
      role="dialog"
      aria-label="Welcome to Aksharam"
    >
      <svg
        className={styles.art}
        viewBox={viewBox}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <path id="intro-arc" d="M 230 118 Q 500 -10 770 118" fill="none" />
        </defs>

        {/* 1. Loader: a pookalam hops across the dark. */}
        <g className={styles.hopper}>
          <Flower />
        </g>

        {/* 3. The card sits behind the hands that hold it. */}
        <g className={styles.cardDrop}>
          <g transform="translate(500 318)">
            <path
              className={styles.card}
              d="M -82 118 V -38 A 82 82 0 0 1 82 -38 V 118 Z"
            />
            <path
              className={styles.cardLine}
              d="M -68 104 V -36 A 68 68 0 0 1 68 -36 V 104 Z"
            />
            <text
              className={styles.letter}
              lang="ml"
              y={-4}
              textAnchor="middle"
            >
              അ
            </text>
          </g>
        </g>

        {/* 2. Two figures lean in from either side and face each other. */}
        <path className={`${styles.figure} ${styles.left}`} d={LEFT} />
        <g className={`${styles.figure} ${styles.right}`}>
          <circle cx={772} cy={212} r={30} />
          <path d={RIGHT} />
        </g>
        <path
          className={`${styles.limb} ${styles.reach}`}
          pathLength={1}
          d={REACH}
        />
        {REACH_FINGERS.map((d, i) => (
          <path
            key={d}
            className={`${styles.limb} ${styles.finger}`}
            pathLength={1}
            d={d}
            style={{ animationDelay: `${2.55 + i * 0.05}s` }}
          />
        ))}

        {/* 4. One line of text over their heads, and a few flowers. */}
        <text className={styles.arcText}>
          <textPath
            href="#intro-arc"
            startOffset="50%"
            textAnchor="middle"
            lang="ml"
          >
            അക്ഷരം · learn to read Malayalam
          </textPath>
        </text>
        {FLOWERS.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <g
              className={styles.sparkle}
              style={{ animationDelay: `${3.4 + i * 0.15}s` }}
            >
              <Flower />
            </g>
          </g>
        ))}
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
