# Continuing the artwork

This project explores art drawn with JavaScript. Keep the rendering source
readable and editable, and preserve the ability to run the studies locally.

## Working on a study

1. Create a branch, for example `git switch -c codex/portrait-next-layer`.
2. Edit the relevant `studies/<name>/draw.js`, `style.css`, or `index.html`.
3. Run `npm run check`, then `npm start` and inspect the changed study in a browser.
4. Commit a coherent artistic or technical change with a descriptive message.

The drawing code remains the source of the artwork. Do not replace it with an
AI-generated image, an embedded photograph, or an opaque pre-rendered asset.
If you introduce a reference, document its creator, source, license, and how it
influenced the work. Preserve the portrait attribution and share-alike terms.

## Visual checks

- Confirm the art renders and the browser console has no runtime errors.
- Check a narrow window and a desktop window after changing layout.
- For Nacre, check pointer rotation and Pause/Play; preserve reduced-motion
  support and its behavior when the page is hidden.
- Keep useful canvas descriptions and keyboard-operable controls.
- If randomness changes, use an explicit seed when repeatability matters.

## Adding a study

Create a directory under `studies/` with `index.html`, `draw.js`, and optional
`style.css`. Link it from the main index and README. Add its public files to the
preview server's route list in `scripts/serve.mjs` and its JavaScript to the
`check` script in `package.json`.

## History

Use actual commits as the record of our collaboration. Do not backdate work or
invent earlier commit history. Leave `archive/` unchanged; it records the two
original conversation fragments at the moment this repository was initialized.

Never commit credentials, local environment files, or personal machine paths.
