"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { LETTER_A } from "./intro-glyph";
import styles from "./intro.module.css";

gsap.registerPlugin(MorphSVGPlugin);

/**
 * ~7 s opening on one GSAP timeline (design: docs/design-guideline.yaml).
 *  0–2.3   keywords float up word by word; two stars cross the screen
 *  2.3–2.8 keywords fade out, stars leave, a short black pause
 *  2.8–3.6 a star rises from below to the centre and slows
 *  3.6–4.5 its outline morphs into the letter അ (real path morph)
 *  4.5–5.5 a coral arch card pops in behind it: 0 → 1.12 → 1
 *  5.5–6.5 three stars, the flowing text orbit, then Start
 *  6.5+    settled; the orbit keeps flowing
 * Tap anywhere to skip. Reduced motion shows the final frame.
 */
export const CONFIG = {
  keywords: ["Letters", "Sounds", "Words", "അക്ഷരം"],
  wordRise: 16, // px each keyword floats up
  wordDuration: 0.35,
  wordStagger: 0.18,
  crossDuration: 2.5, // the two stars crossing the screen
  keywordsOut: 2.3,
  keywordsFade: 0.25,
  pause: 0.2, // clean black frame before the centre star
  starRise: 0.8,
  starRiseFrom: 210, // scene units below the centre
  morph: 0.9,
  morphSettle: 1.4, // back.out strength when the letter lands
  cardDuration: 0.85,
  cardOvershoot: 1.12,
  finishStagger: 0.12,
  orbitSeconds: 28, // one lap of the text orbit
  orbitText: "അക്ഷരം • LEARN TO READ MALAYALAM •",
  orbitGap: 14, // space between one phrase and the next
  ease: "power4.out", // ≈ cubic-bezier(0.22, 1, 0.36, 1)
};

// Scene is 1000 × 620; the card and letter are centred on (CX, CY).
const CX = 500;
const CY = 330;
const WIDE = "0 0 1000 620";
const NARROW = "236 30 528 590"; // portrait phones: crop the side margins

/** Eight-point star with concave sides, centred on 0,0. */
function starPath(outer: number, inner: number, points = 8): string {
  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  };
  const step = 360 / points;
  let d = `M ${at(-90, outer)}`;
  for (let i = 0; i < points; i++)
    d += ` Q ${at(-90 + step * (i + 0.5), inner)} ${at(-90 + step * (i + 1), outer)}`;
  return `${d} Z`;
}
const STAR = starPath(36, 15);
const CENTRE_STAR = starPath(86, 36);
const CARD = "M -150 200 V -50 A 150 150 0 0 1 150 -50 V 200 Z";
const CARD_LINE = "M -136 186 V -50 A 136 136 0 0 1 136 -50 V 186 Z";
// Text orbit: a rounded rectangle around the card, behind it. Its width is
// tuned at runtime so the text loops seamlessly.
const TRACK_BOX = { cx: 500, top: 64, h: 532, w: 420, r: 150 };
function trackPath(w: number): string {
  const { cx, top, h, r } = TRACK_BOX;
  const l = cx - w / 2,
    rt = cx + w / 2,
    b = top + h;
  return `M ${l + r} ${top} H ${rt - r} A ${r} ${r} 0 0 1 ${rt} ${top + r} V ${b - r} A ${r} ${r} 0 0 1 ${rt - r} ${b} H ${l + r} A ${r} ${r} 0 0 1 ${l} ${b - r} V ${top + r} A ${r} ${r} 0 0 1 ${l + r} ${top} Z`;
}
const trackLength = (w: number) => {
  const { h, r } = TRACK_BOX;
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
};
const trackWidthFor = (length: number) => {
  const { h, r } = TRACK_BOX;
  return (length - 2 * (h - 2 * r) - 2 * Math.PI * r) / 2 + 2 * r;
};
const TRACK = trackPath(TRACK_BOX.w);
const AROUND: [number, number, number][] = [
  [205, 150, 1.25],
  [800, 118, 1.6],
  [815, 470, 1],
];

function Star({ className, cross }: { className: string; cross: string }) {
  return (
    <svg
      className={className}
      data-cross={cross}
      viewBox="-40 -40 80 80"
      aria-hidden="true"
    >
      <path d={STAR} />
    </svg>
  );
}

export function Intro({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const c = CONFIG;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: c.ease } });

      // 1. Keywords float up left to right; the line was laid out in advance.
      tl.fromTo(
        q("[data-word]"),
        { y: c.wordRise, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: c.wordDuration,
          stagger: c.wordStagger,
          ease: "power2.out",
        },
        0,
      );
      // Two stars cross in opposite directions with a little spin, clipped at the edges.
      tl.fromTo(
        q("[data-cross='a']"),
        { x: () => -0.2 * innerWidth, rotation: -30 },
        {
          x: () => 1.1 * innerWidth,
          rotation: 160,
          duration: c.crossDuration,
          ease: "power1.inOut",
        },
        0,
      );
      tl.fromTo(
        q("[data-cross='b']"),
        { x: () => 1.1 * innerWidth, rotation: 20 },
        {
          x: () => -0.2 * innerWidth,
          rotation: -170,
          duration: c.crossDuration,
          ease: "power1.inOut",
        },
        0.06,
      );

      // 2. Keywords leave fast; then a clean black beat.
      tl.to(
        q("[data-words]"),
        { opacity: 0, duration: c.keywordsFade, ease: "power1.in" },
        c.keywordsOut,
      );
      const riseAt = c.keywordsOut + c.keywordsFade + c.pause;

      // 3. The centre star rises from below and slows near the centre.
      tl.fromTo(
        q("[data-morph]"),
        { y: c.starRiseFrom, opacity: 0, rotation: -45, svgOrigin: "0 0" },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: c.starRise,
          ease: "power3.out",
        },
        riseAt,
      );

      // 4. Its outline morphs into അ; the counters open as it lands.
      const morphAt = riseAt + c.starRise;
      tl.to(
        q("[data-morph]"),
        {
          morphSVG: { shape: LETTER_A, shapeIndex: "auto" },
          duration: c.morph,
          ease: `back.out(${c.morphSettle})`,
        },
        morphAt,
      );

      // 5. The card pops in behind the letter: 0 → overshoot → 1, from its centre.
      const cardAt = morphAt + c.morph - 0.1;
      tl.fromTo(
        q("[data-card]"),
        { scale: 0, svgOrigin: "0 0" },
        {
          keyframes: [
            {
              scale: c.cardOvershoot,
              duration: c.cardDuration * 0.6,
              ease: "power3.out",
            },
            { scale: 1, duration: c.cardDuration * 0.4, ease: "power2.inOut" },
          ],
        },
        cardAt,
      );

      // 6. Three stars, the orbit text, then Start — each slightly staggered.
      const finishAt = cardAt + c.cardDuration + 0.1;
      tl.fromTo(
        q("[data-around]"),
        { scale: 0, opacity: 0, svgOrigin: "0 0" },
        {
          scale: 1,
          opacity: 1,
          duration: 0.45,
          ease: "back.out(2)",
          stagger: c.finishStagger,
        },
        finishAt,
      );
      tl.fromTo(
        q("[data-orbit]"),
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        finishAt + c.finishStagger * 3,
      );
      tl.fromTo(
        q("[data-start]"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)" },
        finishAt + c.finishStagger * 4,
      );

      // 7. The orbit flows forever: copies one phrase apart, shifted by exactly
      // one phrase per loop, so the seam never shows.
      const track = el.querySelector<SVGPathElement>("[data-track]");
      const copies = Array.from(
        el.querySelectorAll<SVGTextPathElement>("[data-orbit-copy]"),
      );
      const flow = () => {
        if (!track?.getTotalLength) return;
        // Keep natural spacing (never letter-space Malayalam). Instead resize
        // the track by a few units so a whole number of phrases fills one lap
        // exactly — the seam never shows.
        const onTrack = copies[1]?.parentElement as SVGTextElement | null;
        if (!onTrack?.getComputedTextLength) return;
        const phrase =
          Math.max(1, onTrack.getComputedTextLength()) + c.orbitGap;
        const fits = Math.max(1, Math.round(trackLength(TRACK_BOX.w) / phrase));
        const w = trackWidthFor(fits * phrase);
        track.setAttribute("d", trackPath(w));
        const state = { o: 0 };
        const place = () =>
          copies.forEach((cp, i) =>
            cp.setAttribute("startOffset", `${state.o + (i - 1) * phrase}`),
          );
        place();
        gsap.to(state, {
          o: phrase,
          duration: c.orbitSeconds / fits,
          ease: "none",
          repeat: -1,
          onUpdate: place,
        });
      };
      // Measure after the display font has loaded, or the spacing is wrong.
      void (document.fonts?.ready ?? Promise.resolve()).then(() =>
        ctx.add(flow),
      );

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
        tl.progress(1);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className={`${styles.stage} ${leaving ? styles.leaving : ""}`}
      onClick={finish}
      role="dialog"
      aria-label="Welcome to Aksharam"
    >
      <div className={styles.words} data-words aria-hidden="true">
        {CONFIG.keywords.map((w) => (
          <span key={w} data-word lang={/[ഀ-ൿ]/.test(w) ? "ml" : "en"}>
            {w}
          </span>
        ))}
      </div>
      <Star className={`${styles.cross} ${styles.crossA}`} cross="a" />
      <Star className={`${styles.cross} ${styles.crossB}`} cross="b" />

      <svg
        className={styles.art}
        viewBox={viewBox}
        aria-hidden="true"
        focusable="false"
      >
        <path id="intro-track" data-track d={TRACK} fill="none" />
        <g data-orbit className={styles.orbit} opacity={0}>
          {Array.from({ length: 8 }, (_, i) => (
            <text key={i}>
              <textPath href="#intro-track" data-orbit-copy lang="ml">
                {CONFIG.orbitText}
              </textPath>
            </text>
          ))}
        </g>
        {AROUND.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g transform={`scale(${s})`}>
              <path data-around className={styles.cream} d={STAR} opacity={0} />
            </g>
          </g>
        ))}
        <g transform={`translate(${CX} ${CY})`}>
          <g data-card transform="scale(0)">
            <path className={styles.card} d={CARD} />
            <path className={styles.cardLine} d={CARD_LINE} />
          </g>
          <g transform="translate(0 12)">
            <path
              data-morph
              className={styles.cream}
              d={CENTRE_STAR}
              opacity={0}
            />
          </g>
        </g>
      </svg>

      <button
        data-start
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
