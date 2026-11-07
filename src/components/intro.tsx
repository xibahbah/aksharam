"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { CREAM, COLORS, star } from "./intro-art";
import { createIntroTimeline, INTRO_DURATION } from "./intro-motion";
import styles from "./intro.module.css";

const WAVE_SLOGANS = [
  "LET LETTERS BLOOM",
  "EVERY LETTER, A LITTLE WONDER",
  "FOLLOW THE LETTERS",
  "SMALL LETTERS, NEW WORLDS",
  "FIND YOUR FIRST WORD",
  "A LITTLE CURIOSITY GOES A LONG WAY",
].join(" • ") + " •";

export function Intro({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaving, setLeaving] = useState(false);
  const titleId = useId();
  const orbitId = useId();

  const finish = useCallback(() => {
    if (exitTimer.current !== null) return;
    setLeaving(true);
    // Carry the flower into the app identity instead of cutting to a new page.
    const flower = root.current?.querySelector<SVGGElement>("[data-flower-position]");
    const destination = document.querySelector<HTMLElement>(".sidebar .brand-icon");
    if (flower && destination && window.innerWidth >= 900 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const source = flower.getBoundingClientRect(), target = destination.getBoundingClientRect();
      const box = flower.getBBox();
      if (source.width && target.width) {
        const flight = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        flight.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`);
        flight.setAttribute("aria-hidden", "true");
        flower.querySelectorAll("path").forEach(path => flight.appendChild(path.cloneNode(true)));
        Object.assign(flight.style, { position: "fixed", pointerEvents: "none", zIndex: "200", left: `${source.left}px`, top: `${source.top}px`, width: `${source.width}px`, height: `${source.height}px` });
        document.body.appendChild(flight);
        gsap.to(flight, { left: target.left, top: target.top, width: target.width, height: target.height, duration: .48, ease: "power3.inOut", onComplete: () => flight.remove() });
      }
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    exitTimer.current = setTimeout(onDone, reduce ? 0 : 500);
  }, [onDone]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The landing overlays the app shell; keep its hidden navigation out of Tab order.
    const siblings: { node: HTMLElement; inert: boolean }[] = [];
    let ancestor: HTMLElement = el;
    while (ancestor.parentElement) {
      for (const node of ancestor.parentElement.children) {
        if (node !== ancestor && node instanceof HTMLElement) {
          siblings.push({ node, inert: node.hasAttribute("inert") });
          node.setAttribute("inert", "");
        }
      }
      ancestor = ancestor.parentElement;
      if (ancestor === document.body) break;
    }
    el.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key !== "Tab") return;
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    el.addEventListener("keydown", key);
    return () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
      document.body.style.overflow = oldOverflow;
      siblings.forEach(({ node, inert }) => { if (inert) node.setAttribute("inert", ""); else node.removeAttribute("inert"); });
      el.removeEventListener("keydown", key);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [finish]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add({ reduce: "(prefers-reduced-motion: reduce)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const tl = createIntroTimeline(el);
      timeline.current = tl;
      if (context.conditions?.reduce) tl.progress(1).pause();
      let active = true;
      if (!context.conditions?.reduce) void (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!active) return;
        context.add(() => {
          el.querySelectorAll<SVGGElement>("[data-wave]").forEach((wave, index) => {
            const text = wave.querySelector<SVGTextElement>("text");
            const copies = wave.querySelectorAll<SVGTextPathElement>("[data-orbit-copy]");
            if (!text?.getComputedTextLength) return;
            const spacing = text.getComputedTextLength() + 48;
            const state = { offset: 0 };
            const place = () => copies.forEach((copy, i) => copy.setAttribute("startOffset", String(state.offset + (i - 1) * spacing)));
            place();
            gsap.to(state, { offset: spacing, duration: spacing / (index ? 54 : 72), ease: "none", repeat: -1, onUpdate: place });
          });
        });
      });
      return () => { active = false; timeline.current = null; };
    });
    return () => media.revert();
  }, []);

  return (
    <div ref={root} className={`${styles.stage} ${leaving ? styles.leaving : ""}`} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.header}>
        <span className={styles.brand}>aksharam<span lang="ml">അക്ഷരം</span></span>
        <div className={styles.actions}>
          <button className={styles.textButton} onClick={() => {
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
            timeline.current?.restart(false, false);
          }}>Replay ↻</button>
          <button className={styles.textButton} onClick={() => timeline.current?.progress(1).pause()}>Skip animation ↗</button>
        </div>
      </header>
      <div className={styles.words} data-words aria-hidden="true">
        {["Letters", "Sounds", "Words", "അക്ഷരം"].map(word => <span key={word} data-word lang={word === "അക്ഷരം" ? "ml" : "en"}>{word}</span>)}
      </div>
      {["a", "b"].map((cross, i) => <svg key={cross} data-cross={cross} className={`${styles.cross} ${i ? styles.crossB : styles.crossA}`} viewBox="-40 -40 80 80" aria-hidden="true"><path d={star(36)} /></svg>)}
      <div className={styles.scene} data-scene>
        <svg className={styles.art} viewBox="0 0 1200 1040" aria-hidden="true" focusable="false">
          <defs>
            <path id={`${orbitId}-learn`} d="M -600 828.00 C -580 829.86 -560 833.02 -540 836.60 C -520 840.18 -500 844.14 -480 847.38 C -460 850.62 -440 853.10 -420 854.15 C -400 855.20 -380 854.81 -360 853.13 C -340 851.45 -320 848.50 -300 845.19 C -280 841.88 -260 838.23 -240 835.38 C -220 832.52 -200 830.50 -180 829.99 C -160 829.48 -140 830.49 -120 832.90 C -100 835.32 -80 839.10 -60 843.38 C -40 847.66 -20 852.39 0 856.48 C 20 860.56 40 863.96 60 865.98 C 80 868.01 100 868.65 120 868.04 C 140 867.43 160 865.59 180 863.38 C 200 861.16 220 858.62 240 856.82 C 260 855.02 280 853.99 300 854.38 C 320 854.78 340 856.59 360 859.64 C 380 862.70 400 866.96 420 871.51 C 440 876.07 460 880.86 480 884.76 C 500 888.66 520 891.62 540 892.95 C 560 894.28 580 893.96 600 892.12 C 620 890.29 640 886.97 660 883.05 C 680 879.13 700 874.66 720 870.76 C 740 866.86 760 863.58 780 861.61 C 800 859.65 820 859.03 840 859.64 C 860 860.26 880 862.08 900 864.28 C 920 866.48 940 869.02 960 870.82 C 980 872.62 1000 873.65 1020 873.28 C 1040 872.90 1060 871.09 1080 868.04 C 1100 864.98 1120 860.70 1140 856.08 C 1160 851.47 1180 846.56 1200 842.48 C 1220 838.39 1240 835.17 1260 833.48 C 1280 831.79 1300 831.65 1320 832.90 C 1340 834.16 1360 836.78 1380 839.89 C 1400 842.99 1420 846.52 1440 849.38 C 1460 852.23 1480 854.37 1500 855.09 C 1520 855.81 1540 855.11 1560 853.13 C 1580 851.14 1600 847.89 1620 844.25 C 1640 840.60 1660 836.62 1680 833.38 C 1700 830.14 1720 827.69 1740 826.70 C 1760 825.71 1780 826.19 1800 828.00" />
            <path id={`${orbitId}-poem`} d="M -600 908.00 C -580 909.86 -560 913.02 -540 916.60 C -520 920.18 -500 924.14 -480 927.38 C -460 930.62 -440 933.10 -420 934.15 C -400 935.20 -380 934.81 -360 933.13 C -340 931.45 -320 928.50 -300 925.19 C -280 921.88 -260 918.23 -240 915.38 C -220 912.52 -200 910.50 -180 909.99 C -160 909.48 -140 910.49 -120 912.90 C -100 915.32 -80 919.10 -60 923.38 C -40 927.66 -20 932.39 0 936.48 C 20 940.56 40 943.96 60 945.98 C 80 948.01 100 948.65 120 948.04 C 140 947.43 160 945.59 180 943.38 C 200 941.16 220 938.62 240 936.82 C 260 935.02 280 933.99 300 934.38 C 320 934.78 340 936.59 360 939.64 C 380 942.70 400 946.96 420 951.51 C 440 956.07 460 960.86 480 964.76 C 500 968.66 520 971.62 540 972.95 C 560 974.28 580 973.96 600 972.12 C 620 970.29 640 966.97 660 963.05 C 680 959.13 700 954.66 720 950.76 C 740 946.86 760 943.58 780 941.61 C 800 939.65 820 939.03 840 939.64 C 860 940.26 880 942.08 900 944.28 C 920 946.48 940 949.02 960 950.82 C 980 952.62 1000 953.65 1020 953.28 C 1040 952.90 1060 951.09 1080 948.04 C 1100 944.98 1120 940.70 1140 936.08 C 1160 931.47 1180 926.56 1200 922.48 C 1220 918.39 1240 915.17 1260 913.48 C 1280 911.79 1300 911.65 1320 912.90 C 1340 914.16 1360 916.78 1380 919.89 C 1400 922.99 1420 926.52 1440 929.38 C 1460 932.23 1480 934.37 1500 935.09 C 1520 935.81 1540 935.11 1560 933.13 C 1580 931.14 1600 927.89 1620 924.25 C 1640 920.60 1660 916.62 1680 913.38 C 1700 910.14 1720 907.69 1740 906.70 C 1760 905.71 1780 906.19 1800 908.00" />
          </defs>
          <g data-orbit className={styles.orbit} opacity="0">
            <g data-wave>{Array.from({ length: 3 }, (_, i) => <text key={i}><textPath href={`#${orbitId}-learn`} data-orbit-copy startOffset={(i - 1) * 4200} lang="en">{WAVE_SLOGANS}</textPath></text>)}</g>
            <g data-wave className={styles.poem}>
              <title>കുമാരനാശാൻ — വീണ പൂവ് (1907)</title>
              {Array.from({ length: 5 }, (_, i) => <text key={i}><textPath href={`#${orbitId}-poem`} data-orbit-copy startOffset={(i - 1) * 1400} lang="ml">ഹാ! പുഷ്പമേ, അധികതുംഗപദത്തിലെത്ര ശോഭിച്ചിരുന്നിതൊരു രാജ്ഞികണക്കയേ നീ •</textPath></text>)}
            </g>
          </g>
          <g transform="translate(600 774) scale(1.18) translate(-600 -774)">
          <g fill={CREAM}>
            {[0, 1, 2].map(i => <path key={i} data-body d={star(86, 600, 410)} />)}
          </g>
          <g transform="translate(600 410)">
            <g data-flower-position>
              {COLORS.map((color) => <path key={color} data-petal fill={color} d={star(.01)} />)}
            </g>
          </g>
          </g>
        </svg>
      </div>
      <div className={styles.caption}>
        <div data-caption><h1 id={titleId}><span>A script to </span><span>fall in </span><span>love with.</span></h1><p className={styles.description}>Discover the beauty<br />in every curve.</p></div>
      </div>
        <button ref={start} data-caption className={styles.start} onClick={finish}>Start <span aria-hidden="true">↗</span></button>
      {process.env.NODE_ENV === "development" && <label className={styles.scrubber}>
        Motion study
        <input aria-label="Animation progress" type="range" min="0" max={INTRO_DURATION} step="0.01" defaultValue="0" onChange={(event) => timeline.current?.pause().time(Number(event.target.value))} />
      </label>}
    </div>
  );
}
