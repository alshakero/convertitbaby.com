# Agent Notes

- Keep the visible supported-format count in sync with the actual supported formats. When adding or removing formats, update every user-facing count, including the home page `.format-count` text and the Open Graph card count in `og-image.svg` and `public/og-image.svg`.
- Keep the hidden SEO conversion phrase block in `index.html` in sync with `tests/fixtures/source-formats/manifest.json` and `tests/browser/conversion-matrix.spec.js` when conversion combinations change.
- After changing `og-image.svg`, regenerate `og-image.png` and `public/og-image.png`, then run `npm run build` so `dist/` is refreshed.
