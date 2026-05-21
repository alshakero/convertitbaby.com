import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(__dirname, "../fixtures/source-formats");
const manifest = JSON.parse(
  await readFile(path.join(fixtureRoot, "manifest.json"), "utf8"),
);

const outputsByKind = {
  heic: [
    { label: "JPG", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG", value: "image/png", extension: ".png" },
    { label: "WebP", value: "image/webp", extension: ".webp" },
  ],
  image: [
    { label: "JPG", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG", value: "image/png", extension: ".png" },
    { label: "WebP", value: "image/webp", extension: ".webp" },
    { label: "AVIF", value: "image/avif", extension: ".avif" },
    { label: "ICO", value: "ico", extension: ".ico" },
    { label: "PDF", value: "pdf", extension: ".pdf" },
  ],
  gif: [
    { label: "WebM video", value: "webm", extension: ".webm" },
    { label: "MP4 video", value: "mp4", extension: ".mp4" },
    { label: "JPG still", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG still", value: "image/png", extension: ".png" },
  ],
  pdf: [
    { label: "Compressed PDF", value: "compressed-pdf", extension: ".pdf" },
    { label: "PNG images", value: "png", extension: ".png" },
  ],
  video: [
    { label: "GIF", value: "gif", extension: ".gif" },
    { label: "WebM", value: "webm", extension: ".webm" },
    { label: "MP4", value: "mp4", extension: ".mp4" },
    { label: "MOV", value: "mov", extension: ".mov" },
    { label: "MKV", value: "mkv", extension: ".mkv" },
    { label: "MP3", value: "mp3", extension: ".mp3" },
    { label: "WAV", value: "wav", extension: ".wav" },
    { label: "AAC", value: "aac", extension: ".aac" },
    { label: "FLAC", value: "flac", extension: ".flac" },
  ],
  audio: [
    { label: "MP3", value: "mp3", extension: ".mp3" },
    { label: "WAV", value: "wav", extension: ".wav" },
    { label: "AAC", value: "aac", extension: ".aac" },
    { label: "FLAC", value: "flac", extension: ".flac" },
    { label: "Ogg", value: "ogg", extension: ".ogg" },
  ],
  archive: [
    { label: "ZIP archive", value: "zip", extension: ".zip" },
    { label: "TAR archive", value: "tar", extension: ".tar" },
    { label: "TGZ archive", value: "tgz", extension: ".tgz" },
    { label: "GZIP file", value: "gz", extension: ".gz" },
    { label: "7Z archive", value: "7z", extension: ".7z" },
    { label: "RAR archive", value: "rar", extension: ".rar" },
    { label: "BZIP2 file", value: "bz2", extension: ".bz2" },
    { label: "XZ file", value: "xz", extension: ".xz" },
    { label: "Zstandard file", value: "zst", extension: ".zst" },
    { label: "Brotli file", value: "br", extension: ".br" },
  ],
  document: [
    { label: "PDF", value: "pdf", extension: ".pdf" },
    { label: "HTML", value: "html", extension: ".html" },
    { label: "TXT", value: "txt", extension: ".txt" },
  ],
  office: [
    { label: "PDF", value: "pdf", extension: ".pdf" },
    { label: "HTML", value: "html", extension: ".html" },
    { label: "TXT", value: "txt", extension: ".txt" },
    { label: "CSV", value: "csv", extension: ".csv" },
    { label: "JSON", value: "json", extension: ".json" },
  ],
  data: [
    { label: "JSON", value: "json", extension: ".json" },
    { label: "YAML", value: "yaml", extension: ".yaml" },
    { label: "CSV", value: "csv", extension: ".csv" },
    { label: "TSV", value: "tsv", extension: ".tsv" },
    { label: "XML", value: "xml", extension: ".xml" },
    { label: "XLSX", value: "xlsx", extension: ".xlsx" },
  ],
  config: [
    { label: "JSON", value: "json", extension: ".json" },
    { label: "YAML", value: "yaml", extension: ".yaml" },
    { label: "TOML", value: "toml", extension: ".toml" },
    { label: "INI", value: "ini", extension: ".ini" },
    { label: "XML", value: "xml", extension: ".xml" },
  ],
  email: [
    { label: "TXT", value: "txt", extension: ".txt" },
    { label: "HTML", value: "html", extension: ".html" },
    { label: "PDF", value: "pdf", extension: ".pdf" },
    { label: "MSG", value: "msg", extension: ".msg" },
  ],
  certificate: [
    { label: "PEM", value: "pem", extension: ".pem" },
    { label: "DER", value: "der", extension: ".der" },
    { label: "TXT", value: "txt", extension: ".txt" },
  ],
  playlist: [
    { label: "JSON", value: "json", extension: ".json" },
    { label: "TXT", value: "txt", extension: ".txt" },
    { label: "CSV", value: "csv", extension: ".csv" },
  ],
  palette: [
    { label: "JSON", value: "json", extension: ".json" },
    { label: "CSS", value: "css", extension: ".css" },
  ],
  workout: [
    { label: "GPX", value: "gpx", extension: ".gpx" },
    { label: "CSV", value: "csv", extension: ".csv" },
    { label: "FIT", value: "fit", extension: ".fit" },
  ],
  subtitle: [
    { label: "SRT", value: "srt", extension: ".srt" },
    { label: "VTT", value: "vtt", extension: ".vtt" },
    { label: "TXT", value: "txt", extension: ".txt" },
  ],
  geo: [
    { label: "GeoJSON", value: "geojson", extension: ".geojson" },
    { label: "KML", value: "kml", extension: ".kml" },
    { label: "GPX", value: "gpx", extension: ".gpx" },
    { label: "CSV", value: "csv", extension: ".csv" },
  ],
  ebook: [
    { label: "HTML", value: "html", extension: ".html" },
    { label: "TXT", value: "txt", extension: ".txt" },
    { label: "PDF", value: "pdf", extension: ".pdf" },
    { label: "MOBI", value: "mobi", extension: ".mobi" },
    { label: "AZW3", value: "azw3", extension: ".azw3" },
  ],
  vector: [
    { label: "PNG", value: "png", extension: ".png" },
    { label: "WebP", value: "webp", extension: ".webp" },
    { label: "PDF", value: "pdf", extension: ".pdf" },
  ],
  font: [
    { label: "TTF", value: "ttf", extension: ".ttf" },
    { label: "OTF", value: "otf", extension: ".otf" },
    { label: "WOFF", value: "woff", extension: ".woff" },
    { label: "WOFF2", value: "woff2", extension: ".woff2" },
  ],
  model3d: [
    { label: "OBJ", value: "obj", extension: ".obj" },
    { label: "STL", value: "stl", extension: ".stl" },
    { label: "GLTF", value: "gltf", extension: ".gltf" },
    { label: "GLB", value: "glb", extension: ".glb" },
  ],
  code: [
    { label: "Pretty", value: "pretty", extension: null },
    { label: "Minified", value: "min", extension: null },
  ],
  rawImage: [{ label: "Original", value: "original", extension: null }],
};

test("download all keeps a single converted file unzipped", async ({
  page,
}) => {
  await page.goto("/");
  await page.setInputFiles(
    "#file-input",
    path.join(fixtureRoot, "image/png/sample.png"),
  );

  const row = page.locator(".queue-item").first();
  await row.locator(".output-select").selectOption("image/jpeg");
  await page.locator("#go-button").click();

  await expect(row.locator(".item-status")).toHaveText("Done", {
    timeout: 60_000,
  });
  await expectConversionEvent(page, "file_conversion", {
    conversion_kind: "image",
    event_category: "conversion",
    input_format: "png",
    output_format: "jpg",
    status: "success",
    transport_type: "beacon",
  });
  await expectConversionEvent(page, "conversion_batch", {
    conversion_count: 1,
    event_category: "conversion",
    failure_count: 0,
    status: "success",
    transport_type: "beacon",
  });

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-all-button").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.jpg$/);
  expect(download.suggestedFilename().toLowerCase()).not.toMatch(/\.zip$/);
  await expect(page.locator(".status")).toContainText("Downloaded sample.jpg.");
});

test("file picker accepts PDF files by extension", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#file-input")).toHaveAttribute(
    "accept",
    /(^|,)\.pdf(,|$)/,
  );
});

test("converter works when analytics URLs are blocked", async ({ page }) => {
  await page.route(
    /analytics|conversion-events|googletagmanager|gtag/i,
    (route) => route.abort(),
  );
  await page.goto("/");
  await page.setInputFiles(
    "#file-input",
    path.join(fixtureRoot, "image/png/sample.png"),
  );

  const row = page.locator(".queue-item").first();
  await expect(row).toContainText("sample.png");
  await row.locator(".output-select").selectOption("image/jpeg");
  await page.locator("#go-button").click();

  await expect(row.locator(".item-status")).toHaveText("Done", {
    timeout: 60_000,
  });
  await expect(page.locator(".status")).toContainText("Converted 1 file");
});

for (const fixture of manifest.sources) {
  for (const output of outputsByKind[fixture.kind] || []) {
    test(`${fixture.id} converts to ${output.label}`, async ({ page }) => {
      await page.goto("/");
      await page.setInputFiles(
        "#file-input",
        path.join(fixtureRoot, fixture.path),
      );

      const row = page.locator(".queue-item").first();
      await expect(row).toContainText(path.basename(fixture.path));

      const option = row
        .locator(`.output-select option[value="${output.value}"]`)
        .first();
      await expect(option).toHaveCount(1);

      const optionState = await option.evaluate((node) => ({
        disabled: node.disabled,
        label: node.textContent,
      }));
      test.skip(
        optionState.disabled,
        `${optionState.label} is disabled in this browser`,
      );

      await row.locator(".output-select").selectOption(output.value);
      await page.locator("#go-button").click();

      await expect(row.locator(".item-status")).toHaveText("Done", {
        timeout: 60_000,
      });
      await expect(row.locator(".support-note")).toBeHidden();
      await expect(page.locator(".status")).toContainText("Converted 1 file");
      await expect(page.locator(".status")).not.toContainText("parallel");
      await expect(page.locator(".results > *")).toHaveCount(1);
      await expect(
        page.locator(".results > #download-all-button"),
      ).toBeEnabled();

      const links = row.locator(".item-downloads .download");
      await expect(links.first()).toBeVisible();
      const filenames = await links.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("download")),
      );

      expect(filenames.length).toBeGreaterThan(0);
      const expectedExtension = output.extension || path.extname(fixture.path);
      for (const filename of filenames) {
        expect(filename).toBeTruthy();
        expect(filename.toLowerCase()).toMatch(
          new RegExp(`${escapeRegExp(expectedExtension)}$`),
        );
      }
    });
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function expectConversionEvent(page, eventName, expectedParams) {
  const params = await page.evaluate((name) => {
    const event = window.dataLayer
      .map((entry) => Array.from(entry))
      .find(([command, candidateName]) => {
        return command === "event" && candidateName === name;
      });

    return event?.[2] || null;
  }, eventName);

  expect(params).toEqual(expect.objectContaining(expectedParams));
  expect(params.duration_ms).toBeGreaterThanOrEqual(0);
}
