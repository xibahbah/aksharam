import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
// jsdom does not implement scrolling; lessons scroll to the top on restart.
window.scrollTo = () => undefined;
