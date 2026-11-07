# Aksharam developer notes (pre-overhaul)

> Archived reference from before the November 2026 learning overhaul. The
> data, Unicode, scheduler and deployment details still apply; the Learn,
> Flashcards and Test behaviour described here has changed. See the
> [README](../README.md) and [HANDOFF](HANDOFF.md) for current behaviour.
> The base path is now derived from the repository name.

A Malayalam script learning app for English-speaking beginners. Built locally with Next.js App Router, React, strict TypeScript, Tailwind CSS, and Lucide. No account, database, paid API, or backend required.

## Run locally

Use Node **22.13+** (Node 24 LTS recommended) and npm. The implementation was also successfully built and tested on the environment's Node 22.9.0, but a lint dependency officially requires 22.13+.

```sh
cd /Users/nivupai/aksharam
npm ci
npm run dev
```

Open **http://localhost:3000/aksharam/**. Development uses the same base path as GitHub Pages. `npm ci` uses the lockfile for reproducible installs.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run check:export
npm start
```

`npm run build` statically exports the site to `out/`. `npm start` serves that folder at **http://localhost:3000/aksharam/** using a plain file server. It does not use `next start`, server rendering, or SPA fallback rewrites. Run a build before starting the static preview. Set `PORT=3001 npm start` if port 3000 is occupied.

The development and build scripts use Next.js's supported `--webpack` flag because Turbopack's CSS worker cannot bind its internal port in this restricted environment. To try Turbopack elsewhere: `npx next dev` or `npx next build`.

## What works

- **Overview:** introduced and mastered cards, due reviews, quiz accuracy, local-calendar streak, collection progress, configurable daily goal, and resume learning.
- **Flashcards:** six collections, all cards, custom review, ordered/shuffled cards, previous/next, animated front/back, reversed study direction, bookmarks, rating persistence, and honest audio availability. Core forms appear by default; uncommon and historical forms can be included.
- **Learn:** new, learned-review, and difficult-letter modes with actual counts, collection filters, and 1–20 letters per session (default 5). New sessions exclude introduced letters. Reviews prioritize due cards, with an explicit option to include all learned letters. Difficult practice uses mistakes, lapses, and ratings. Each letter gets one scored question and an optional retry after an incorrect answer.
- **Test:** category, number of distinct questions, recognition/reverse/typing types, feedback, score, per-category breakdown, answer explanations, and retrying the unique missed letters. Scores include retry attempts. Tests use core entries.
- **Alphabet:** all 109 entries, collection filters, Unicode-aware search, native modal details, pronunciation distinctions, code points, bookmarks, and sources. Search preserves meaningful diacritics; use `ṇa` to find the retroflex nasal, or search “retroflex”.
- **Appearance:** Light, Dark, and System preferences with navigation controls, Settings selection, OS-change listening, local persistence, and early theme initialization on every exported route.
- **Settings:** appearance, daily goal, lesson size, validated JSON export/import, confirmation before replacing progress or resetting it, and scheduler documentation.
- Responsive desktop sidebar and mobile bottom navigation, visible keyboard focus, native controls, reduced-motion support, and Georgia-style Latin typography and a self-hosted Malayalam font.

### Keyboard controls

| Key           | Action                                                                        |
| ------------- | ----------------------------------------------------------------------------- |
| Space         | Flip the current flashcard; focused native buttons retain their normal action |
| Left / Right  | Previous / next card                                                          |
| 1 / 2 / 3 / 4 | Again / Hard / Good / Easy                                                    |

Swipe left/right on a flashcard to navigate; vertical scrolling and pinch zoom remain available. Touch controls are at least 44 CSS pixels. Shortcuts do not intercept typing or select fields. Card ratings automatically advance except at the last card; the final card remains available for inspection. Navigation wraps. A card counts as introduced when revealed, read in a lesson, or answered/rated.

Typing answers are normalized to Unicode NFC, lowercased, trimmed, and have internal whitespace collapsed. **Diacritics are preserved**: `a` and `ā`, `n` and `ṇ`, and `l`, `ḷ`, and `ḻ` are different. No guessed ASCII aliases are accepted. Use an OS accent picker or paste accented Latin text, or choose the keyboard-free recognition modes. No Malayalam keyboard is required.

## Script data and sources

`src/data/alphabet.ts` explicitly contains:

| Collection                                      | Entries |
| ----------------------------------------------- | ------: |
| Independent vowels                              |      17 |
| Base consonants, including scholarly forms      |      38 |
| Atomic chillu letters                           |       9 |
| Dependent vowel signs, including traditional au |      16 |
| Orthographic signs                              |      10 |
| Selected common conjuncts/combinations          |      19 |

**109 is the number of entries in this deck, not a universal Malayalam alphabet count.** Counts differ by teaching convention and historic usage. Combining signs are not standalone vowels. The conjunct list is a practice selection; combinations are productive and not a finite set of basic letters. Numerals, fractions, and measurement symbols are outside this alphabet course.

The dataset uses ISO 15919-style romanization, with descriptive notation for specialized non-pronounced signs. A dotted circle is only a display placeholder for combining marks and is never stored as part of the underlying glyph. Text stays UTF-8; conjuncts are consonant + virama + consonant sequences. Atomic chillu code points are used. No glyph slicing by UTF-16 unit is used.

Sources consulted for character identity, orthography, vocalic/historic distinctions, and pronunciation cues:

- [Unicode Malayalam chart](https://www.unicode.org/charts/PDF/U0D00.pdf)
- [Unicode Standard, Chapter 12, Malayalam](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/)
- [Richard Ishida's Malayalam orthography notes](https://r12a.github.io/scripts/mlym/ml.html)

English cues are intentionally approximate. Notes distinguish dental/retroflex stops, ന / ണ / ൻ, ല / ള / ഴ, inherent vowels, aspiration, and vowel length. Sanskrit, uncommon, historic, and scholarly characters are explicitly labeled. Pronunciation varies with word position and dialect; isolated romanization is not a full pronunciation model. A native Malayalam educator's review is a sensible next step before classroom release.

### Audio and examples

No native recordings or example words are bundled. This avoids claiming verification for unreviewed assets or vocabulary. The optional data fields support both later. Add licensed native recordings under `public/audio`, then set `audioUrl` for an entry. See `public/audio/README.md`.

Web Speech is enabled **only** when an actual `ml`/`ml-*` Malayalam voice is present. Its button is explicitly labeled “Browser voice”; quality may vary and a language tag does not prove native-speaker accuracy. For signs it reads a consonant-plus-sign example. No English-voice fallback is used. Missing recordings show an unavailable state. Audio requires browser/device support and may require a connection for remote browser voices.

## Progress and review algorithm

All learner data lives in LocalStorage under `aksharam.progress.v1`:

- schema version, introduced IDs, bookmarked IDs;
- per-card last/next review times, interval in days, lapses, success streak, full rating history;
- scored quiz attempts, local study dates, and preferences.

Hydration reads storage after the initial render to avoid server/client mismatches. Storage errors are surfaced with an export recommendation. Invalid or unknown schemas are preserved unchanged while a temporary in-memory session runs. Valid v1 data can recover missing introduced IDs from existing reviews and answers without changing schedules or history. Imports enforce known IDs, metadata, finite nonnegative review fields, chronology, supported version, preferences ranges, and a 10 MB maximum. Imports replace rather than merge. Export before importing or resetting if needed. Progress is browser-local and not synchronized across tabs/devices; JSON is the transfer mechanism.

The **deterministic lightweight scheduler** is not SM-2 or FSRS:

| Rating | Interval                    | Success streak | Lapse     |
| ------ | --------------------------- | -------------- | --------- |
| Again  | 10 minutes                  | reset          | +1        |
| Hard   | max(1 day, previous × 1.2)  | reset          | unchanged |
| Good   | max(1 day, previous × 2)    | +1             | unchanged |
| Easy   | max(3 days, previous × 2.5) | +1             | unchanged |

A card is mastered only after **3 consecutive Good/Easy ratings and an interval of at least 7 days**. Correct quiz answers schedule Good; incorrect answers schedule Again. Self-ratings do not contribute to quiz accuracy. Dashboard daily activity counts ratings and answered quiz questions, including repeated practice of a card. Reading introductions alone do not count as a practice day. Streaks use the learner's local calendar, including yesterday if today has not yet been practiced.

Custom Review freezes the due/bookmarked set when a flashcard session opens, ordered by due date, so rating a card does not make it disappear mid-flip. Reopen the session to refresh the set; enable uncommon forms if reviewing them. Learn new excludes encountered letters. Review learned prioritizes due cards; future and unscheduled learned cards require the explicit all-learned option. Review times are refreshed on window focus and every 30 seconds on the dashboard.

## Architecture

```text
src/app/          App Router pages, root layout, responsive design
src/components/  Shell, Card, DeckSelector, ProgressBar, LetterGrid,
                 AudioButton, QuizQuestion, Results, practice sessions
src/data/        Explicit typed Malayalam dataset and sources
src/hooks/       Shared client progress provider
src/lib/         Pure scheduling, storage validation, quiz logic
src/types/       Dataset and persistence contracts
public/audio/    Extension point for licensed native recordings
 tests/          Dataset, scheduling, persistence, scoring, interactions
```

UI and linguistic data are separate. The pure progress functions and shared provider can later be adapted to a backend/Supabase without rewriting the dataset or question components. No service worker or offline caching is implemented, so the app does not advertise offline availability. Self-hosted fonts avoid runtime Google Fonts requests.

## Verification

Automated checks cover dataset metadata and Unicode, dental/retroflex separation, atomic chillus and graphemes, scheduling and mastery, local-calendar streaks, valid/corrupt/blocked storage, import validation, scoring and accent normalization, card flip, keyboard rating persistence after hydration, quiz completion, and missed-letter reintroduction.

Validation: 56 tests pass; lint, strict TypeScript checks, production static export, and the HTTP export check pass. Deployment tests cover the shared base path, future audio URLs, and restoring ratings, bookmarks, and preferences after the provider remounts. Visual verification of this refinement in mobile browsers remains pending because Chrome automation was interrupted. See [mobile refinement verification](docs/MOBILE_REVIEW.md) for implementation details, automation limits, and the viewport/device checklist.

Manual smoke checklist:

1. At desktop and 390px mobile width, verify navigation, dashboard spacing, and absence of horizontal overflow.
2. Flip, reverse, shuffle, bookmark, and rate flashcards. Reload and check progress.
3. Use Space/arrows/1–4, then confirm select/input fields retain native keyboard behavior.
4. Complete a lesson with one wrong answer; verify that letter returns and mastery is not granted immediately.
5. Complete a mixed test, inspect category scores, and retry misses. Try `ā` versus `a` in typing.
6. Search ന, `ṇa`, “retroflex”, and a vowel sign. Open details, tab through the modal, and close with Escape.
7. Export, import, and reset using a disposable browser profile; cancel each confirmation once.
8. Check with no Malayalam voice installed. If one exists, verify the “Browser voice” label and listen critically.

## GitHub Pages deployment

Target repository: **`nivupai/aksharam`**, branch **`main`**. Target URL: **https://nivupai.github.io/aksharam/**. This is a project Pages site: do not change the separate `nivupai.github.io` repository, and do not add a `CNAME` file for this deployment.

Deployment is managed by `.github/workflows/deploy.yml`. Pushes to `main` run checks, export the app, and deploy it to GitHub Pages. Check the repository’s Actions tab for the status of each deployment. The setup instructions below also apply to a fresh checkout or a new repository.

### Repository setup

This project initially has no `.git` of its own. Running Git here currently discovers an unrelated repository rooted at `/Users/nivupai`, with an `ug-classwork` remote. **Initialize this folder as its own repository before staging anything.** These commands leave the enclosing repository and `nivupai.github.io` unchanged:

```sh
cd /Users/nivupai/aksharam
# Authenticate with access to push workflow files.
gh auth login --hostname github.com --git-protocol https --scopes workflow
gh auth setup-git

git init -b main .
# Must print /Users/nivupai/aksharam, not /Users/nivupai.
git rev-parse --show-toplevel
# Stop if that guard fails; never stage the home directory.
test "$(git rev-parse --show-toplevel)" = "$PWD" || exit 1

git remote add origin https://github.com/nivupai/aksharam.git
```

Check whether the target repository exists after authentication:

```sh
gh repo view nivupai/aksharam
```

Only if it is confirmed missing (not merely inaccessible), create the project repository:

```sh
gh repo create nivupai/aksharam --public --description "Learn the Malayalam script, one letter at a time"
```

If the remote repository is empty, commit and push:

```sh
git add .
git commit -m "Configure Aksharam static export and GitHub Pages deployment"
git push -u origin main
```

If the remote already has commits, **do not force-push**. Inspect `git fetch origin` and `git log --oneline origin/main` first. Preserve the existing remote history and integrate the local application into it before pushing. If a project-local `origin` is already configured when following these instructions, inspect `git remote -v` and skip `git remote add` when it already points to the correct repository; do not silently replace an unrelated remote.

### Enable Pages and deploy

1. Open **https://github.com/nivupai/aksharam/settings/pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. Do this in the `aksharam` repository only. Ensure repository Actions are enabled and the GitHub Pages actions are allowed.
3. Under **Settings → Environments → github-pages**, allow deployments from **main**. If protection rules require approval, approve the deployment there.
4. Open **Actions → Deploy Aksharam to GitHub Pages → Run workflow**, select **main**, and run it. This also handles an initial push whose workflow started before Pages was enabled.

The equivalent CLI command to create a new Pages configuration after the first commit has been pushed is:

```sh
gh api --method POST repos/nivupai/aksharam/pages -f build_type=workflow
```

For an existing Pages configuration, update its source instead:

```sh
gh api --method PUT repos/nivupai/aksharam/pages -f build_type=workflow
```

These commands require repository administration permission. Use only the command appropriate to the current state, or use the repository Settings UI above. Then trigger and inspect the deployment:

```sh
gh workflow run deploy.yml --repo nivupai/aksharam --ref main
gh run list --repo nivupai/aksharam --workflow deploy.yml --limit 5
# Replace RUN_ID with the run ID printed above.
gh run watch RUN_ID --repo nivupai/aksharam --exit-status
gh api repos/nivupai/aksharam/pages --jq '{url: .html_url, build_type: .build_type}'
curl --fail --location https://nivupai.github.io/aksharam/
```

The `deploy.yml` workflow triggers on every push to `main` and manual dispatch on `main`. It checks out the source, installs Node 24 LTS, uses `npm ci`, runs tests/lint/typecheck, configures Pages, builds the export, and verifies the output. It uploads **only `out/`** (including `.nojekyll`), then deploys in the `github-pages` environment with the URL returned by `actions/deploy-pages`. Permissions are `contents: read`, `pages: write`, and `id-token: write`; no personal token secret is needed. The separate pull-request CI workflow runs checks without deploying.

### Paths, assets, and direct refreshes

`next.config.ts` uses `output: "export"`, `basePath: "/aksharam"`, `trailingSlash: true`, and `images: { unoptimized: true }`. Next automatically prefixes `next/link` routes and its compiled JS/CSS/font bundles. A separate CDN `assetPrefix` is not needed. Internal Next links should continue to use paths such as `/learn`, **without manually adding the base path twice**.

`src/lib/paths.ts` exports `publicAssetPath()`. Use it for files in `public/`, including future `<img>`/`next/image` sources, downloads, `fetch` calls to static files, and audio URLs. The audio player already uses it: `/audio/a.mp3` becomes `/aksharam/audio/a.mp3`. Already-prefixed paths and external URLs are preserved. Fonts are imported from Fontsource and emitted by Next into the prefixed static asset directory. Do not reference public files with a bare domain-root URL in CSS; use imported assets or an explicitly prefixed path.

`public/.nojekyll` is copied into `out/.nojekyll` during export and included in the uploaded artifact. No Jekyll transformation is needed.

Every current app route gets a real HTML file:

| Public route            | Exported file               |
| ----------------------- | --------------------------- |
| `/aksharam/`            | `out/index.html`            |
| `/aksharam/flashcards/` | `out/flashcards/index.html` |
| `/aksharam/learn/`      | `out/learn/index.html`      |
| `/aksharam/test/`       | `out/test/index.html`       |
| `/aksharam/reference/`  | `out/reference/index.html`  |
| `/aksharam/settings/`   | `out/settings/index.html`   |

Directory URLs permit direct loads and refreshes on GitHub Pages without any SPA rewrite. The output also contains a real `404.html` for unknown routes. No API routes, Server Actions, dynamic request handlers, cookies, middleware, or server-only runtime features are required.

`npm run check:export` checks the six HTML files, internal navigation targets, JS/CSS references, compiled CSS font files, and `.nojekyll`. It then mounts the output under `/aksharam/` using a temporary plain HTTP server and requests all discovered targets. Root-domain routes and unknown project routes must return 404, proving that missing pages are not hidden by an SPA fallback. The same check runs before the workflow uploads the artifact.

After the remote deployment succeeds, open and refresh **each public route above**, navigate between collections, and check browser Network/Console for failed assets or hydration errors. Also rate a flashcard, refresh, and confirm that its history and bookmarks remain. A local export check does not prove that the remote workflow or live URL succeeded.

### Progress across deployments

The unchanged LocalStorage key is **`aksharam.progress.v1`**. It is not based on deployment IDs, build hashes, route paths, or asset names. Rebuilding/deploying static files does not clear browser storage, so refreshes and new deployments on **the same HTTPS origin and browser profile** retain progress without a backend. GitHub project sites share the `https://nivupai.github.io` origin; the app-specific storage key separates Aksharam's data. Browser storage clearing, private browsing, or an incompatible future schema can affect persistence. Export a JSON backup before major upgrades.

`localhost` and `https://nivupai.github.io` are different origins: export from local Settings and import on the deployed site to transfer existing progress. Merely changing the local base path does not change the origin or storage key, so local progress is preserved.

Future improvements: educator-reviewed example vocabulary, licensed native-speaker recordings, a dedicated handwriting course with verified stroke guidance, a full mobile browser QA pass, optional cross-device sync, and an explicitly implemented offline strategy. Light/Dark/System appearance is implemented; handwriting is not included.

See [appearance and Learn modes](docs/APPEARANCE_AND_LEARN.md) for selection rules, progress compatibility, changed files, and local verification instructions.
