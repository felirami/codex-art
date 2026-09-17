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
| **002 · Elon Musk ink study** | Hand-defined paths, clipped hatching, seeded stippling, and procedural hair strokes on white. | [studies/elon-ink/draw.js](studies/elon-ink/draw.js) |

Nacre can be paused and respects the system's reduced-motion preference. The
portrait is a static study; its seeded random marks are repeatable. It uses a
photograph as a visual reference, but the renderer does not embed, load, or
sample that photograph.

## Source layout

```text
index.html                 Study index
styles.css                 Portable layout and theme colors
studies/nacre/             Nacre page, styles, and complete renderer
studies/elon-ink/           Portrait page, styles, and complete renderer
scripts/serve.mjs          Local server using only Node's standard library
archive/                  Original conversation fragments
```

Edit the files in `studies/` to continue the artwork. Each `draw.js` is the
complete rendering source for that study, and each `index.html` can be opened
independently. The styles are ordinary CSS; there is no Codex runtime dependency.

The `archive/` directory preserves the original conversation fragments exactly
as they existed when Git was initialized. Those fragments rely on the original
conversation's surrounding styles; use the standalone study pages to run the
project. The archive is a historical record, not a second editable source.

## Checks and history

```sh
npm run check
git log --oneline
```

The check command validates JavaScript syntax. Visually inspect changed studies
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
