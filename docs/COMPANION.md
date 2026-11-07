# Learning companion

Original character generated with the built-in imagegen tool. Source: `public/companion/source-sheet.png`. Transparent GIFs (`idle.gif`, `cheer.gif`, `oops.gif`) and a reduced-motion still are assembled by `scripts/build-companion.py` using Pillow. These are animated pose sequences with small bounces, sways and rolls, not fully hand-drawn in-between frames.

Prompt: Create a production sprite sheet for a tiny friendly language-learning companion: one original mischievous Malayali little girl in a warm Hayao Miyazaki hand-drawn animation style. Brown skin, expressive dark eyes, short black pigtails, coral red blouse and cream Kerala skirt with a simple gold hem, barefoot, childlike proportions, fully clothed. Soft pencil contours and flat watercolor/cel shading, readable at 100 pixels tall. Transparent background. Exact 3 columns by 2 rows of equal square cells; same character, consistent scale, full body with clear margins. Six poses: cheerful standing; joyous victory hop; clapping; puffed cheeks with hands on hips; seated playful mock tantrum; curled sideways ready to roll. No text, grid, background or checkerboard.

The app uses a fixed, reviewed set of supportive messages. No chat model, user-data transmission, scoring changes, sound, keyboard interception or automatic advance. The companion occupies a separate right gutter on desktop, hides under the intro/dialog, has a nap control, and uses a still image for reduced motion. Quiz answers and flashcard ratings trigger short reactions; idle returns after 4.2 seconds.

Intro remains automatic for new learners. Returning learners have an explicit Replay intro sidebar link. Flashcards use the original 3D flip again with a reduced-motion override inherited from workspace styles.

## Version 2 — thirty drawn frames

The original six-pose animation is replaced by three generated ten-frame sequences in `public/companion/v2`: quiet blink/glance, two small claps, and a comic hands-on-hips pout that relaxes. Each sequence was generated separately using the original sheet as the identity reference with the built-in imagegen tool. The shared prompt requires exactly ten sequential full-body drawings in a five-column, two-row transparent sheet; identical face, costume, camera, head size, centerline and planted feet. Idle changes eyelids/pupils only; cheer raises hands into two claps then lowers them; oops moves hands to hips, puffs cheeks, relaxes, and returns to neutral. No body rotation, translation, stomping, bouncing or rolling is requested.

The builder extracts all 30 drawings to individual PNGs, aligns their feet and normalizes height, then uses a shared palette to avoid color flicker. It does not rotate or bounce drawings. Each GIF contains ten frames. Idle has a six-second cycle with long still holds; cheer plays once for two seconds, and oops once for 2.6 seconds. Timings are exported to JSON and consumed by the component. New feedback cannot interrupt an active gesture; nap cancels it and resets cleanly. Reduced motion uses the new still. These are generated drawn frames, not bespoke hand-animated or optical-flow interpolated footage; minor drawing variation remains.

## Version 3 — twelve scenarios / 120 frames

`public/companion/v3` contains 12 ten-frame sequences: idle, cheer, oops, wave, sleepy, proud, determined, relieved, surprised, thinking, puzzled and stretch. The existing cheer/oops drawings are retained; ten sheets are newly generated with the same identity reference, including a replacement idle with synchronized eyelids and no eye glance. Idle frames 3–5 show both lids half closed, closed, then reopening together. Built-in imagegen prompts require the same girl/outfit, ten full-body drawings in a 5×2 transparent sheet, fixed feet/camera, and sequential in-between arm/facial poses. Individual scenarios describe clapping, hand-on-heart relief, surprise, chin-touch thinking, palms-up puzzlement, a confident fist near the heart, waving, yawning, and stretching. A second imagegen edit removes the stretch sheet's white matte. The builder removes low-alpha matte residue, aligns feet, and exports both individual frames and GIFs.

Answer history is transient and scoped to the current route. Three correct answers trigger proud; a miss after a correct answer triggers surprised; two consecutive misses trigger puzzled; three or more trigger determined; success after any miss triggers relieved. These states never modify scoring. Events received during a gesture update history and replace a single pending reaction, which plays after the current gesture ends. Preview menu exposes all twelve animations without changing history. Clicking the character waves. Nap plays the yawn and then hides the companion; waking waves. No random constant animation rotation is used.

The landing ticker now measures a hidden plain SVG text node containing the complete string instead of measuring text already on a path. Both reduced-motion and animated ticker copies receive the measured spacing after fonts are ready.

### Reaction handoff

Reaction GIFs are preloaded. The renderer keeps the outgoing image visible
while its replacement loads and decodes, then switches visibility in one
render while preserving the incoming image node. This avoids the blank flash
caused by unmounting the old GIF immediately. A failed replacement leaves the
current drawing in place; reduced motion continues to use the still image.

## Sleep transition and loop

Assets in `public/companion/sleep-v1` were generated with the built-in imagegen
using `v3/still.png` as the character identity reference. The companion now
finishes an active reaction before settling from standing into seated sleep.
A 12-frame, 2.2-second settle plays once, then a ten-frame, six-second breathing
loop. Waking reverses the settle over two seconds, ending on the existing neutral
standing drawing. Both joins reuse the same endpoint images. `scripts/build-sleep.py`
assembles the GIFs with one palette, a shared physical scale, and fixed ground
baseline; seated poses are not enlarged to standing height. Minor differences
between generated drawings remain.

Phase timers start only after the image decodes. Answers do not wake her, and
wake/nap controls are disabled during the sit/stand transitions. Reduced motion
uses standing/seated still images instead. The existing twelve reaction previews
remain available; sleeping is controlled with Let her nap / Wake her up.

Generation prompt set (built-in tool):
- Sleep loop: exactly ten drawings in a transparent 5×2 sheet, same Malayali girl,
  same brown skin, black pigtails, coral blouse, cream gold-hem skirt and bare feet;
  seated with knees to one side, hands supporting cheek, both eyes closed;
  tiny gradual inhale/exhale only, fixed camera and scale, no props or lettering.
- Settle: exactly ten sequential drawings in a transparent 5×2 sheet, using the
  standing reference as the start and the sleeping sheet as the end; stand at
  rest, relax shoulders, bend knees, half squat, deep squat, sit, raise hands,
  rest cheek on hands, close both eyes, settle asleep. Maintain physical head
  size and ground baseline; do not enlarge the seated pose. No text or props.

Sidebar motion now plays once per hover and settles back to a straight line,
rather than looping for as long as the pointer stays over the sidebar.
