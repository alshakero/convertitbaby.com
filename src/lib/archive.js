import { baseName, extension, writeBytes, writeOctal } from "./utils.js";

const crcTable = createCrcTable();

export async function createZip(downloads) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  const usedNames = new Map();
  const { time, date } = getZipDateTime();
  let offset = 0;

  for (const download of downloads) {
    const filename = uniqueZipName(download.filename, usedNames);
    const nameBytes = encoder.encode(filename);
    const data = new Uint8Array(await download.blob.arrayBuffer());
    if (data.length > 0xffffffff || offset > 0xffffffff) {
      throw new Error("That batch is too large for a single ZIP file.");
    }

    const crc = crc32(data);
    const localHeader = createLocalZipHeader({
      nameBytes,
      crc,
      size: data.length,
      time,
      date,
    });
    const centralHeader = createCentralZipHeader({
      nameBytes,
      crc,
      size: data.length,
      time,
      date,
      offset,
    });

    chunks.push(localHeader, data);
    centralDirectory.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralDirectory.reduce(
    (total, chunk) => total + chunk.length,
    0,
  );
  if (centralSize > 0xffffffff || offset > 0xffffffff) {
    throw new Error("That batch is too large for a single ZIP file.");
  }

  const endRecord = new Uint8Array(22);
  const view = new DataView(endRecord.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, downloads.length, true);
  view.setUint16(10, downloads.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);

  return new Blob([...chunks, ...centralDirectory, endRecord], {
    type: "application/zip",
  });
}

export function zipBlobFromEntries(entries, mimeType = "application/zip") {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  const { time, date } = getZipDateTime();
  let offset = 0;

  for (const [filename, content] of entries) {
    const nameBytes = encoder.encode(filename);
    const data =
      typeof content === "string"
        ? encoder.encode(content)
        : new Uint8Array(content);
    const crc = crc32(data);
    const localHeader = createLocalZipHeader({
      nameBytes,
      crc,
      size: data.length,
      time,
      date,
    });
    const centralHeader = createCentralZipHeader({
      nameBytes,
      crc,
      size: data.length,
      time,
      date,
      offset,
    });
    chunks.push(localHeader, data);
    centralDirectory.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralDirectory.reduce(
    (total, chunk) => total + chunk.length,
    0,
  );
  const endRecord = new Uint8Array(22);
  const view = new DataView(endRecord.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);
  return new Blob([...chunks, ...centralDirectory, endRecord], {
    type: mimeType,
  });
}

export async function createTar(downloads) {
  const chunks = [];
  const usedNames = new Map();

  for (const download of downloads) {
    const filename = uniqueArchiveName(download.filename, usedNames);
    const data = new Uint8Array(await download.blob.arrayBuffer());
    chunks.push(
      createTarHeader(filename, data.length),
      data,
      tarPadding(data.length),
    );
  }

  chunks.push(new Uint8Array(1024));
  return new Blob(chunks, { type: "application/x-tar" });
}

function createTarHeader(filename, size) {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(filename);
  if (nameBytes.length > 100) {
    throw new Error("That filename is too long for a TAR archive.");
  }

  const header = new Uint8Array(512);
  const now = Math.floor(Date.now() / 1000);
  writeBytes(header, 0, nameBytes);
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, now);
  header.fill(0x20, 148, 156);
  header[156] = "0".charCodeAt(0);
  writeBytes(header, 257, encoder.encode("ustar"));
  writeBytes(header, 263, encoder.encode("00"));

  const checksum = header.reduce((total, value) => total + value, 0);
  writeOctal(header, 148, 8, checksum);
  return header;
}

function tarPadding(size) {
  const remainder = size % 512;
  return new Uint8Array(remainder ? 512 - remainder : 0);
}

export async function gzipBlob(blob) {
  if (!canGzip()) {
    throw new Error("GZIP is not available for this file.");
  }

  const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
  return new Blob([await new Response(stream).arrayBuffer()], {
    type: "application/gzip",
  });
}

export function canGzip() {
  return typeof CompressionStream === "function";
}

function createLocalZipHeader({ nameBytes, crc, size, time, date }) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  header.set(nameBytes, 30);
  return header;
}

function createCentralZipHeader({ nameBytes, crc, size, time, date, offset }) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function uniqueZipName(filename, usedNames) {
  return uniqueArchiveName(filename, usedNames);
}

function uniqueArchiveName(filename, usedNames) {
  const safeName = (filename || "converted").replace(/[\\/]/g, "-");
  const root = baseName(safeName);
  const ext = extension(safeName);
  const count = usedNames.get(safeName) || 0;
  usedNames.set(safeName, count + 1);
  return count ? `${root}-${count + 1}${ext ? `.${ext}` : ""}` : safeName;
}

function getZipDateTime(value = new Date()) {
  const year = Math.max(1980, value.getFullYear());
  const date =
    ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate();
  const time =
    (value.getHours() << 11) |
    (value.getMinutes() << 5) |
    Math.floor(value.getSeconds() / 2);
  return { date, time };
}

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
