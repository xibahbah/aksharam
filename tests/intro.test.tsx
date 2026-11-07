import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Intro } from "@/components/intro";
import { LEFT_FIGURE, RIGHT_FIGURE, BOAT, star } from "@/components/intro-art";

afterEach(() => vi.restoreAllMocks());

describe("landing accessibility", () => {
  it("shows a still final scene for reduced motion and permits immediate entry", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({
      ...original(query), matches: query === "(prefers-reduced-motion: reduce)",
    }));
    const onDone = vi.fn();
    const { container } = render(<Intro onDone={onDone} />);
    expect(container.querySelector("[data-caption]")).toHaveStyle({ opacity: "1" });
    expect(screen.getByRole("button", { name: "Start" })).toHaveStyle({ opacity: "1" });
    const bodies = container.querySelectorAll("[data-body]");
    [LEFT_FIGURE, RIGHT_FIGURE, BOAT].forEach((path, i) => {
      expect(bodies[i]).toHaveAttribute("d", path);
    });
    expect(container.querySelector("[data-words]")).toHaveStyle({ opacity: "0" });
    expect(container.querySelector("[data-scene]")).toHaveStyle({ opacity: "1" });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("starts as a star and skipping reveals the approved figure paths", () => {
    const { container } = render(<Intro onDone={() => undefined} />);
    const bodies = container.querySelectorAll("[data-body]");
    expect(bodies[0]).toHaveAttribute("d", star(86, 600, 410));
    expect(screen.getByRole("button", { name: "Start" })).toHaveStyle({ opacity: "0" });
    expect(screen.getByText("Letters")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-cross]")).toHaveLength(2);
    expect(container.querySelector("[data-scene]")).toHaveStyle({ opacity: "0" });
    fireEvent.click(screen.getByRole("button", { name: /Skip animation/ }));
    [LEFT_FIGURE, RIGHT_FIGURE, BOAT].forEach((path, i) => {
      expect(bodies[i]).toHaveAttribute("d", path);
    });
    expect(screen.getByRole("button", { name: "Start" })).toHaveStyle({ opacity: "1" });
    fireEvent.click(screen.getByRole("button", { name: /Replay/ }));
    expect(bodies[0]).not.toHaveAttribute("d", LEFT_FIGURE);
    expect(container.querySelector("[data-words]")).toHaveStyle({ opacity: "1" });
    expect(container.querySelector("[data-scene]")).toHaveStyle({ opacity: "0" });
  });

  it("isolates the background, wraps keyboard focus and restores it on unmount", () => {
    const background = document.createElement("button");
    document.body.append(background);
    background.focus();
    const { unmount } = render(<Intro onDone={() => undefined} />);
    expect(background).toHaveAttribute("inert");
    const start = screen.getByRole("button", { name: "Start" });
    const skip = screen.getByRole("button", { name: /Replay/ });
    start.focus();
    fireEvent.keyDown(start, { key: "Tab" });
    expect(skip).toHaveFocus();
    fireEvent.keyDown(skip, { key: "Tab", shiftKey: true });
    expect(start).toHaveFocus();
    unmount();
    expect(background).not.toHaveAttribute("inert");
    expect(background).toHaveFocus();
    background.remove();
  });
});
