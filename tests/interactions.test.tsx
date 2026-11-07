import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "@/components/card";
import { QuizQuestion } from "@/components/quiz-question";
import { Practice } from "@/components/practice";
import { Flashcards } from "@/components/flashcards";
import { ProgressProvider } from "@/hooks/use-progress";
import { letters } from "@/data/alphabet";
import { makeQuestion } from "@/lib/quiz";
import { emptyProgress, reviewCard, STORAGE_KEY } from "@/lib/progress";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("deck=review"),
}));
describe("learning interactions", () => {
  it("flips the card with the native button and exposes its back state", async () => {
    const flip = vi.fn();
    const letter = letters[0];
    const { rerender } = render(
      <Card letter={letter} flipped={false} onFlip={flip} />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(flip).toHaveBeenCalledOnce();
    rerender(<Card letter={letter} flipped onFlip={flip} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button")).toHaveClass("flipped");
  });
  it("checks a choice, explains the answer, blocks repeated submission and continues", async () => {
    const answer = vi.fn();
    const next = vi.fn();
    const q = makeQuestion(letters[0], "recognition", () => 0.5);
    render(
      <QuizQuestion
        question={q}
        onAnswer={answer}
        onNext={next}
        number={1}
        total={5}
      />,
    );
    const option = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.endsWith(q.letter.romanization))!;
    expect(
      screen.queryByRole("button", { name: /Continue/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(option);
    expect(answer).toHaveBeenCalledWith(q.letter.id, true);
    expect(screen.getByRole("status")).toHaveTextContent("Correct");
    expect(option).toBeDisabled();
    expect(screen.getByRole("button", { name: /Continue/ })).toHaveFocus();
    expect(
      screen.getByRole("button", { name: /Continue/ }),
    ).toHaveAccessibleDescription(expect.stringContaining(q.letter.note));
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(next).toHaveBeenCalledOnce();
  });
  it("answers a choice question with the number keys", async () => {
    const answer = vi.fn();
    const q = makeQuestion(letters[0], "recognition", () => 0.5);
    render(
      <QuizQuestion
        question={q}
        onAnswer={answer}
        onNext={vi.fn()}
        number={1}
        total={1}
      />,
    );
    fireEvent.keyDown(window, { key: "2" });
    expect(answer).toHaveBeenCalledWith(
      q.options[1].id,
      q.options[1].id === q.letter.id,
    );
    fireEvent.keyDown(window, { key: "1" });
    expect(answer).toHaveBeenCalledOnce();
  });
  it("keeps incorrect typed-answer feedback available and supports keyboard continuation", async () => {
    const answer = vi.fn();
    const next = vi.fn();
    const q = makeQuestion(letters[0], "typing", () => 0.5);
    render(
      <QuizQuestion
        question={q}
        onAnswer={answer}
        onNext={next}
        number={1}
        total={2}
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Your romanization"),
      "wrong{Enter}",
    );
    expect(answer).toHaveBeenCalledWith("wrong", false);
    expect(screen.getByRole("status")).toHaveTextContent("Not quite");
    expect(screen.getByRole("status")).toHaveTextContent(q.letter.romanization);
    expect(screen.getByRole("button", { name: /Continue/ })).toHaveFocus();
    expect(screen.getByLabelText("Your romanization")).toBeDisabled();
    await userEvent.keyboard("{Enter}");
    expect(next).toHaveBeenCalledOnce();
  });
  it("hydrates a due review before freezing the deck, flips using space and persists ratings", async () => {
    const p = reviewCard(emptyProgress(), letters[0].id, "again", 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    render(
      <ProgressProvider>
        <Flashcards />
      </ProgressProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Front of flashcard/ }),
      ).toBeInTheDocument(),
    );
    fireEvent.keyDown(window, { code: "Space" });
    expect(
      screen.getByRole("button", { name: /Back of flashcard/ }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(window, { key: "3" });
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY)!).cards[letters[0].id]
          .history,
      ).toHaveLength(2),
    );
    // The only card was rated, so the deck ends with a summary.
    expect(
      screen.getByRole("heading", { name: "Deck complete" }),
    ).toBeInTheDocument();
  });
  it("does not rate a flashcard before it is flipped", async () => {
    const p = reviewCard(emptyProgress(), letters[0].id, "again", 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    render(
      <ProgressProvider>
        <Flashcards />
      </ProgressProvider>,
    );
    await screen.findByRole("button", { name: /Front of flashcard/ });
    expect(screen.queryByRole("button", { name: /Good/ })).toBeNull();
    fireEvent.keyDown(window, { key: "3" });
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).cards[letters[0].id]
        .history,
    ).toHaveLength(1);
  });
  it("only offers flashcards for letters that have been taught", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyProgress()));
    render(
      <ProgressProvider>
        <Flashcards />
      </ProgressProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Learn some letters first" }),
    ).toBeInTheDocument();
  });
  it("completes a test and offers a retry for only missed letters", async () => {
    const p = emptyProgress();
    p.introduced = letters.slice(0, 6).map((l) => l.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    render(
      <ProgressProvider>
        <Practice />
      </ProgressProvider>,
    );
    await userEvent.selectOptions(
      await screen.findByLabelText("Number of questions"),
      "5",
    );
    await userEvent.click(screen.getByRole("button", { name: "Start test" }));
    for (let i = 0; i < 5; i++) {
      const options = screen
        .getAllByRole("button")
        .filter((b) => b.classList.contains("answer-option"));
      await userEvent.click(options[0]);
      await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    }
    expect(
      screen.getByRole("heading", { name: "Test results" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your answers" }),
    ).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).attempts,
    ).toHaveLength(5);
  });
});
