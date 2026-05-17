import { mimeForExtension } from "../formats.js";
import { createTar, createZip, gzipBlob } from "../lib/archive.js";
import { copyOriginalFile } from "../lib/downloads.js";
import { extension, rename } from "../lib/utils.js";

export async function convertArchiveFile(file, formatKey) {
  if (extension(file.name) === formatKey) {
    return copyOriginalFile(file, formatKey);
  }

  const source = {
    blob: file,
    filename: file.name,
    mimeType: file.type || mimeForExtension(extension(file.name)),
    size: file.size,
  };

  if (formatKey === "zip") {
    return {
      blob: await createZip([source]),
      filename: rename(file.name, "zip"),
      mimeType: "application/zip",
    };
  }

  if (formatKey === "tar") {
    return {
      blob: await createTar([source]),
      filename: rename(file.name, "tar"),
      mimeType: "application/x-tar",
    };
  }

  if (formatKey === "tgz") {
    const tarBlob = await createTar([source]);
    return {
      blob: await gzipBlob(tarBlob),
      filename: rename(file.name, "tgz"),
      mimeType: "application/gzip",
    };
  }

  if (formatKey === "gz") {
    return {
      blob: await gzipBlob(file),
      filename: `${file.name}.gz`,
      mimeType: "application/gzip",
    };
  }

  throw new Error("That archive output is not available for this file.");
}
