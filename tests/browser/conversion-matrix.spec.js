import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(__dirname, "../fixtures/source-formats");
const manifest = JSON.parse(await readFile(path.join(fixtureRoot, "manifest.json"), "utf8"));

const outputsByKind = {
  heic: [
    { label: "JPG", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG", value: "image/png", extension: ".png" },
    { label: "WebP", value: "image/webp", extension: ".webp" }
  ],
  image: [
    { label: "JPG", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG", value: "image/png", extension: ".png" },
    { label: "WebP", value: "image/webp", extension: ".webp" },
    { label: "PDF", value: "pdf", extension: ".pdf" }
  ],
  gif: [
    { label: "WebM video", value: "webm", extension: ".webm" },
    { label: "MP4 video", value: "mp4", extension: ".mp4" },
    { label: "JPG still", value: "image/jpeg", extension: ".jpg" },
    { label: "PNG still", value: "image/png", extension: ".png" }
  ],
  pdf: [
    { label: "PNG images", value: "png", extension: ".png" }
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
    { label: "FLAC", value: "flac", extension: ".flac" }
  ],
  audio: [
    { label: "MP3", value: "mp3", extension: ".mp3" },
    { label: "WAV", value: "wav", extension: ".wav" },
    { label: "AAC", value: "aac", extension: ".aac" },
    { label: "FLAC", value: "flac", extension: ".flac" },
    { label: "Ogg", value: "ogg", extension: ".ogg" }
  ]
};

for (const fixture of manifest.sources) {
  for (const output of outputsByKind[fixture.kind] || []) {
    test(`${fixture.id} converts to ${output.label}`, async ({ page }) => {
      await page.goto("/");
      await page.setInputFiles("#file-input", path.join(fixtureRoot, fixture.path));

      const row = page.locator(".queue-item").first();
      await expect(row).toContainText(path.basename(fixture.path));

      const option = row.locator(`.output-select option[value="${output.value}"]`).first();
      await expect(option).toHaveCount(1);

      const optionState = await option.evaluate((node) => ({
        disabled: node.disabled,
        label: node.textContent
      }));
      test.skip(optionState.disabled, `${optionState.label} is disabled in this browser`);

      await row.locator(".output-select").selectOption(output.value);
      await page.locator("#go-button").click();

      await expect(row.locator(".item-status")).toHaveText("Done", { timeout: 60_000 });
      await expect(row.locator(".support-note")).toBeHidden();
      await expect(page.locator(".status")).toContainText("Converted 1 file");
      await expect(page.locator(".status")).not.toContainText("parallel");
      await expect(page.locator(".results > *")).toHaveCount(1);
      await expect(page.locator(".results > #download-all-button")).toBeEnabled();

      const links = row.locator(".item-downloads .download");
      await expect(links.first()).toBeVisible();
      const filenames = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("download")));

      expect(filenames.length).toBeGreaterThan(0);
      for (const filename of filenames) {
        expect(filename).toBeTruthy();
        expect(filename.toLowerCase()).toMatch(new RegExp(`${escapeRegExp(output.extension)}$`));
      }
    });
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
