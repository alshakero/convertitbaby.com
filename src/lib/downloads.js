import { mimeForExtension } from "../formats.js";
import { trackObjectUrl } from "./runtime.js";
import { rename } from "./utils.js";

export function createDownload(blob, filename, mimeType = blob.type) {
  const url = URL.createObjectURL(blob);
  trackObjectUrl(url);
  const download = { url, filename, mimeType, size: blob.size, blob };
  return download;
}

export function copyOriginalFile(file, ext) {
  return {
    blob: file.slice(0, file.size, file.type || mimeForExtension(ext)),
    filename: rename(file.name, ext),
    mimeType: file.type || mimeForExtension(ext),
  };
}

export function textDownload(text, filename, mimeType) {
  return {
    blob: new Blob([text], { type: mimeType }),
    filename,
    mimeType,
  };
}
