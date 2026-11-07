"use client";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  Check,
  Settings,
  ShieldCheck,
  Bell,
  Trophy,
  Share2,
} from "lucide-react";
import { coreLetters } from "@/data/alphabet";
import { useProgress } from "@/hooks/use-progress";
import { emptyProgress, mastered, parseProgress } from "@/lib/progress";
import {
  currentStreak,
  FREEZE_EVERY,
  MAX_FREEZES,
  milestones,
  reminderCalendar,
} from "@/lib/habit";
import { strength } from "@/lib/lesson";
import { PageHeading } from "@/components/ui";
import { AppearanceSettings } from "@/components/appearance";
function download(name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function SettingsPage() {
  const { progress, preferences, replace, markBackup, now } = useProgress();
  const [time, setTime] = useState("19:00");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then(setPersisted)
      .catch(() => undefined);
  }, [progress.lessons?.length]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function exportData() {
    download(
      `aksharam-progress-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
      JSON.stringify({ ...progress, lastBackupAt: Date.now() }, null, 2),
    );
    markBackup();
    setError(false);
    setStatus("Your progress backup is ready. Keep the file somewhere safe.");
  }
  function addReminder() {
    const url = `${location.origin}${location.pathname.replace(/settings\/?$/, "")}`;
    download(
      "aksharam-reminder.ics",
      "text/calendar",
      reminderCalendar(time, url),
    );
    setError(false);
    setStatus(
      "Open the downloaded file to add a daily reminder to your calendar.",
    );
  }
  async function share(title: string, detail: string) {
    const text = `${title} on Aksharam: I'm learning to read Malayalam. ${detail}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setStatus("Copied to the clipboard.");
      }
    } catch {
      /* dismissed */
    }
  }
  const at = now;
  const learned = coreLetters.filter((l) =>
    progress.introduced.includes(l.id),
  ).length;
  const strong = coreLetters.filter(
    (l) => strength(progress, l.id) >= 3,
  ).length;
  const masteredCount = Object.values(progress.cards).filter(mastered).length;
  const accuracy = progress.attempts.length
    ? Math.round(
        (100 * progress.attempts.filter((a) => a.correct).length) /
          progress.attempts.length,
      )
    : null;
  const totalXp = Object.values(progress.xp ?? {}).reduce((a, b) => a + b, 0);
  const earned = new Set(progress.milestones ?? []);
  async function importData(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 10_000_000)
        throw new Error("Choose a progress export under 10 MB.");
      const p = parseProgress(await file.text());
      if (
        window.confirm(
          `Replace this browser’s progress with the imported file? It contains ${p.introduced.length} introduced cards and ${Object.keys(p.cards).length} practiced cards.`,
        )
      ) {
        replace(p);
        setError(false);
        setStatus("Your progress has been restored.");
      }
    } catch (e) {
      setError(true);
      setStatus(e instanceof Error ? e.message : "Could not import this file.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <PageHeading title="Me" />
      <div className="settings-grid">
        <section className="panel settings-panel" aria-label="Your progress">
          <div className="settings-title">
            <Trophy size={22} />
            <h2>Your progress</h2>
          </div>
          <dl className="learn-counts">
            {[
              ["Learned", `${learned} / ${coreLetters.length}`],
              ["Strong", strong],
              ["Mastered", masteredCount],
              ["Streak", `${currentStreak(progress, at)} days`],
              ["Rest days", `${progress.freezes ?? 0} / ${MAX_FREEZES}`],
              ["Lessons", progress.lessons?.length ?? 0],
              ["Total XP", totalXp],
              ["Accuracy", accuracy === null ? "—" : `${accuracy}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Every {FREEZE_EVERY} days in a row earns a rest day (up to{" "}
            {MAX_FREEZES}). A rest day covers a missed day so your streak
            survives.
          </p>
          <h3>Milestones</h3>
          <ul className="milestone-list">
            {milestones.map((m) => (
              <li key={m.id}>
                {earned.has(m.id) ? (
                  <Check size={16} aria-label="Earned" />
                ) : null}
                <strong>{m.title}</strong> — {m.detail}
                {earned.has(m.id) && (
                  <button
                    className="text-link"
                    onClick={() => void share(m.title, m.detail)}
                    aria-label={`Share ${m.title}`}
                  >
                    <Share2 size={14} /> Share
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="panel settings-panel" aria-label="Daily reminder">
          <div className="settings-title">
            <Bell size={22} />
            <h2>Daily reminder</h2>
          </div>
          <p>
            Add a repeating five-minute event to your calendar, with an alert.
          </p>
          <label className="setting-row" htmlFor="reminder-time">
            <span>
              <strong>Reminder time</strong>
            </span>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value || "19:00")}
            />
          </label>
          <button className="button primary" onClick={addReminder}>
            <Bell size={17} /> Add to my calendar
          </button>
        </section>
        <AppearanceSettings />
        <section className="panel settings-panel">
          <div className="settings-title">
            <Settings size={22} />
            <h2>Study preferences</h2>
          </div>
          <label className="setting-row" htmlFor="goal">
            <span>
              <strong>Daily goal</strong>
              <small>XP per day. A lesson earns about 15 XP.</small>
            </span>
            <select
              id="goal"
              value={progress.preferences.dailyGoal}
              onChange={(e) =>
                preferences({ dailyGoal: Number(e.target.value) })
              }
            >
              {Array.from(
                new Set([10, 15, 30, 50, progress.preferences.dailyGoal]),
              )
                .sort((a, b) => a - b)
                .map((n) => (
                  <option key={n} value={n}>
                    {n} XP
                  </option>
                ))}
            </select>
          </label>
          <label className="setting-row" htmlFor="lesson-size">
            <span>
              <strong>Review size</strong>
              <small>Letters per review or Keep sharp session.</small>
            </span>
            <select
              id="lesson-size"
              value={progress.preferences.lessonSize}
              onChange={(e) =>
                preferences({ lessonSize: Number(e.target.value) })
              }
            >
              {Array.from(
                new Set([5, 10, 15, 20, progress.preferences.lessonSize]),
              )
                .sort((a, b) => a - b)
                .map((n) => (
                  <option key={n} value={n}>
                    {n} letters
                  </option>
                ))}
            </select>
          </label>
        </section>
        <section className="panel settings-panel" id="backup">
          <div className="settings-title">
            <ShieldCheck size={22} />
            <h2>Keep your progress safe</h2>
          </div>
          <p>
            Progress lives only in this browser. Safari can clear a site&apos;s
            data after a week without a visit, so save a backup now and then.
            The same file moves your progress to another device. Importing
            replaces this browser&apos;s progress.
          </p>
          <p className="muted">
            {progress.lastBackupAt
              ? `Last backup: ${new Date(progress.lastBackupAt).toLocaleDateString()}.`
              : "No backup saved yet."}{" "}
            {persisted === true
              ? "This browser has agreed to keep the data."
              : persisted === false
                ? "This browser may clear the data when space runs low."
                : ""}
          </p>
          <p className="muted">
            Tip: add Aksharam to your home screen (Share → Add to Home Screen)
            to use it like an app. On iPhone the home-screen app keeps its own
            progress, so export here and import there once.
          </p>
          <div className="button-row">
            <button className="button primary" onClick={exportData}>
              <Download size={17} />
              Export progress
            </button>
            <button
              className="button secondary"
              onClick={() => input.current?.click()}
            >
              <Upload size={17} />
              Import JSON
            </button>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Import progress JSON"
              onChange={(e) => void importData(e.target.files?.[0])}
            />
          </div>
        </section>
        <section className="panel settings-panel">
          <h2>How reviews work</h2>
          <p>
            Lessons and reviews schedule letters automatically: a right answer
            pushes a letter further out, a miss brings it back soon. Flashcard
            ratings work the same way. Again returns in 10 minutes. Hard waits
            at least a day. Good starts at a day and doubles the previous
            interval. Easy starts at 3 days and multiplies by 2.5. Hard grows a
            previous interval by 1.2.
          </p>
          <p>
            A letter is mastered after at least 3 consecutive Good or Easy
            reviews and an interval of 7 days or more. Again and Hard reset that
            streak. Only Again counts as a lapse. This is a lightweight
            deterministic scheduler, not SM-2 or FSRS.
          </p>
          <p>
            Continue clears a review backlog before teaching new letters, and
            every lesson mixes in a few due reviews. Only the first question
            about a letter in a session changes its schedule. Accuracy uses
            answered questions; flashcard self-ratings are excluded.
          </p>
        </section>
        <section className="panel settings-panel reset-panel">
          <h2>Reset progress</h2>
          <p>
            Reset all reviews, bookmarks, quiz history, and preferences on this
            browser. Export a backup first if you’d like to return to them.
          </p>
          <button
            className="button danger"
            onClick={() => {
              if (
                window.confirm(
                  "Permanently reset all Aksharam progress in this browser? This cannot be undone without an export.",
                )
              ) {
                replace(emptyProgress());
                setError(false);
                setStatus("Progress has been reset.");
              }
            }}
          >
            <Trash2 size={17} />
            Reset progress
          </button>
        </section>
      </div>
      {status && (
        <div
          className={`notice ${error ? "error" : "success"}`}
          role={error ? "alert" : "status"}
        >
          <Check size={19} />
          {status}
        </div>
      )}
    </>
  );
}
