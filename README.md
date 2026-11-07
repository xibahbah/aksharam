# Aksharam · അക്ഷരം

Learn to read the Malayalam script in five minutes a day. Short lessons,
real syllables from the very first lesson, and reviews that come back just
before you forget.

Free, no account, no ads. Progress is saved in your browser.

**[Try the live app](https://xibahbah.github.io/aksharam/)**

## What's new

This update reworks the desktop presentation while keeping the learning
pipeline, curriculum order, review scheduling, scoring and existing saves
intact.

- **An animated welcome.** A star grows into two figures seated in a
  Kerala-inspired boat, with an asymmetric, layered flower and Malayalam
  lettering at the center. Two flowing text ribbons sit below the boat.
  The star and motion direction draw inspiration from
  [Adam Mount's personal website](https://adammount.org/). Returning
  learners can use **Replay intro** in the sidebar.
- **A softer workspace.** A slimmer navigation rail, varied hand-drawn
  dividers, gentler shapes and more consistent spacing replace the harder
  borders and oversized layouts. Learn, Practice, Alphabet and Me remain
  the main destinations.
- **More compact learning screens.** Lessons, practice setup, flashcards
  and results use less vertical space, keeping answers, feedback and
  Continue easier to reach on desktop. Longer reference and history
  lists still scroll naturally.
- **Motion throughout the app.** Flashcards have their 3D flip again.
  Navigation, letter selection, alphabet filtering, syllable building,
  answer feedback and lesson completion also have animated transitions.
- **A playful learning companion.** A little Malayali character sits in
  the lower-right corner, with 12 animation sequences and 120 frames.
  Reactions include celebration, surprise after a mistake, encouragement
  after repeated misses, and relief when an answer is right again.
  **Try reactions** previews all twelve; clicking her makes her wave,
  and the nap control plays a standing-to-seated transition before a quiet
  sleeping loop. Waking reverses the transition back to standing.
  Messages are preset, not AI chat,
  and reactions never change scores or advance a lesson.
- **Quieter motion when requested.** Reduced-motion preferences disable
  nonessential movement and give the companion a still image. Text-ribbon
  spacing is measured after fonts load to prevent overlapping copies.

The landing page's final frame is still being polished, and the generated
companion drawings retain some frame-to-frame variation. This redesign
has focused on desktop; mobile has not been redesigned or tested.

Implementation notes: [workspace and motion](docs/WORKSPACE_MOTION.md)
and [companion assets, scenarios and generation](docs/COMPANION.md).

## Put your own copy online (about 5 minutes, no coding)

You need a free [GitHub](https://github.com) account.

1. **Copy the project.** On this repository's GitHub page, click **Fork**
   (top right), then **Create fork**. You can rename it; the site adapts.
2. **Turn on the robot that publishes it.** In your copy, open the
   **Actions** tab and click **I understand my workflows, go ahead and
   enable them**.
3. **Turn on the website.** Open **Settings → Pages**. Under
   **Build and deployment → Source**, choose **GitHub Actions**.
4. **Publish.** Open **Actions → Deploy Aksharam to GitHub Pages → Run
   workflow → Run workflow**. Wait for the green tick (2–3 minutes).
5. **Open it.** Your site is at
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/` (also shown in
   **Settings → Pages**). On a phone, use **Share → Add to Home Screen** to
   open it like an app.

Every later change pushed to the `main` branch republishes the site
automatically. Nothing else to configure: no keys, servers or payments.

## How learning works

- **Learn** (home): one **Continue** button. It clears reviews that are
  due, then teaches the next unit. 22 core units, ordered so you read
  syllables like കാ, നാ, മാ in lesson 1 and കേരളം by unit 8. Rare and
  historic forms are optional extra units.
- **Lessons** (3–5 minutes): each new letter is taught, then practised
  with mixed questions, look-alike and sound-alike contrasts, syllable
  reading, and a few due reviews. A missed question comes back once.
- **Test out**: already know some letters? Skip a unit with a quick check.
- **Practice**: review, weak letters, flashcards and scored tests, all
  using letters you have learned.
- **Alphabet**: every letter with notes, strength bars, and a syllable
  builder.
- **Me**: progress, milestones, daily goal (XP), a calendar reminder, and
  backups.
- **Streaks**: every 5 days in a row earns a rest day (hold up to 2) that
  protects the streak if you miss a day.

Progress lives in the browser only. Safari can clear it after a week
without a visit, so **Me → Keep your progress safe → Export** a backup
now and then. The same file moves progress to another device.

## Audio

Pronunciation clips are generated once with a free, open-source Malayalam
voice (AI4Bharat Indic Parler-TTS) and committed to `public/audio/`, so a
copy of the site needs no setup. The app labels them "Computer voice"
until a native speaker has checked them. To (re)generate clips, see
[scripts/tts/README.md](scripts/tts/README.md). Until clips exist, the
Listen button only appears on devices with a built-in Malayalam voice.

**Known setup issue:** the local text-to-speech generation setup has been
reported not to run on the maintainer's machine. The cause and a fix are
not yet confirmed. This is separate from the animated companion, which
uses preset text and does not require a local AI model.

## For developers

Node 22.13+ and npm.

```sh
npm ci
npm run dev        # http://localhost:3000/aksharam/
npm test && npm run lint && npm run typecheck
npm run build && npm run check:export && npm start
```

- The site's base path comes from `NEXT_PUBLIC_BASE_PATH`; the deploy
  workflow sets it from the repository name (`/repo-name`, or the domain
  root for `username.github.io`). Locally it defaults to `/aksharam`.
- Curriculum: `src/data/curriculum.ts`. Lesson engine: `src/lib/lesson.ts`.
  Habit logic (XP, rest days, milestones): `src/lib/habit.ts`. Letter data
  and sources: `src/data/alphabet.ts`.
- Progress stays schema v1 (`aksharam.progress.v1`); new fields are
  optional so older saves and backups still load.
- Status, design decisions and next steps: [docs/HANDOFF.md](docs/HANDOFF.md).
  Older detailed notes: [docs/DEVELOPER_NOTES.md](docs/DEVELOPER_NOTES.md).

## Content and accuracy

Romanization follows ISO 15919. English sound cues are approximate. The
unit order, generated audio, and any future example words should be
reviewed by a native Malayalam educator. Sources: the Unicode Malayalam
chart and core specification, and Richard Ishida's Malayalam orthography
notes.
