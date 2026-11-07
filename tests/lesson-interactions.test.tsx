import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonRunner } from "@/components/lesson-runner";
import { ProgressProvider } from "@/hooks/use-progress";
import Home from "@/app/page";
import { letters } from "@/data/alphabet";
import { units } from "@/data/curriculum";
import { syllablesFrom } from "@/lib/syllables";
import { emptyProgress, STORAGE_KEY } from "@/lib/progress";
import type { Progress } from "@/types";

const nav = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => "/",
}));

const everything = [...letters, ...syllablesFrom(letters)];
const stored = (): Progress => JSON.parse(localStorage.getItem(STORAGE_KEY)!);
const optionButtons = () =>
  screen
    .getAllByRole("button")
    .filter((b) => b.classList.contains("answer-option"));
/** Clicks the right answer by reading the prompt the learner sees. */
async function answerCorrectly() {
  const glyph = document.querySelector(".question-glyph")?.textContent;
  const roman = document.querySelector(".question-roman")?.textContent;
  const targets = everything.filter((l) =>
    glyph ? (l.display ?? l.glyph) === glyph : l.romanization === roman,
  );
  const right = optionButtons().find((b) =>
    targets.some((t) =>
      b.textContent?.endsWith(glyph ? t.romanization : (t.display ?? t.glyph)),
    ),
  )!;
  await userEvent.click(right);
}
/** Plays the whole lesson: acknowledges teach cards, answers every question. */
async function playLesson(correct: boolean) {
  for (let i = 0; i < 80; i++) {
    if (
      screen.queryByRole("heading", {
        name: /complete|Tested out|learn this one/,
      })
    )
      return;
    const gotIt = screen.queryByRole("button", { name: /Got it/ });
    if (gotIt) {
      await userEvent.click(gotIt);
      continue;
    }
    if (correct) await answerCorrectly();
    else await userEvent.click(optionButtons()[0]);
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
  }
  throw new Error("Lesson did not finish");
}
function view(p: Progress | string = emptyProgress(), ui = <LessonRunner />) {
  localStorage.setItem(
    STORAGE_KEY,
    typeof p === "string" ? p : JSON.stringify(p),
  );
  return render(<ProgressProvider>{ui}</ProgressProvider>);
}
beforeEach(() => {
  nav.search = "";
  localStorage.clear();
});

describe("Learn lessons", () => {
  it("introduces a letter only after its teaching card is acknowledged", async () => {
    view();
    await screen.findByRole("button", { name: /Got it/ });
    expect(stored().introduced).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: /Got it/ }));
    await waitFor(() =>
      expect(stored().introduced).toEqual([units[0].items[0].id]),
    );
  });
  it("brings a missed question back once at the end", async () => {
    view();
    await userEvent.click(
      await screen.findByRole("button", { name: /Got it/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Got it/ }));
    const total = Number(
      screen.getByText(/Step \d+ of \d+/).textContent!.match(/of (\d+)/)![1],
    );
    const wrong = optionButtons().find(
      (b) => !b.textContent?.endsWith(units[0].items[0].romanization),
    )!;
    await userEvent.click(wrong);
    expect(screen.getByRole("status")).toHaveTextContent("Not quite");
    expect(screen.getByText(new RegExp(`of ${total + 1}`))).toBeInTheDocument();
  });
  it("finishes unit 1 with what you can read, XP, a lesson log and milestones", async () => {
    view();
    await screen.findByRole("button", { name: /Got it/ });
    await playLesson(true);
    expect(
      screen.getByRole("heading", { name: "Lesson complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("You can now read:")).toBeInTheDocument();
    expect(await screen.findByText("First lesson")).toBeInTheDocument();
    await waitFor(() => {
      const p = stored();
      expect(p.lessons).toHaveLength(1);
      expect(p.lessons![0]).toMatchObject({ kind: "unit", unit: "unit-1" });
      expect(p.introduced).toEqual(units[0].items.map((l) => l.id));
      expect(Object.values(p.xp!)[0]).toBeGreaterThan(10);
      expect(p.milestones).toEqual(
        expect.arrayContaining(["first-lesson", "first-syllables"]),
      );
      // Each letter is scheduled once, not once per question.
      units[0].items.forEach((l) =>
        expect(p.cards[l.id].history).toHaveLength(1),
      );
    });
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(
      await screen.findByRole("heading", { name: units[1].title }),
    ).toBeInTheDocument();
  });
  it("test-out marks a unit learned only on a pass", async () => {
    nav.search = "mode=placement&unit=unit-1";
    view();
    await screen.findAllByRole("button");
    await playLesson(true);
    expect(
      screen.getByRole("heading", { name: "Tested out!" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(stored().introduced).toEqual(
        expect.arrayContaining(units[0].items.map((l) => l.id)),
      ),
    );
  });
  it("never overwrites unreadable saved data", async () => {
    const raw = '{"version":99,"saved":"untouched"}';
    view(raw);
    await userEvent.click(
      await screen.findByRole("button", { name: /Got it/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Got it/ }));
    await answerCorrectly();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
});

describe("Home", () => {
  it("welcomes a new learner and saves their choices", async () => {
    view(emptyProgress(), <Home />);
    await userEvent.click(
      await screen.findByRole(
        "button",
        { name: /connect with family/ },
        { timeout: 2000 },
      ),
    );
    await userEvent.click(screen.getByRole("button", { name: /Serious/ }));
    await userEvent.click(
      screen.getByRole("link", { name: /Start from scratch/ }),
    );
    await waitFor(() =>
      expect(stored()).toMatchObject({
        reason: "family",
        onboarded: true,
        preferences: { dailyGoal: 30 },
      }),
    );
  });
  it("shows Continue and the path for a returning learner", async () => {
    const p = emptyProgress();
    p.introduced = units[0].items.map((l) => l.id);
    view(p, <Home />);
    expect(
      await screen.findByRole("link", { name: /Continue/ }),
    ).toHaveAttribute("href", "/learn");
    expect(
      screen.getByText(`Unit 2: ${units[1].title}`, { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Test out/ })).toBeInTheDocument();
  });
});
