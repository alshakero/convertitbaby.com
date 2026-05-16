# convertitbaby.com

A private file converter for GitHub Pages.

## Features

- HEIC/HEIF to JPG, PNG, or WebP.
- Everyday image files to JPG, PNG, or WebP.
- Audio and video conversion across popular formats.
- GIF to WebM or MP4, and MP4 or other short video clips to GIF.
- PDF pages to PNG and multiple images to a PDF.
- Archive/compression handling for ZIP, TAR, TGZ, GZIP, plus recognition of RAR, 7Z, BZ2, XZ, Zstandard, Brotli, LZ, and LZMA files.
- Document and ebook conversion for DOCX, TXT, Markdown, HTML, and EPUB.
- Data conversion between JSON, YAML, CSV, TSV, XML, vCard, iCal, and env-style files.
- Spreadsheet conversion for XLSX, CSV, and JSON-style tabular data.
- Subtitle conversion between SRT, WebVTT, and plain text.
- Config conversion for TOML and INI.
- Map-data conversion between GeoJSON, KML, GPX, and CSV.
- SVG raster/PDF export, ICO creation, focused font and 3D model handling, and code pretty/minify outputs.
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
