# Technology logo carousel in Habilidades

## Objective

Show the twenty technologies behind the Habilidades section as a browsable strip that
works on touch, keyboard and pointer, without hijacking attention or adding weight to
the page.

## Problem

The skills are currently text only. A logo strip lets a visitor recognise the stack at a
glance, but the assets and the dark theme made that non-trivial:

- Eleven of the twenty source images carry an opaque white background, and the page
  background is `#141414`. Dropped in as-is they read as bright boxes on a dark page.
- Three logos (Git, GitHub, Visual Studio Code) were already white. On a white tile they
  would be invisible; on the dark background they needed different treatment again.
- `node.png` had transparent padding baked in: the logo filled only 74% x 60% of its
  canvas, so it rendered visibly smaller than its neighbours.
- Aspect ratios range from 0.77 (portrait) to 5.57 (a wide OpenCode banner).

## Approach

A horizontal scroll strip with previous/next controls. Each click advances exactly one
logo so `scroll-snap` always lands on a boundary. The step is measured at runtime from
the first logo's `offsetWidth` plus the computed `columnGap`, never hardcoded.

Rejected along the way:

- **Auto-advancing marquee.** Would not move at all on this machine: Windows animations are
  off (`MinAnimate=0`), so the browser reports `prefers-reduced-motion: reduce` and the
  project's existing rule freezes every animation. Correct behaviour, useless here.
- **Full width auto-rotation.** Same blocker, and it would have ignored an explicit OS
  accessibility preference.
- **Per-image size classes.** Twenty one-off rules that drift the moment an asset is
  replaced. A uniform square box scales to any aspect ratio without special cases.

## Decisions

- Every logo sits in the same `h-20 w-20 sm:h-24 sm:w-24` box with `object-contain`. A
  5.57:1 banner letterboxes instead of overflowing; a square logo fills the box.
- Only OpenAI, GitHub and OpenCode keep a white tile. Those three carry a dark or white
  mark that disappears against the page background.
- No `invert` filter anywhere. It would help GitHub (black logo) but wreck Visual Studio
  Code (white logo) and GitLab (orange logo).
- `node.png` was cropped to its opaque bounds: 800x600 -> 600x368, and it got smaller
  (25.6 -> 23.5 KB).
- Arrows are HTML numeric entities so the markup does not depend on file encoding.
- `declared width/height` is read from the file on disk for every asset, so replacing an
  image never leaves a stale aspect ratio behind.

## Constraints

- `tests/habilidades.spec.js` asserts `doesNotMatch(habilidades, /progress|bar|rating/i)`
  across the whole section. No class name in the carousel may contain those substrings.
- The section must keep exactly two `<article>` track elements.
- `prefers-reduced-motion` must switch the scroll to `auto` instead of `smooth`.

## Verification

- 52/52 tests pass, no test modified.
- `vite build` clean, no parse5 warnings.
- Bundle: JS 0.71 -> 1.44 KB (gzip 0.40 -> 0.71). The carousel logic is the only JS.
- Buttons carry a 44 px touch target, visible focus, and `disabled` state at both ends.
- The scroll container is `tabindex="0"`, so it is reachable and arrow-scrollable without
  the buttons.

## Gotchas

- PowerShell 5.1 reads a `.ps1` written as UTF-8 *without BOM* as Windows-1252, then
  re-encodes on write. `í` (C3 AD) became C3 83 C2 AD, i.e. an `Ã` plus an invisible soft
  hyphen. Tests and the build do not catch it. Detect by searching for U+00C3 or U+00AD.
- `System.Drawing.Image.Save()` cannot write to the path of a bitmap that is still open:
  it throws a generic GDI+ error. Read the bytes into a `MemoryStream` first, then save.
- Two scripts that located a block by counting `<div>` tags deleted the wrong region of
  `index.html` (588 -> 52 lines). Recovered both times with `git checkout` only because
  the carousel was never committed. Use the editor with exact anchors instead.

## Next

- Five assets still carry a baked-in white background and show as white boxes on the dark
  background: `my.png`, `opencode.png`, `pg.png`, `react.png`, `vite.jpg`. Replace them
  with official transparent PNGs rather than processing them; the automated flood fill was
  unreliable and inflated PNGs fivefold.
- The strip is 1722 KB because the assets are very high resolution (3840x2400, 3840x2160,
  2048x2042). They render at 96 px. Downscaling to 256 px wide would bring the total to
  roughly 150 KB.