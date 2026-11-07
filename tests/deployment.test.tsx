import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import config from "../next.config";
import { BASE_PATH, publicAssetPath } from "@/lib/paths";
import { AudioButton } from "@/components/audio-button";
import { ProgressProvider, useProgress } from "@/hooks/use-progress";
import { letters } from "@/data/alphabet";
import { STORAGE_KEY } from "@/lib/progress";

describe("GitHub project Pages", () => {
  it("exports directory routes under the shared base path without image optimization", () => {
    expect(config.output).toBe("export");
    expect(config.basePath).toBe(BASE_PATH);
    expect(config.trailingSlash).toBe(true);
    expect(config.images?.unoptimized).toBe(true);
  });

  it("prefixes public files once and preserves external recordings and URLs", () => {
    expect(publicAssetPath("/audio/a.mp3")).toBe("/aksharam/audio/a.mp3");
    expect(publicAssetPath("images/letter.svg")).toBe(
      "/aksharam/images/letter.svg",
    );
    expect(publicAssetPath("/aksharam/audio/a.mp3")).toBe(
      "/aksharam/audio/a.mp3",
    );
    expect(publicAssetPath("/audio/a.mp3?v=2#start")).toBe(
      "/aksharam/audio/a.mp3?v=2#start",
    );
    for (const value of [
      "https://example.com/a.mp3",
      "//example.com/a.mp3",
      "blob:example",
      "data:audio/wav;base64,abc",
      "#main",
    ]) {
      expect(publicAssetPath(value)).toBe(value);
    }
  });

  it("plays future recordings from the project path rather than the domain root", async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const audio = vi.fn(function () {
      return { play };
    });
    vi.stubGlobal("Audio", audio);
    try {
      render(
        <AudioButton letter={{ ...letters[0], audioUrl: "/audio/a.mp3" }} />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Play pronunciation" }),
      );
      expect(audio).toHaveBeenCalledWith("/aksharam/audio/a.mp3");
      expect(play).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("replays slowly when tapped again within five seconds", async () => {
    const made: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "Audio",
      vi.fn(function () {
        const a = {
          play: vi.fn().mockResolvedValue(undefined),
          pause: vi.fn(),
        };
        made.push(a);
        return a;
      }),
    );
    const now = vi.spyOn(Date, "now");
    try {
      render(
        <AudioButton letter={{ ...letters[0], audioUrl: "/audio/a.mp3" }} />,
      );
      const button = screen.getByRole("button", { name: "Play pronunciation" });
      now.mockReturnValue(1_000);
      await userEvent.click(button);
      now.mockReturnValue(4_000);
      await userEvent.click(button);
      expect(screen.getByRole("button")).toHaveTextContent("Slow 0.6×");
      now.mockReturnValue(5_000);
      await userEvent.click(button);
      now.mockReturnValue(20_000);
      await userEvent.click(button);
      expect(made.map((a) => a.playbackRate)).toEqual([1, 0.6, 1, 1]);
    } finally {
      now.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it("restores ratings, bookmarks and preferences after the provider remounts", async () => {
    function Probe() {
      const { progress, ready, rate, favorite, preferences } = useProgress();
      if (!ready) return <p>Loading</p>;
      return (
        <>
          <button
            onClick={() => {
              rate(letters[0].id, "good");
              favorite(letters[0].id);
              preferences({ dailyGoal: 15 });
            }}
          >
            Practice
          </button>
          <output data-testid="progress">{JSON.stringify(progress)}</output>
        </>
      );
    }
    const first = render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Practice" }),
    );
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY)!).cards[letters[0].id]
          .history,
      ).toHaveLength(1),
    );
    const stored = localStorage.getItem(STORAGE_KEY)!;
    first.unmount();
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    );
    await waitFor(() =>
      expect(JSON.parse(screen.getByTestId("progress").textContent!)).toEqual(
        JSON.parse(stored),
      ),
    );
    expect(JSON.parse(stored).favorites).toContain(letters[0].id);
    expect(JSON.parse(stored).preferences.dailyGoal).toBe(15);
    // Never key storage by a build ID, deployment URL or asset hash.
    expect(STORAGE_KEY).toBe("aksharam.progress.v1");
  });
});
