import { mimeForExtension } from "../formats.js";
import { zipBlobFromEntries } from "../lib/archive.js";
import { textDownload } from "../lib/downloads.js";
import { loadPdfLib } from "../lib/lazy-modules.js";
import {
  decodeXml,
  escapeHtml,
  extension,
  readUint16,
  readUint16BE,
  readUint32,
  readUint32BE,
  rename,
} from "../lib/utils.js";
import { convertCopyOnlyFormat } from "./copy.js";
import { imageFileToCanvas } from "./media.js";

export async function convertDocumentFile(file, outputValue) {
  const ext = extension(file.name);
  const text = ext === "docx" ? await docxToText(file) : await file.text();
  if (outputValue === "txt") {
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  }
  if (outputValue === "html") {
    return textDownload(
      textToHtml(text),
      rename(file.name, "html"),
      "text/html",
    );
  }
  if (outputValue === "pdf") {
    return textToPdfDownload(text, rename(file.name, "pdf"));
  }
  throw new Error("That document output is not available for this file.");
}

export async function convertOfficeFile(file, outputValue) {
  const ext = extension(file.name);
  if (["ods", "xlsx"].includes(ext)) {
    const rows = ext === "xlsx" ? await parseXlsx(file) : await parseOds(file);
    if (outputValue === "json")
      return textDownload(
        `${JSON.stringify(rows, null, 2)}\n`,
        rename(file.name, "json"),
        mimeForExtension("json"),
      );
    if (outputValue === "csv")
      return textDownload(
        arrayToDelimited(normalizeRows(rows), ","),
        rename(file.name, "csv"),
        mimeForExtension("csv"),
      );
  }
  const text = await officeToText(file);
  if (outputValue === "txt")
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  if (outputValue === "html")
    return textDownload(
      textToHtml(text),
      rename(file.name, "html"),
      "text/html",
    );
  if (outputValue === "pdf")
    return textToPdfDownload(text, rename(file.name, "pdf"));
  throw new Error("That office output is not available for this file.");
}

export async function convertEmailFile(file, outputValue) {
  if (outputValue === "msg") return convertCopyOnlyFormat(file, "msg", "email");
  const email =
    extension(file.name) === "eml"
      ? parseEml(await file.text())
      : { subject: file.name, body: "" };
  const text = `Subject: ${email.subject}\nFrom: ${email.from}\nTo: ${email.to}\n\n${email.body}`;
  if (outputValue === "txt")
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  if (outputValue === "html")
    return textDownload(
      email.html || textToHtml(text),
      rename(file.name, "html"),
      "text/html",
    );
  if (outputValue === "pdf")
    return textToPdfDownload(text, rename(file.name, "pdf"));
  throw new Error("That email output is not available for this file.");
}

export async function convertCertificateFile(file, outputValue) {
  const ext = extension(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  const isPem = /-----BEGIN [^-]+-----/.test(text);
  const isDer = ["der", "cer"].includes(ext) || !isPem;
  if (outputValue === "txt")
    return textDownload(
      certificateSummary(file.name, text, bytes),
      rename(file.name, "txt"),
      "text/plain",
    );
  if (outputValue === "pem")
    return textDownload(
      isDer ? derToPem(bytes, "CERTIFICATE") : text,
      rename(file.name, "pem"),
      mimeForExtension("pem"),
    );
  if (outputValue === "der") {
    return {
      blob: new Blob([isDer ? bytes : pemToDer(text)], {
        type: mimeForExtension("der"),
      }),
      filename: rename(file.name, "der"),
      mimeType: mimeForExtension("der"),
    };
  }
  throw new Error("That certificate output is not available for this file.");
}

export async function convertPlaylistFile(file, outputValue) {
  const rows = parsePlaylist(await file.text(), extension(file.name));
  if (outputValue === "json")
    return textDownload(
      `${JSON.stringify(rows, null, 2)}\n`,
      rename(file.name, "json"),
      mimeForExtension("json"),
    );
  if (outputValue === "csv")
    return textDownload(
      arrayToDelimited(rows, ","),
      rename(file.name, "csv"),
      mimeForExtension("csv"),
    );
  if (outputValue === "txt")
    return textDownload(
      rows.map((row) => row.path || row.title).join("\n"),
      rename(file.name, "txt"),
      "text/plain",
    );
  throw new Error("That playlist output is not available for this file.");
}

export async function convertPaletteFile(file, outputValue) {
  const colors = await parsePalette(file);
  if (outputValue === "json")
    return textDownload(
      `${JSON.stringify(colors, null, 2)}\n`,
      rename(file.name, "json"),
      mimeForExtension("json"),
    );
  if (outputValue === "css") {
    return textDownload(
      `:root {\n${colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join("\n")}\n}\n`,
      rename(file.name, "css"),
      mimeForExtension("css"),
    );
  }
  throw new Error("That palette output is not available for this file.");
}

export async function convertWorkoutFile(file, outputValue) {
  if (outputValue === "fit")
    return convertCopyOnlyFormat(file, "fit", "workout");
  const points = parseWorkout(await file.text(), extension(file.name));
  if (outputValue === "csv")
    return textDownload(
      arrayToDelimited(points, ","),
      rename(file.name, "csv"),
      mimeForExtension("csv"),
    );
  if (outputValue === "gpx") {
    return textDownload(
      geoToGpx(
        points.map((point, index) => ({
          name: point.name || `Point ${index + 1}`,
          coordinates: [point.longitude, point.latitude],
        })),
      ),
      rename(file.name, "gpx"),
      mimeForExtension("gpx"),
    );
  }
  throw new Error("That workout output is not available for this file.");
}

export async function convertEbookFile(file, outputValue) {
  if (["mobi", "azw3"].includes(outputValue)) {
    return convertCopyOnlyFormat(file, outputValue, "ebook");
  }
  const text =
    extension(file.name) === "epub"
      ? await epubToText(file)
      : await file.text();
  if (outputValue === "txt") {
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  }
  if (outputValue === "html") {
    return textDownload(
      textToHtml(text),
      rename(file.name, "html"),
      "text/html",
    );
  }
  if (outputValue === "pdf") {
    return textToPdfDownload(text, rename(file.name, "pdf"));
  }
  throw new Error("That ebook output is not available for this file.");
}

export async function convertDataFile(file, outputValue) {
  const source = await parseDataFile(file);
  if (outputValue === "xlsx") {
    return {
      blob: createXlsx(normalizeRows(source)),
      filename: rename(file.name, "xlsx"),
      mimeType: mimeForExtension("xlsx"),
    };
  }
  const text = serializeData(source, outputValue);
  return textDownload(
    text,
    rename(file.name, outputValue),
    mimeForExtension(outputValue),
  );
}

export async function convertConfigFile(file, outputValue) {
  const source = parseConfigText(await file.text(), extension(file.name));
  return textDownload(
    serializeConfig(source, outputValue),
    rename(file.name, outputValue),
    mimeForExtension(outputValue),
  );
}

export async function convertSubtitleFile(file, outputValue) {
  const cues = parseSubtitleText(await file.text(), extension(file.name));
  if (outputValue === "srt")
    return textDownload(
      cuesToSrt(cues),
      rename(file.name, "srt"),
      mimeForExtension("srt"),
    );
  if (outputValue === "vtt")
    return textDownload(
      cuesToVtt(cues),
      rename(file.name, "vtt"),
      mimeForExtension("vtt"),
    );
  if (outputValue === "txt")
    return textDownload(
      cues.map((cue) => cue.text).join("\n\n"),
      rename(file.name, "txt"),
      "text/plain",
    );
  throw new Error("That subtitle output is not available for this file.");
}

export async function convertGeoFile(file, outputValue) {
  const features = parseGeoText(await file.text(), extension(file.name));
  if (outputValue === "geojson")
    return textDownload(
      geoToGeoJson(features),
      rename(file.name, "geojson"),
      mimeForExtension("geojson"),
    );
  if (outputValue === "kml")
    return textDownload(
      geoToKml(features),
      rename(file.name, "kml"),
      mimeForExtension("kml"),
    );
  if (outputValue === "gpx")
    return textDownload(
      geoToGpx(features),
      rename(file.name, "gpx"),
      mimeForExtension("gpx"),
    );
  if (outputValue === "csv")
    return textDownload(
      geoToCsv(features),
      rename(file.name, "csv"),
      mimeForExtension("csv"),
    );
  throw new Error("That map output is not available for this file.");
}

export async function convertCodeFile(file, mode) {
  const ext = extension(file.name);
  const text = await file.text();
  const converted =
    mode === "min" ? minifyCode(text, ext) : prettyCode(text, ext);
  return textDownload(converted, rename(file.name, ext), mimeForExtension(ext));
}

async function docxToText(file) {
  const entries = await unzipEntries(file);
  const documentXml = entries.get("word/document.xml");
  if (!documentXml) throw new Error("That DOCX file could not be read.");
  const xml = new TextDecoder().decode(documentXml);
  return xmlToPlainText(xml);
}

async function epubToText(file) {
  const entries = await unzipEntries(file);
  const textParts = [];
  for (const [name, bytes] of entries) {
    if (/\.(xhtml|html|htm)$/i.test(name)) {
      textParts.push(htmlToText(new TextDecoder().decode(bytes)));
    }
  }
  if (!textParts.length) throw new Error("That EPUB file could not be read.");
  return textParts.join("\n\n");
}

async function unzipEntries(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = new Map();
  let offset = 0;
  while (
    offset + 30 <= bytes.length &&
    readUint32(bytes, offset) === 0x04034b50
  ) {
    const method = readUint16(bytes, offset + 8);
    const compressedSize = readUint32(bytes, offset + 18);
    const uncompressedSize = readUint32(bytes, offset + 22);
    const nameLength = readUint16(bytes, offset + 26);
    const extraLength = readUint16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    const name = new TextDecoder().decode(
      bytes.slice(nameStart, nameStart + nameLength),
    );
    const data = bytes.slice(dataStart, dataEnd);
    if (!name.endsWith("/")) {
      entries.set(name, await inflateZipEntry(data, method, uncompressedSize));
    }
    offset = dataEnd;
  }
  return entries;
}

async function inflateZipEntry(data, method, expectedSize) {
  if (method === 0) return data;
  if (method !== 8) throw new Error("That compressed file could not be read.");
  const formats = ["deflate-raw", "deflate"];
  for (const format of formats) {
    try {
      const stream = new Blob([data])
        .stream()
        .pipeThrough(new DecompressionStream(format));
      const result = new Uint8Array(await new Response(stream).arrayBuffer());
      if (!expectedSize || result.length === expectedSize) return result;
    } catch {
      // Try the next deflate wrapper.
    }
  }
  throw new Error("That compressed file could not be read.");
}

async function parseDataFile(file) {
  const ext = extension(file.name);
  if (ext === "xlsx") return parseXlsx(file);
  return parseDataText(await file.text(), ext);
}

function parseDataText(text, ext) {
  if (ext === "json") return JSON.parse(text);
  if (["yaml", "yml"].includes(ext)) return parseSimpleYaml(text);
  if (ext === "csv") return parseDelimited(text, ",");
  if (ext === "tsv") return parseDelimited(text, "\t");
  if (ext === "xml") return xmlToObject(text);
  if (ext === "vcf")
    return parseKeyValueLines(text, /^BEGIN:VCARD|^END:VCARD/i);
  if (ext === "ics")
    return parseKeyValueLines(
      text,
      /^BEGIN:VCALENDAR|^END:VCALENDAR|^BEGIN:VEVENT|^END:VEVENT/i,
    );
  if (ext === "env") return parseEnv(text);
  if (ext === "geojson") return JSON.parse(text);
  throw new Error("That data file could not be read.");
}

function serializeData(value, ext) {
  if (ext === "json") return `${JSON.stringify(value, null, 2)}\n`;
  if (ext === "yaml") return objectToYaml(value);
  if (ext === "csv") return arrayToDelimited(normalizeRows(value), ",");
  if (ext === "tsv") return arrayToDelimited(normalizeRows(value), "\t");
  if (ext === "xml") return objectToXml(value);
  throw new Error("That data output is not available for this file.");
}

async function parseXlsx(file) {
  const entries = await unzipEntries(file);
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml"));
  const sheet = entries.get("xl/worksheets/sheet1.xml");
  if (!sheet) throw new Error("That XLSX file could not be read.");
  const xml = new TextDecoder().decode(sheet);
  const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(
    (rowMatch) => {
      const cells = [];
      for (const cellMatch of rowMatch[1].matchAll(
        /<c[^>]*r="([A-Z]+)\d+"[^>]*(?:t="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g,
      )) {
        const column = columnIndex(cellMatch[1]);
        const type = cellMatch[2];
        const valueMatch = cellMatch[3].match(/<v>([\s\S]*?)<\/v>/);
        const inlineMatch = cellMatch[3].match(/<t[^>]*>([\s\S]*?)<\/t>/);
        let value = valueMatch
          ? decodeXml(valueMatch[1])
          : inlineMatch
            ? decodeXml(inlineMatch[1])
            : "";
        if (type === "s") value = sharedStrings[Number(value)] || "";
        cells[column] = value;
      }
      return cells;
    },
  );
  const headers = rows.shift() || [];
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header || `column${index + 1}`,
        row[index] || "",
      ]),
    ),
  );
}

function parseSharedStrings(bytes) {
  if (!bytes) return [];
  const xml = new TextDecoder().decode(bytes);
  return [
    ...xml.matchAll(/<si[^>]*>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/si>/g),
  ].map((match) => decodeXml(match[1]));
}

function createXlsx(rows) {
  const normalizedRows = normalizeRows(rows);
  const headers = [
    ...new Set(normalizedRows.flatMap((row) => Object.keys(row))),
  ];
  const table = [
    headers,
    ...normalizedRows.map((row) => headers.map((header) => row[header] ?? "")),
  ];
  const sheetRows = table
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map((value, columnIndexValue) => {
            const cell = `${columnName(columnIndexValue)}${rowIndex + 1}`;
            return `<c r="${cell}" t="inlineStr"><is><t>${escapeHtml(String(value))}</t></is></c>`;
          })
          .join("")}</row>`,
    )
    .join("");
  return zipBlobFromEntries(
    [
      [
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ],
      [
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ],
      [
        "xl/workbook.xml",
        `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ],
      [
        "xl/_rels/workbook.xml.rels",
        `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ],
      [
        "xl/worksheets/sheet1.xml",
        `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
      ],
    ],
    mimeForExtension("xlsx"),
  );
}

function columnIndex(name) {
  return (
    [...name].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) -
    1
  );
}

function columnName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - remainder) / 26);
  }
  return name;
}

function parseDelimited(text, delimiter) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => splitDelimitedLine(line, delimiter));
  const headers = rows.shift() || [];
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header, row[index] || ""]),
    ),
  );
}

function splitDelimitedLine(line, delimiter) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function arrayToDelimited(rows, delimiter) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map((value) => escapeDelimited(value, delimiter)).join(delimiter),
    ...rows.map((row) =>
      headers
        .map((header) => escapeDelimited(row[header] ?? "", delimiter))
        .join(delimiter),
    ),
  ].join("\n");
}

function escapeDelimited(value, delimiter) {
  const text = String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function normalizeRows(value) {
  if (Array.isArray(value))
    return value.map((item) =>
      typeof item === "object" && item ? item : { value: item },
    );
  if (typeof value === "object" && value) return [value];
  return [{ value }];
}

function parseSimpleYaml(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:#]+):\s*(.*)\s*$/);
    if (match) result[match[1].trim()] = parseScalar(match[2].trim());
  }
  return result;
}

function objectToYaml(value) {
  if (Array.isArray(value))
    return value.map((item) => `- ${JSON.stringify(item)}`).join("\n");
  return Object.entries(value || {})
    .map(([key, item]) => `${key}: ${formatYamlScalar(item)}`)
    .join("\n");
}

function formatYamlScalar(value) {
  return typeof value === "object" && value !== null
    ? JSON.stringify(value)
    : String(value);
}

function parseScalar(value) {
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value.replace(/^["']|["']$/g, "");
}

function xmlToObject(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) throw new Error("That XML file could not be read.");
  return elementToObject(doc.documentElement);
}

function elementToObject(element) {
  const children = [...element.children];
  if (!children.length)
    return { [element.nodeName]: element.textContent.trim() };
  return {
    [element.nodeName]: Object.assign({}, ...children.map(elementToObject)),
  };
}

function objectToXml(value) {
  const [root, content] = Object.entries(value || { root: "" })[0];
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(root || "root", content)}\n`;
}

function xmlNode(name, value) {
  if (Array.isArray(value))
    return value.map((item) => xmlNode(name, item)).join("");
  if (typeof value === "object" && value !== null) {
    return `<${name}>${Object.entries(value)
      .map(([key, item]) => xmlNode(key, item))
      .join("")}</${name}>`;
  }
  return `<${name}>${escapeHtml(String(value ?? ""))}</${name}>`;
}

function parseKeyValueLines(text, ignoredPattern) {
  return text
    .split(/\r?\n/)
    .filter((line) => line && !ignoredPattern.test(line))
    .map((line) => {
      const [rawKey, ...rest] = line.split(":");
      return { key: rawKey.split(";")[0], value: rest.join(":") };
    });
}

function parseEnv(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    result[key.trim()] = rest.join("=").trim();
  }
  return result;
}

function parseConfigText(text, ext) {
  if (ext === "json") return JSON.parse(text);
  if (["yaml", "yml"].includes(ext)) return parseSimpleYaml(text);
  if (ext === "toml") return parseToml(text);
  if (ext === "ini") return parseIni(text);
  if (ext === "properties") return parseProperties(text);
  if (ext === "plist") return parsePlist(text);
  throw new Error("That config file could not be read.");
}

function serializeConfig(value, ext) {
  if (ext === "json") return `${JSON.stringify(value, null, 2)}\n`;
  if (ext === "yaml") return objectToYaml(value);
  if (ext === "toml") return objectToToml(value);
  if (ext === "ini") return objectToIni(value);
  if (ext === "xml") return objectToXml(value);
  throw new Error("That config output is not available for this file.");
}

async function officeToText(file) {
  const ext = extension(file.name);
  if (ext === "pptx") {
    const entries = await unzipEntries(file);
    return [...entries]
      .filter(([name]) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .map(([, bytes]) => xmlToPlainText(new TextDecoder().decode(bytes)))
      .join("\n\n");
  }
  if (["odt", "odp"].includes(ext)) {
    const entries = await unzipEntries(file);
    const content = entries.get("content.xml");
    if (!content) throw new Error("That office file could not be read.");
    return htmlToText(
      new TextDecoder()
        .decode(content)
        .replace(/<text:p/g, "<p")
        .replace(/<\/text:p>/g, "</p>"),
    );
  }
  return file.text();
}

async function parseOds(file) {
  const entries = await unzipEntries(file);
  const content = entries.get("content.xml");
  if (!content) throw new Error("That spreadsheet could not be read.");
  const xml = new TextDecoder().decode(content);
  const rows = [
    ...xml.matchAll(/<table:table-row[\s\S]*?>([\s\S]*?)<\/table:table-row>/g),
  ].map((row) =>
    [...row[1].matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((cell) =>
      decodeXml(cell[1].replace(/<[^>]+>/g, "")),
    ),
  );
  const headers = rows.shift() || [];
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header || `column${index + 1}`,
        row[index] || "",
      ]),
    ),
  );
}

function parseEml(text) {
  const [rawHeaders, ...bodyParts] = text.split(/\r?\n\r?\n/);
  const headers = Object.fromEntries(
    rawHeaders.split(/\r?\n/).map((line) => {
      const [key, ...rest] = line.split(":");
      return [key.toLowerCase(), rest.join(":").trim()];
    }),
  );
  const body = bodyParts.join("\n\n").trim();
  return {
    subject: headers.subject || "",
    from: headers.from || "",
    to: headers.to || "",
    body,
    html: /<html|<body|<p[>\s]/i.test(body) ? body : "",
  };
}

function certificateSummary(filename, text, bytes) {
  return `${filename}\nSize: ${bytes.length} bytes\nFormat: ${text.includes("-----BEGIN") ? "PEM" : "DER"}\n`;
}

function pemToDer(text) {
  const base64 = text.replace(
    /-----BEGIN [^-]+-----|-----END [^-]+-----|\s/g,
    "",
  );
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function derToPem(bytes, label) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g).join("\n")}\n-----END ${label}-----\n`;
}

function parsePlaylist(text, ext) {
  if (["m3u", "m3u8"].includes(ext)) {
    return text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line, index) => ({ index: index + 1, path: line }));
  }
  if (ext === "pls") {
    const result = [];
    for (const match of text.matchAll(/^File(\d+)=(.*)$/gim))
      result.push({ index: Number(match[1]), path: match[2] });
    return result;
  }
  if (ext === "cue") {
    return [...text.matchAll(/TRACK\s+(\d+)[\s\S]*?TITLE\s+"([^"]+)"/g)].map(
      (match) => ({ index: Number(match[1]), title: match[2] }),
    );
  }
  return [];
}

async function parsePalette(file) {
  const ext = extension(file.name);
  if (ext === "gpl") {
    return (await file.text())
      .split(/\r?\n/)
      .map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s*(.*)$/))
      .filter(Boolean)
      .map((match) =>
        rgbColor(match[1], match[2], match[3], match[4] || "Color"),
      );
  }
  if (ext === "ase") return parseAse(new Uint8Array(await file.arrayBuffer()));
  const canvas = await imageFileToCanvas(file);
  const data = canvas
    .getContext("2d")
    .getImageData(
      0,
      0,
      Math.min(canvas.width, 8),
      Math.min(canvas.height, 8),
    ).data;
  const seen = new Map();
  for (let index = 0; index < data.length && seen.size < 8; index += 4) {
    const color = rgbColor(
      data[index],
      data[index + 1],
      data[index + 2],
      `Color ${seen.size + 1}`,
    );
    seen.set(color.hex, color);
  }
  return [...seen.values()];
}

function parseAse(bytes) {
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== "ASEF")
    throw new Error("That ASE file could not be read.");
  let offset = 12;
  const colors = [];
  while (offset + 6 < bytes.length) {
    const type = readUint16BE(bytes, offset);
    const length = readUint32BE(bytes, offset + 2);
    offset += 6;
    if (type === 1) {
      const nameLength = readUint16BE(bytes, offset);
      const name = new TextDecoder("utf-16be").decode(
        bytes.slice(offset + 2, offset + 2 + (nameLength - 1) * 2),
      );
      const modelOffset = offset + 2 + nameLength * 2;
      const model = new TextDecoder().decode(
        bytes.slice(modelOffset, modelOffset + 4),
      );
      if (model === "RGB ") {
        colors.push(
          rgbColor(
            bytes[modelOffset + 4] * 255,
            bytes[modelOffset + 8] * 255,
            bytes[modelOffset + 12] * 255,
            name,
          ),
        );
      }
    }
    offset += length;
  }
  return colors.length ? colors : [rgbColor(0, 0, 0, "Color")];
}

function rgbColor(r, g, b, name) {
  const values = [r, g, b].map((value) =>
    Math.max(0, Math.min(255, Math.round(Number(value)))),
  );
  return {
    name: String(name).trim(),
    hex: `#${values.map((value) => value.toString(16).padStart(2, "0")).join("")}`,
    r: values[0],
    g: values[1],
    b: values[2],
  };
}

function parseWorkout(text, ext) {
  if (ext === "tcx") {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    return [...doc.querySelectorAll("Trackpoint")].map((point, index) => ({
      name: `Point ${index + 1}`,
      latitude: Number(
        point.querySelector("LatitudeDegrees")?.textContent || 0,
      ),
      longitude: Number(
        point.querySelector("LongitudeDegrees")?.textContent || 0,
      ),
    }));
  }
  if (ext === "nmea") {
    return text
      .split(/\r?\n/)
      .filter((line) => line.includes("GPRMC"))
      .map((line, index) => nmeaPoint(line, index + 1))
      .filter(Boolean);
  }
  return [];
}

function nmeaPoint(line, index) {
  const parts = line.split(",");
  if (parts.length < 7) return null;
  return {
    name: `Point ${index}`,
    latitude: nmeaCoord(parts[3], parts[4]),
    longitude: nmeaCoord(parts[5], parts[6]),
  };
}

function nmeaCoord(value, direction) {
  const raw = Number(value);
  const degrees = Math.floor(raw / 100);
  const minutes = raw - degrees * 100;
  const result = degrees + minutes / 60;
  return ["S", "W"].includes(direction) ? -result : result;
}

function parseProperties(text) {
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || /^[#!]/.test(line)) continue;
    const [key, ...rest] = line.split(/[=:]/);
    result[key.trim()] = rest.join("=").trim();
  }
  return result;
}

function parsePlist(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const dict = doc.querySelector("dict");
  const result = {};
  if (!dict) return result;
  const children = [...dict.children];
  for (let index = 0; index < children.length; index += 2) {
    result[children[index].textContent] =
      children[index + 1]?.textContent || "";
  }
  return result;
}

function parseToml(text) {
  const result = {};
  let target = result;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const section = line.match(/^\[([^\]]+)\]$/);
    if (section) {
      target = result[section[1]] ||= {};
      continue;
    }
    const match = line.match(/^([^=]+)=\s*(.*)$/);
    if (match) target[match[1].trim()] = parseScalar(match[2].trim());
  }
  return result;
}

function parseIni(text) {
  const result = {};
  let target = result;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[;#].*/, "").trim();
    if (!line) continue;
    const section = line.match(/^\[([^\]]+)\]$/);
    if (section) {
      target = result[section[1]] ||= {};
      continue;
    }
    const match = line.match(/^([^=]+)=\s*(.*)$/);
    if (match) target[match[1].trim()] = parseScalar(match[2].trim());
  }
  return result;
}

function objectToToml(value) {
  const lines = [];
  for (const [key, item] of Object.entries(value || {})) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      lines.push(`[${key}]`);
      lines.push(
        ...Object.entries(item).map(
          ([childKey, childValue]) => `${childKey} = ${tomlValue(childValue)}`,
        ),
      );
    } else {
      lines.push(`${key} = ${tomlValue(item)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function objectToIni(value) {
  const lines = [];
  for (const [key, item] of Object.entries(value || {})) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      lines.push(`[${key}]`);
      lines.push(
        ...Object.entries(item).map(
          ([childKey, childValue]) => `${childKey}=${childValue}`,
        ),
      );
    } else {
      lines.push(`${key}=${item}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function tomlValue(value) {
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function parseSubtitleText(text, ext) {
  return ext === "vtt" ? parseVtt(text) : parseSrt(text);
}

function parseSrt(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((block, index) => {
      const lines = block.trim().split(/\r?\n/);
      if (/^\d+$/.test(lines[0])) lines.shift();
      const timing = lines.shift() || "";
      const [start = "00:00:00,000", end = "00:00:00,000"] =
        timing.split(/\s+-->\s+/);
      return {
        index: index + 1,
        start: start.trim(),
        end: end.trim(),
        text: lines.join("\n"),
      };
    })
    .filter((cue) => cue.text);
}

function parseVtt(text) {
  return text
    .replace(/^WEBVTT[^\n]*\n+/i, "")
    .trim()
    .split(/\n\s*\n/)
    .map((block, index) => {
      const lines = block.trim().split(/\r?\n/);
      if (!lines[0]?.includes("-->")) lines.shift();
      const timing = lines.shift() || "";
      const [start = "00:00:00.000", end = "00:00:00.000"] =
        timing.split(/\s+-->\s+/);
      return {
        index: index + 1,
        start: start.trim(),
        end: end.trim(),
        text: lines.join("\n"),
      };
    })
    .filter((cue) => cue.text);
}

function cuesToSrt(cues) {
  return `${cues.map((cue, index) => `${index + 1}\n${subtitleTime(cue.start, ",")} --> ${subtitleTime(cue.end, ",")}\n${cue.text}`).join("\n\n")}\n`;
}

function cuesToVtt(cues) {
  return `WEBVTT\n\n${cues.map((cue) => `${subtitleTime(cue.start, ".")} --> ${subtitleTime(cue.end, ".")}\n${cue.text}`).join("\n\n")}\n`;
}

function subtitleTime(value, separator) {
  return value.replace(/[,.](\d{1,3})/, `${separator}$1`.padEnd(4, "0"));
}

function parseGeoText(text, ext) {
  if (ext === "geojson") return geoJsonToFeatures(JSON.parse(text));
  if (ext === "kml") return kmlToFeatures(text);
  if (ext === "gpx") return gpxToFeatures(text);
  throw new Error("That map file could not be read.");
}

function geoJsonToFeatures(value) {
  const features =
    value.type === "FeatureCollection"
      ? value.features
      : value.type === "Feature"
        ? [value]
        : [{ type: "Feature", properties: {}, geometry: value }];
  return features.map((feature) => ({
    name: feature.properties?.name || "Point",
    coordinates: feature.geometry?.coordinates || [0, 0],
  }));
}

function kmlToFeatures(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("Placemark")].map((placemark) => ({
    name: placemark.querySelector("name")?.textContent || "Point",
    coordinates: parseCoordinateText(
      placemark.querySelector("coordinates")?.textContent || "0,0",
    ),
  }));
}

function gpxToFeatures(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  return [...doc.querySelectorAll("wpt,trkpt,rtept")].map((point, index) => ({
    name: point.querySelector("name")?.textContent || `Point ${index + 1}`,
    coordinates: [
      Number(point.getAttribute("lon") || 0),
      Number(point.getAttribute("lat") || 0),
    ],
  }));
}

function parseCoordinateText(text) {
  const [lon = 0, lat = 0] = text.trim().split(/\s+/)[0].split(",").map(Number);
  return [lon, lat];
}

function geoToGeoJson(features) {
  return `${JSON.stringify(
    {
      type: "FeatureCollection",
      features: features.map((feature) => ({
        type: "Feature",
        properties: { name: feature.name },
        geometry: { type: "Point", coordinates: feature.coordinates },
      })),
    },
    null,
    2,
  )}\n`;
}

function geoToKml(features) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${features.map((feature) => `<Placemark><name>${escapeHtml(feature.name)}</name><Point><coordinates>${feature.coordinates[0]},${feature.coordinates[1]},0</coordinates></Point></Placemark>`).join("")}</Document></kml>\n`;
}

function geoToGpx(features) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="convertitbaby.com">${features.map((feature) => `<wpt lat="${feature.coordinates[1]}" lon="${feature.coordinates[0]}"><name>${escapeHtml(feature.name)}</name></wpt>`).join("")}</gpx>\n`;
}

function geoToCsv(features) {
  return arrayToDelimited(
    features.map((feature) => ({
      name: feature.name,
      longitude: feature.coordinates[0],
      latitude: feature.coordinates[1],
    })),
    ",",
  );
}

function textToHtml(text) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Converted document</title></head><body>${escapeHtml(
    text,
  )
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("")}</body></html>`;
}

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent.replace(/\s+\n/g, "\n").trim();
}

function xmlToPlainText(xml) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

async function textToPdfDownload(text, filename) {
  const { PDFDocument, StandardFonts } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const margin = 48;
  const lineHeight = 16;
  let page = pdf.addPage([612, 792]);
  let y = page.getHeight() - margin;
  for (const line of wrapText(text, 86)) {
    if (y < margin) {
      page = pdf.addPage([612, 792]);
      y = page.getHeight() - margin;
    }
    page.drawText(line || " ", { x: margin, y, size: fontSize, font });
    y -= lineHeight;
  }
  return {
    blob: new Blob([await pdf.save()], { type: "application/pdf" }),
    filename,
    mimeType: "application/pdf",
  };
}

function wrapText(text, width) {
  return text.split(/\r?\n/).flatMap((line) => {
    const chunks = [];
    let current = "";
    for (const word of line.split(/\s+/)) {
      if ((current + " " + word).trim().length > width) {
        chunks.push(current);
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    }
    chunks.push(current);
    return chunks;
  });
}

function minifyCode(text, ext) {
  if (ext === "json") return JSON.stringify(JSON.parse(text));
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .trim();
}

function prettyCode(text, ext) {
  if (ext === "json") return `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
  if (["html", "xml"].includes(ext)) return text.replace(/></g, ">\n<");
  return text
    .replace(/([{};])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
