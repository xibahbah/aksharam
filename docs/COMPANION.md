# Learning companion

Original character generated with the built-in imagegen tool. Source: `public/companion/source-sheet.png`. Transparent GIFs (`idle.gif`, `cheer.gif`, `oops.gif`) and a reduced-motion still are assembled by `scripts/build-companion.py` using Pillow. These are animated pose sequences with small bounces, sways and rolls, not fully hand-drawn in-between frames.

Prompt: Create a production sprite sheet for a tiny friendly language-learning companion: one original mischievous Malayali little girl in a warm Hayao Miyazaki hand-drawn animation style. Brown skin, expressive dark eyes, short black pigtails, coral red blouse and cream Kerala skirt with a simple gold hem, barefoot, childlike proportions, fully clothed. Soft pencil contours and flat watercolor/cel shading, readable at 100 pixels tall. Transparent background. Exact 3 columns by 2 rows of equal square cells; same character, consistent scale, full body with clear margins. Six poses: cheerful standing; joyous victory hop; clapping; puffed cheeks with hands on hips; seated playful mock tantrum; curled sideways ready to roll. No text, grid, background or checkerboard.

The app uses a fixed, reviewed set of supportive messages. No chat model, user-data transmission, scoring changes, sound, keyboard interception or automatic advance. The companion occupies a separate right gutter on desktop, hides under the intro/dialog, has a nap control, and uses a still image for reduced motion. Quiz answers and flashcard ratings trigger short reactions; idle returns after 4.2 seconds.

Intro remains automatic for new learners. Returning learners have an explicit Replay intro sidebar link. Flashcards use the original 3D flip again with a reduced-motion override inherited from workspace styles.
