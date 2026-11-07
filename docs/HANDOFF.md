# Aksharam — handoff and roadmap

This file is the single source of truth for the in-progress learning overhaul.
Any agent (Claude Code, Codex, a human) picking this up should read it first,
then check the **Status** checklist and continue from the first unchecked item.

## Context

- Aksharam teaches English speakers to read the Malayalam script. Static
  Next.js export on GitHub Pages; all progress in browser localStorage
  (`aksharam.progress.v1`, schema version 1 — keep it backward compatible).
- The site is a gift: the final owner must be able to fork/clone and deploy
  with zero setup. Never require servers, secrets, paid APIs, or local
  generation steps for deployment. Generated assets (audio) are committed.
- **Visual design is out of scope.** The owner will redesign pages later.
  Reuse existing CSS classes; change logic and interaction only. New screens
  may use plain existing classes (`panel`, `button primary`, `select-field`…).
- Read `node_modules/next/dist/docs/` before using unfamiliar Next.js APIs
  (this Next version differs from older training data — see AGENTS.md).
- Checks that must stay green: `npm test`, `npm run lint`,
  `npm run typecheck`, `npm run build`, `npm run check:export`.

## Problems being fixed (why)

1. Old Learn order taught the whole chart first: the first vowel sign arrived
   in session 11, ം/് in session 14. Learners could not read anything for ~2
   weeks.
2. Flashcards/Test consumed letters before Learn taught them (flip or answer
   = "introduced"), and every main button led to Flashcards.
3. Lessons were "read card → one question on the same letter" with random,
   unseen distractors: no real recall.
4. No syllables or words: learners never read anything.
5. No audio for most users.
6. Days 1–14 felt like failure (zeros dashboard, mastery takes weeks,
   % score endings, zero-flash before hydration).
7. Progress can vanish (Safari 7-day storage cap, no backup nudges).

## Learner pipeline (target design)

```
Welcome (why, daily goal, "know some letters?") → Lesson 1 immediately
Home = one "Continue" button (nextAction):
  due ≥ 6 → review lesson; else next unit lesson (+ up to 3 due reviews);
  all units done → review / weak / keep-sharp practice
Unit lesson (3–5 min): teach 2 → quiz them → teach rest → quiz →
  mixed reverse/contrast → syllable reading → reviews; misses retried once
End: "You can now read …" + XP + streak + goal + new milestones
```

- Curriculum: `src/data/curriculum.ts` (22 core units by usefulness, then
  optional rare/historic units). Draft — needs native-educator review.
- Syllables: `src/lib/syllables.ts` (consonant + sign, compositional ISO
  15919 romanization). Not tracked by SRS; XP only.
- SRS: only the **first** question per letter in a session schedules the
  card (avoids interval inflation); later answers record attempts + XP.
- Distractors: only taught letters, same category first, with deliberate
  confusables (vowel length pairs, ന/ണ, ല/ള/ഴ, ര/റ, dental/retroflex,
  aspirated pairs).
- Strength levels 0–4 per letter (new, learning, known, strong, mastered).
- Habit: XP daily goal (preferences.dailyGoal, XP), streak with rest days
  (earn 1 per 5-day streak, hold 2), milestones, share text, calendar
  reminder (.ics), PWA manifest. No hearts/leagues/guilt notifications.
- Navigation: Learn (/), Practice (/practice), Alphabet (/reference),
  Me (/settings). /learn runs lessons via `?mode=`; /flashcards and /test
  only use taught letters.

## Audio

- Engine: AI4Bharat Indic Parler-TTS (Apache-2.0), run locally once by the
  maintainer; clips committed to `public/audio/<codepoints>.m4a` and listed
  in `src/data/audio-manifest.json`. See `scripts/tts/README.md`.
- Blocked (2026-11-07): maintainer Mac had ~8 GB free (needs ~6 GB), and the
  Hugging Face model requires login + accepting terms.
- Until clips exist, the audio button hides itself unless a browser
  Malayalam voice is available; listening questions only appear for
  entries with clips.

## Status

- [x] Base path derived from repository name (fork-friendly deploy)
- [x] Progress schema: optional v1 fields (xp, lessons, freezes,
      frozenDays, milestones, onboarded, reason, lastBackupAt)
- [x] Curriculum units + syllable generator + audio helper
- [x] Lesson engine (`src/lib/lesson.ts`), habit logic (`src/lib/habit.ts`)
- [x] Provider actions (attempt/lesson completion/XP/freezes/onboarding)
- [x] Pages: home (welcome + path), /learn runner, /practice hub, Me page
- [x] Flashcards/Test restricted to taught letters; ratings after flip;
      deck summary; no exit confirm; typing accent keypad + "almost"
- [x] Audio button + listen questions + syllable builder
- [x] PWA manifest, persistent storage request, backup reminder, .ics
- [x] TTS scripts (`scripts/tts/`)
- [x] Tests updated, all checks green
- [x] README: plain-language "deploy your own copy" guide

Verified 2026-11-07: 71 tests, lint, typecheck, build and export check
pass; exports also verified with base paths `/my-copy` and `` (root).

## Next steps

1. **Audio clips** (maintainer's Mac): free ~6 GB disk, then follow
   `scripts/tts/README.md` (setup → HF login → `--test` → generate →
   commit `public/audio` + `src/data/audio-manifest.json`). Listening
   questions switch on automatically for entries with clips.
2. **Manual check on real phones** (iPhone Safari, Android Chrome): first
   run welcome, lesson 1 end to end, test-out, flashcards, Me → reminder
   and backup, Add to Home Screen. Automated tests cannot cover layout.
3. **Mnemonics** per letter (one-line memory hooks shown on the teach
   card) — needs writing and native review; add an optional `mnemonic`
   field to `Letter` and render it in `TeachCard`
   (`src/components/lesson-runner.tsx`).
4. **Words stage**: fill `example` in `src/data/alphabet.ts` with
   native-checked words and add word-reading questions after unit 8.
5. Visual redesign (owner). New elements without styles: the milestone
   list on Me (`.milestone-list`), strength bars inside alphabet tiles,
   the accent keypad buttons, the syllable builder.

## Later (needs a person)

- Native Malayalam speaker: review curriculum order, audio clips, and add
  example words (the `example` field) for a "read real words" stage.
- Visual redesign of every page (owner).
- Optional sign-in/sync would need a backend; GitHub Pages cannot host one.
