# Desktop workspace redesign

The curriculum, lesson planning, prerequisites, spaced-review scheduler, scoring, saved-progress schema, and four navigation destinations are unchanged. Styling is in `src/app/workspace.css`; desktop layout rules are scoped to 900px and wider. Mobile was not redesigned or tested.

The shared workspace now uses a slim persistent navigation rail, one heading scale, open practice choices, a row-based learning path, quieter settings, and an on-demand syllable builder. The current lesson is marked by a small boat. The approved asymmetric flower from the landing is reused as the brand, daily-goal indicator, and lesson-completion bloom.

Motion includes a sliding active-navigation surface, route entrances, lesson entry from its selected row, glyph entrances, syllable recombination, alphabet-filter FLIP rearrangement, a glyph flying from its tile into the detail dialog, pronunciation ripples, correct/incorrect feedback, a correct-answer petal flying toward session progress, an ink-like flashcard reveal, and a staggered completion bloom. The landing flower travels toward the brand when Start is pressed. Existing reduced-motion preferences disable nonessential movement; keyboard and semantic controls are retained.

No instructional stroke-order drawing or automatic outline morph between different Malayalam letters is provided: those require verified stroke and correspondence data, rather than invented pedagogical animation. Existing phonetic explanations remain unchanged.

Validation: full unit/interaction suite; lint, TypeScript via production build, static-route/asset export checks; desktop browser checks of lesson retry, completion and next-unit progression, practice availability, flashcard reveal, reference dialog, syllable builder, and dark/light themes. Browser testing uses localhost progress, never production learner records.

The desktop sidebar now has a draggable hand-drawn divider with uneven curves
and faint secondary pencil strokes. Dragging adjusts its width from 208–320px
(with a viewport-based cap); the preference is stored locally. Arrow keys resize,
Home/End select bounds, and double-click restores the default. The current-lesson
boat marker has an oar and no rectangular background; the path line leaves a
small gap around it.

Home entry now server-renders a full-screen background matching the intro until
saved progress is hydrated. The sidebar and workspace mount only after the home
view can choose first-visit intro, explicit #intro replay, or the returning
learner's path. This prevents the workspace flashing before the landing.

Hovering the desktop sidebar or its divider gently morphs the divider's ink
curve and drifts the faint pencil strokes. The shortened, centered drag target
stays fixed. Dragging suspends the effect; reduced-motion preferences disable it.

The star-to-figures/boat morph section is now 30% shorter (opening words and
flying stars retain their timing). Unfolding starts at child time 1.15 instead
of 1.65, allocating more of the shortened section to the growing contours.
The star swell carries outward momentum into the growth frames; the colored
layers begin unfolding as soon as they appear. The authored distance fields
use immediate envelope expansion and a smooth minimum at the boundary handoff,
removing the previous stop/start feel without rotating limbs. Final silhouettes
and the landing composition are unchanged.

The central cream seed now uses a rounded eight-lobed outline rather than sharp
star points. Runtime and the baked growth authoring script use the same polar
curve and cubic tangent construction, so the rounded swell feeds directly into
the growth contours. The flying prelude stars and final artwork are unchanged.

`studies/morph-comparison.html` provides four replayable desktop previews, with
an optional normalized scrubber enabled by `study=1`:
- `motion=original` or no parameter (default): exact animation/growth source from `bab35b0` (pre-speed-up).
- `motion=faster`: exact animation/growth source from `21d0861` (30% shorter).
- `motion=rounded`: the rounded-first-frame behavior from `146b68e`.
- `motion=latest`: original sharp small star, progressively
  rounded during expansion, then the rounded growth contours.

The original-speed timeline is the main-site default and initializes synchronously.
The comparison page also starts with this version; all four remain available.
The faster archive is loaded only when requested.
The current opening subdivides the sharp quadratic segments into matching cubic
segments before blending their controls toward the rounded seed, retaining the
exact original first frame and exact rounded handoff. Final artwork stays shared.
