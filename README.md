# Codex Art

An open collaboration between felirami and Codex, making art entirely with
JavaScript and Canvas 2D. No image generation or embedded photographs.

## Run it

Clone the repository and open `index.html` in a modern browser. The artworks
use local scripts and styles and do not need an internet connection.

For a local server, use Node.js 20 or newer:

```sh
git clone https://github.com/felirami/codex-art.git
cd codex-art
npm start
```

Open **http://127.0.0.1:8000**. No `npm install` or build step is required.
Set `PORT` to use a different port. The preview server binds to the loopback
interface and serves only the public artwork files.

## Studies

| Study | How it is drawn | Editable source |
| --- | --- | --- |
| **001 · Nacre** | 280 parametric curves projected from a folded, twisting torus, with theme-aware color and pointer-driven rotation. | [studies/nacre/draw.js](studies/nacre/draw.js) |
| **002 · Elon Musk ink study** | Hand-defined facial planes, clipped hatching, and thousands of tiny, seeded loops and strokes. Zoom in to see the portrait dissolve into abstract marks. | [studies/elon-ink/draw.js](studies/elon-ink/draw.js) |

Nacre can be paused and respects the system's reduced-motion preference. The
portrait's seeded marks are repeatable. It uses a
photograph as a visual reference, but the renderer does not embed, load, or
sample that photograph.

The portrait supports **zoom with no fixed upper limit** using the buttons, scroll wheel, trackpad,
or a two-finger pinch. Drag to pan, double-click a detail to zoom toward it, and
choose **Fit portrait** to return to the full composition. With a toolbar button
focused, use `+` / `−`, the arrow keys, and `0` to zoom, pan, and reset.
The viewer replays the original Canvas paths at each scale, keeping individual
strokes sharp. Magnification reveals the same geometry; it does not generate
new marks or switch to a different drawing.
Very large zoom values use scientific notation in the toolbar. At extreme
scales, detail is subject to the browser's numeric and drawing precision.

## Source layout

```text
index.html                 Study index
styles.css                 Portable layout and theme colors
studies/nacre/             Nacre page, styles, and complete renderer
studies/elon-ink/           Portrait page, drawing, and vector zoom viewer
scripts/serve.mjs          Local server using only Node's standard library
tests/                    Camera and drawing replay checks
archive/                  Original conversation fragments
```

Edit the files in `studies/` to continue the artwork. Each `draw.js` contains
the complete artwork geometry. The portrait also uses
[viewer.js](studies/elon-ink/viewer.js) to record and replay its paths with zoom
and pan. Each `index.html` can be opened independently. The styles are ordinary
CSS; there is no Codex runtime dependency.

The `archive/` directory preserves the original conversation fragments exactly
as they existed when Git was initialized. Those fragments rely on the original
conversation's surrounding styles; use the standalone study pages to run the
project. The archive is a historical record, not a second editable source.

## Checks and history

```sh
npm run check
npm test
git log --oneline
```

The check command validates JavaScript syntax. Tests cover zoom anchoring, pinch
geometry, pan boundaries, resetting, and drawing state during replay.
Visually inspect changed studies
in a browser as described in [CONTRIBUTING.md](CONTRIBUTING.md).

All project source and commits are public. Git history begins with the completed
studies at the repository's initial checkpoint. Earlier drawing iterations took
place before Git existed and are not represented as historical commits.

## Licenses

The original software and Nacre source are [MIT licensed](LICENSE).
The portrait artwork, including its embedded portrait-specific geometry, is
**CC BY-SA 3.0**, based on a visual reference by **Debbie Rowe / The Royal Society**.
See [ARTWORK-LICENSE.md](ARTWORK-LICENSE.md) for attribution, the source reference,
and the applicable terms. The software license does not replace the portrait's
artwork license.
