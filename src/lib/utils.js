export function floatToInt16(samples) {
  const result = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    result[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return result;
}

export function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function writeBytes(target, offset, bytes) {
  target.set(bytes, offset);
}

export function writeOctal(target, offset, length, value) {
  const octal = value
    .toString(8)
    .padStart(length - 1, "0")
    .slice(-(length - 1));
  for (let index = 0; index < octal.length; index += 1) {
    target[offset + index] = octal.charCodeAt(index);
  }
  target[offset + length - 1] = 0;
}

export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Could not create the output file.")),
      type,
      quality,
    );
  });
}

export function rename(name, ext) {
  return `${baseName(name)}.${ext.replace(/^\./, "")}`;
}

export function baseName(name) {
  return name.replace(/\.[^.]+$/, "") || "converted";
}

export function extension(name) {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function extensionForMime(mime) {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
      "image/x-icon": "ico",
    }[mime] || "bin"
  );
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
}

export function once(target, event) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      target.removeEventListener("error", onError);
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("That file could not be read."));
    };
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function readUint16(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(
    0,
    true,
  );
}

export function readUint32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(
    0,
    true,
  );
}

export function readUint16BE(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(
    0,
    false,
  );
}

export function readUint32BE(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(
    0,
    false,
  );
}

export function escapeHtml(value) {
  return value.replace(
    /[&<>"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char],
  );
}

export function decodeXml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
