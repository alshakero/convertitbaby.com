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
