# Source Format Fixtures

This directory contains one compact fixture for every source extension the app currently recognizes:

- `image/jpg`
- `image/png`
- `image/webp`
- `image/heic`
- `image/heif`
- `animation/gif`
- `document/pdf`
- `audio/mp3`
- `audio/wav`
- `audio/aac`
- `audio/flac`
- `audio/ogg`
- `audio/m4a`
- `archive/zip`
- `archive/rar`
- `archive/7z`
- `archive/gz`
- `archive/gzip`
- `archive/tgz`
- `archive/tar`
- `archive/bz2`
- `archive/xz`
- `archive/zst`
- `archive/br`
- `archive/lz`
- `archive/lzma`
- `document/docx`
- `document/txt`
- `document/md`
- `document/html`
- `data/json`
- `data/yaml`
- `data/csv`
- `data/tsv`
- `data/xml`
- `data/vcf`
- `data/ics`
- `data/env`
- `ebook/epub`
- `ebook/mobi`
- `ebook/azw3`
- `vector/svg`
- `font/ttf`
- `font/otf`
- `font/woff`
- `font/woff2`
- `model/obj`
- `model/stl`
- `model/gltf`
- `model/glb`
- `code/css`
- `code/js`
- `video/mp4`
- `video/mov`
- `video/mkv`
- `video/webm`
- `video/ts`

The fixtures are intentionally tiny so the full conversion matrix can run in a real browser without turning routine checks into a media-rendering marathon.

## Provenance

- JPG, PNG, WebP, GIF, MP3, WAV, MP4, and WebM seeds were downloaded from SampleLib.
- The PDF fixture was downloaded from File Examples.
- HEIC and HEIF were derived locally from the PNG seed with ImageMagick.
- AAC, FLAC, Ogg, and M4A were derived locally from the MP3 seed with FFmpeg.
- MOV, MKV, and TS were derived locally from the MP4 and MP3 seeds with FFmpeg.
- Archive fixtures are tiny synthetic files used to verify extension recognition and local container generation.
- DOCX, EPUB, GLB, OBJ, STL, SVG, document, data, and code fixtures are compact valid files generated locally for the conversion matrix.
- TTF and OTF fixtures are copied from local system fonts. WOFF and WOFF2 fixtures are compact format-recognition files used only for same-format copy checks.
