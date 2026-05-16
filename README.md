# convertitbaby.com

A private file converter for GitHub Pages.

## Features

- HEIC/HEIF to JPG, PNG, or WebP.
- Everyday image files to JPG, PNG, or WebP.
- Audio and video conversion across popular formats.
- GIF to WebM or MP4, and MP4 or other short video clips to GIF.
- PDF pages to PNG and multiple images to a PDF.
- Batch intake: drop files first, choose an output per file, and convert files in parallel.
- SEO metadata, sitemap, robots file, and GitHub Pages `CNAME`.
- No remote code modules in the deployed app. Build output loads local files from `dist/assets`.

## Development

```sh
npm install
npm run dev
```

## Static build

```sh
npm run build
npm run preview -- --port 4173
```

Deploy the `dist` folder to GitHub Pages.

Selected files are processed privately rather than uploaded.
