import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { BOAT, LEFT_FIGURE, RIGHT_FIGURE, FINAL_FLOWER, star, flower } from "./intro-art";

import { GROWTH_FRAMES } from "./intro-growth-frames";

gsap.registerPlugin(MorphSVGPlugin);
export const INTRO_DURATION = 4.8;

export function createIntroTimeline(el: HTMLElement) {
  const q = gsap.utils.selector(el);
  const bodies = q("[data-body]");
  const petals = q("[data-petal]");
  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });
  tl.addLabel("seed", 0).addLabel("nested", 1.5).addLabel("unfold", 1.9).addLabel("settled", 4.2);
  // White geometry is a predesigned sequence of planar boundary contours.
  // No point matching, rotation, or interpolation across concave limbs.
  let lastFrame = "";
  const renderWhite = () => {
    const time = tl.time();
    const p = Math.max(0, Math.min(1, (time - 1.9) / 2.15));
    let paths: string[];
    let key: string;
    if (time < 1.9) {
      const swell = gsap.parseEase("power3.inOut")(Math.max(0, Math.min(1, (time - .35) / 1.05)));
      const radius = 86 + 194 * swell;
      paths = [star(radius, 600, 410), "", ""];
      key = `star-${radius.toFixed(3)}`;
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
      attr: { d: star(radius) }, duration: .78, ease: "power3.out",
    }, .65 + i * .12);
  });
  // Keep the flower evolving through the entire figure reveal: pointed seed,
  // open rounded petals, asymmetric bloom, then a legible letter at its heart.
  petals.slice(0, 3).forEach((petal, i) => {
    tl.to(petal, {
      morphSVG: { shape: flower([1.65, 1.21, .77][i]), shapeIndex: "auto" },
      duration: .8, ease: "sine.inOut",
    }, 1.72 + i * .07);
    tl.to(petal, {
      morphSVG: { shape: FINAL_FLOWER[i], shapeIndex: "auto" },
      duration: 1.45, ease: "power2.inOut",
    }, 2.52 + i * .07);
  });
  tl.to(petals[3], {
    morphSVG: { shape: FINAL_FLOWER[3], shapeIndex: "auto" },
    duration: 1.15, ease: "power2.inOut",
  }, 3.02);
  tl.to(q("[data-flower-position]"), { x: -30, y: 0, duration: 2.15 }, 1.9);
  tl.fromTo(q("[data-caption]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" }, 4.2);
  return tl;
}
