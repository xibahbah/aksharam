import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "@/components/card";
import { Shell } from "@/components/shell";
import { letters } from "@/data/alphabet";

vi.mock("next/navigation", () => ({ usePathname: () => "/settings" }));

function swipe(
  element: HTMLElement,
  from: [number, number],
  to: [number, number],
) {
  fireEvent.touchStart(element, {
    touches: [{ clientX: from[0], clientY: from[1] }],
  });
  fireEvent.touchEnd(element, {
    touches: [],
    changedTouches: [{ clientX: to[0], clientY: to[1] }],
  });
}

describe("mobile study controls", () => {
  it("navigates in both swipe directions without flipping on the generated click", () => {
    const onFlip = vi.fn();
    const onNavigate = vi.fn();
    render(
      <Card
        letter={letters[0]}
        flipped={false}
        onFlip={onFlip}
        onNavigate={onNavigate}
      />,
    );
    const card = screen.getByRole("button");
    swipe(card, [250, 120], [100, 130]);
    fireEvent.click(card);
    expect(onNavigate).toHaveBeenLastCalledWith(1);
    expect(onFlip).not.toHaveBeenCalled();
    swipe(card, [80, 120], [220, 130]);
    expect(onNavigate).toHaveBeenLastCalledWith(-1);
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it("keeps vertical, diagonal and short gestures available for scrolling or taps", () => {
    const onNavigate = vi.fn();
    const onFlip = vi.fn();
    render(
      <Card
        letter={letters[0]}
        flipped={false}
        onFlip={onFlip}
        onNavigate={onNavigate}
      />,
    );
    const card = screen.getByRole("button");
    swipe(card, [150, 100], [160, 260]);
    swipe(card, [250, 100], [150, 210]);
    swipe(card, [150, 100], [130, 102]);
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(card);
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("ignores multitouch and cancelled gestures and retains keyboard flip", async () => {
    const onNavigate = vi.fn();
    const onFlip = vi.fn();
    render(
      <Card
        letter={letters[0]}
        flipped={false}
        onFlip={onFlip}
        onNavigate={onNavigate}
      />,
    );
    const card = screen.getByRole("button");
    fireEvent.touchStart(card, {
      touches: [
        { clientX: 200, clientY: 100 },
        { clientX: 220, clientY: 100 },
      ],
    });
    fireEvent.touchEnd(card, {
      touches: [],
      changedTouches: [{ clientX: 20, clientY: 100 }],
    });
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchCancel(card);
    fireEvent.touchEnd(card, {
      touches: [],
      changedTouches: [{ clientX: 20, clientY: 100 }],
    });
    expect(onNavigate).not.toHaveBeenCalled();
    card.focus();
    await userEvent.keyboard(" ");
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("exposes only the visible flashcard face to assistive technology", () => {
    const { container, rerender } = render(
      <Card letter={letters[0]} flipped={false} onFlip={() => {}} />,
    );
    expect(container.querySelector(".card-front")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    expect(container.querySelector(".card-back")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    rerender(<Card letter={letters[0]} flipped onFlip={() => {}} />);
    expect(container.querySelector(".card-front")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".card-back")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  });
});

describe("essential mobile navigation", () => {
  it("provides four labeled destinations and marks Me as current", () => {
    render(
      <Shell>
        <h1>Settings</h1>
      </Shell>,
    );
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(4);
    const destinations = ["/", "/practice", "/reference", "/settings"];
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", destinations[index]);
      expect(link).toHaveAccessibleName();
    });
    expect(within(nav).getByRole("link", { name: "Me" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
  });
});
