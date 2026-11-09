import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { BOAT, LEFT_FIGURE, RIGHT_FIGURE, FINAL_FLOWER, star, roundedSeed, openingSeed, coloredSeed } from "./intro-art";

import { GROWTH_FRAMES } from "./intro-growth-frames";

gsap.registerPlugin(MorphSVGPlugin);
export const PRELUDE_DURATION = 1.65;
// Shorten only the morph section by 30%; retain the opening words/stars.
const MORPH_SPEED = 1.15 / .7;
const GROWTH_START = 1.15;
const GROWTH_END = 4.05;
export const INTRO_DURATION = PRELUDE_DURATION + 4.8 / MORPH_SPEED;

export function createIntroTimeline(el: HTMLElement, roundedOpening = false) {
  const q = gsap.utils.selector(el);
  const bodies = q("[data-body]");
  const petals = q("[data-petal]");
  const master = gsap.timeline();
  master.fromTo(q("[data-word]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .28, stagger: .13, ease: "power2.out" }, 0);
  master.fromTo(q("[data-words]"), { opacity: 1 }, { opacity: 0, duration: .2 }, 1.32);
  ["a", "b"].forEach((name, i) => {
    master.fromTo(q(`[data-cross='${name}']`),
      { x: () => (i ? 1.12 : -.2) * window.innerWidth, rotation: i ? 20 : -30, opacity: 1 },
      { x: () => (i ? -.2 : 1.12) * window.innerWidth, rotation: i ? -170 : 160, duration: 1.52, ease: "power1.inOut" }, i * .04);
  });
  master.fromTo(q("[data-scene]"), { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: .38, ease: "power3.out" }, PRELUDE_DURATION);
  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
  tl.addLabel("seed", 0).addLabel("unfold", GROWTH_START).addLabel("settled", 4.2);
  // White geometry is a predesigned sequence of planar boundary contours.
  // No point matching, rotation, or interpolation across concave limbs.
  let lastFrame = "";
  const renderWhite = () => {
    const time = tl.time();
    const p = Math.max(0, Math.min(1, (time - GROWTH_START) / (GROWTH_END - GROWTH_START)));
    let paths: string[];
    let key: string;
    if (time < GROWTH_START) {
      // Keep outward momentum into the unfolding instead of braking at the star.
      const swell = gsap.parseEase("power1.in")(Math.max(0, Math.min(1, (time - .12) / (GROWTH_START - .12))));
      const radius = 86 + 194 * swell;
      const soften = gsap.parseEase("sine.inOut")(Math.max(0, Math.min(1, (time - .12) / .9)));
      paths = [roundedOpening ? roundedSeed(radius, 600, 410) : openingSeed(radius, soften, 600, 410), "", ""];
      key = `star-${radius.toFixed(3)}-${soften.toFixed(4)}`;
    } else if (p >= 1) {
      paths = [LEFT_FIGURE, RIGHT_FIGURE, BOAT];
      key = "final";
    } else {
      const frame = Math.round(p * (GROWTH_FRAMES.length - 1));
      paths = [GROWTH_FRAMES[frame], "", ""];
      key = `growth-${frame}`;
    }
    if (key === lastFrame) return;
    lastFrame = key;
    bodies.forEach((body, i) => {
      body.setAttribute("fill-rule", "evenodd");
      body.setAttribute("d", paths[i]);
    });
  };
  tl.eventCallback("onUpdate", renderWhite);
  renderWhite();
  [174, 115, 69].forEach((radius, i) => {
    tl.fromTo(petals[i], { attr: { d: star(.01) } }, {
      attr: { d: coloredSeed(radius) }, duration: .6, ease: "sine.in",
    }, .34 + i * .08);
  });
  // One uninterrupted interpolation: no intermediate target at which each
  // layer brakes to zero and then accelerates again.
  petals.slice(0, 3).forEach((petal, i) => {
    tl.to(petal, {
      morphSVG: { shape: FINAL_FLOWER[i], shapeIndex: "auto" },
      duration: 3.04, ease: "sine.inOut",
    }, .94 + i * .08);
  });
  tl.to(petals[3], {
    morphSVG: { shape: FINAL_FLOWER[3], shapeIndex: "auto" },
    duration: 1.15, ease: "power2.inOut",
  }, 3.02);
  tl.to(q("[data-flower-position]"), { x: -30, y: 0, duration: GROWTH_END - GROWTH_START, ease: "sine.inOut" }, GROWTH_START);
  tl.fromTo(q("[data-caption]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" }, 4.2);
  tl.fromTo(q("[data-orbit]"), { opacity: 0 }, { opacity: 1, duration: .5 }, 4.1);
  master.add(tl, PRELUDE_DURATION);
  tl.timeScale(MORPH_SPEED);
  // The child update callback owns silhouette growth, including seek/replay.
  master.eventCallback("onUpdate", renderWhite);
  return master;
}
