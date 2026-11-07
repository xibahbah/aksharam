# Appearance and Learn modes

## Appearance

- Navigation has a sun/moon button that switches to an explicit Light or Dark preference. Settings → Appearance offers Light, Dark, and System.
- `aksharam.appearance.v1` stores the preference separately from learning progress. Resetting or importing progress does not change appearance. System uses `prefers-color-scheme` and updates on OS changes; explicit choices ignore OS changes. Changes also synchronize across tabs.
- A small inline script in the exported document head resolves the preference before the body paints. Root-only hydration suppression covers its intentional `data-theme` attribute; the initial React UI otherwise matches the server render. Preference controls hydrate after mount.
- Semantic tokens cover backgrounds, surfaces, card backs, text, glyphs, borders, input fields, focus, dialogs, selection, hover, progress, feedback, and collection accents. CSS `color-scheme` also themes native controls. Reduced-motion behavior remains unchanged.
- If storage is blocked, appearance still works in the current tab and Settings reports that it cannot be persisted.

## Learn selection (superseded)

> Replaced in November 2026 by the unit path and lesson engine; see
> [HANDOFF.md](HANDOFF.md). Kept for history.

The Learn page shows actual global counts of new, learned, due, and difficult letters. Choose a mode, collection, and 1–20 letters per session. The initial count uses the existing saved lesson-size preference (5 for a new learner).

- **Learn new letters:** excludes every introduced letter. Core forms come before uncommon/historic/scholarly forms; usage is labeled on the reading card. Each chosen letter gets one acknowledged reading step and one recognition or reverse question. Acknowledging a reading or submitting an answer records introduction; merely opening Reference or bookmarking a letter does not.
- **Review learned letters:** only encountered letters are eligible. The default pool contains scheduled cards due now, earliest due first. Explicitly selecting “Include all learned letters, even if not due” also enables future-scheduled and unscheduled introduced letters, while keeping due cards first.
- **Practice difficult letters:** eligible letters have a latest Again/Hard rating, unresolved lapses before mastery, or an incorrect quiz answer at least as recent as their last review. Introduction and bookmarks alone are not difficulty signals. Mastered cards with resolved negative history drop out unless a new negative rating/answer occurs.

Every session freezes a unique selection. Reviews skip new-letter readings. There is one initial scored question per selected letter; a missed question returns once as a labeled retry. The Results screen offers missed-letter retries, Start another session, and Back to Learn. Empty pools cannot start sessions and instead offer appropriate mode/collection actions.

## Existing progress

Learning data retains schema **version 1** and the **`aksharam.progress.v1`** key. Both flashcards and Learn use the existing provider and scheduler; a correct answer schedules Good and an incorrect answer schedules Again. Introduction alone does not mark mastery or create a review interval.

Parsing old v1 files can add missing introduced IDs from validated review records and quiz attempts. This is an additive compatibility repair: the version does not change, and cards, ratings, due dates, intervals, lapses, mastery, quiz answers, bookmarks, preferences, and study dates are preserved. It never infers introduction from dataset membership or a bookmark.

Invalid/unknown-version storage is left unchanged. A temporary in-memory session is offered with a warning; automatic persistence remains disabled until the user explicitly imports valid data or confirms Reset Progress. Valid data is never reset as part of compatibility repair.

## Validation and limits

Automated tests cover v1 compatibility, lossless persistence, pool selection, unique questions, due ordering, difficulty evidence, scheduler continuity, empty/completion states, session actions, appearance controls, OS changes, cross-tab updates, storage failures, pre-paint initialization, hydration, and light/dark text/control contrast. The existing dataset, flashcard, quiz, storage, and mobile gesture tests remain active.

`npm run check:export` checks all six exported routes, their navigation targets, static assets and client navigation payloads under `/aksharam/`, `.nojekyll`, and the early appearance script in every document head.

No connected DOM browser was available in this session. Visual rendering and physical interactions on iPhone Safari and Android Chrome remain **unverified**, including initial-paint appearance, native selects, focus/scroll behavior, and portrait/landscape layouts. Automated DOM, hydration, and token contrast tests do not establish device-level behavior.

## Test locally

```sh
npm run dev
# Open http://localhost:3000/aksharam/
```

1. In Settings select Dark, refresh, and open each route directly. Verify page/card/dialog/input/feedback colors and readable Malayalam glyphs. Select System, then change device appearance.
2. On Learn, choose one new letter and finish its session. Return and verify that it has left the new pool and appears in learned counts.
3. Select Review; check the due count, then opt into all learned letters and complete a review. Refresh and check history and due dates.
4. Answer a question incorrectly or rate a flashcard Again/Hard. Confirm Difficult includes it. Introduction or a Reference bookmark alone must not add a difficult card.
5. Verify empty/new-completion actions, keyboard navigation, 44px controls, and 320/390/768px layouts plus landscape on real devices.

## Files

- Appearance: `src/lib/appearance.ts`, `src/hooks/use-appearance.tsx`, `src/components/appearance.tsx`, `src/app/layout.tsx`, `src/components/shell.tsx`, `src/app/globals.css`, `src/app/settings/page.tsx`.
- Learn: `src/lib/learn.ts`, `src/components/learn-setup.tsx`, `src/components/practice.tsx`, `src/components/results.tsx`.
- Progress compatibility/safety: `src/lib/progress.ts`, `src/hooks/use-progress.tsx`.
- Verification: `tests/appearance.test.tsx`, `tests/theme-colors.test.ts`, `tests/learn.test.ts`, `tests/learn-interactions.test.tsx`, updated `tests/interactions.test.tsx`, and `scripts/check-export.mjs`.
- Documentation: `README.md` and this file. Next.js also regenerated its `next-env.d.ts` references during the production build.

No new dependencies, runtime backend, or deployment configuration changes are required. Publishing uses the existing GitHub Pages workflow when changes are pushed to `main`.
