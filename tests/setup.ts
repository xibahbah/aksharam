import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
// jsdom does not implement scrolling; lessons scroll to the top on restart.
window.scrollTo = () => undefined;

// GSAP observes the system motion preference; jsdom has no media-query API.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: query.includes("no-preference"),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  }),
});
