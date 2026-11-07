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
