import { canGzip } from "./lib/archive.js";
import { extension } from "./lib/utils.js";

export const OUTPUTS = {
  heic: [
    { label: "JPG", value: "image/jpeg", kind: "image" },
    { label: "PNG", value: "image/png", kind: "image" },
    { label: "WebP", value: "image/webp", kind: "image" },
  ],
  image: [
    { label: "JPG", value: "image/jpeg", kind: "image" },
    { label: "PNG", value: "image/png", kind: "image" },
    { label: "WebP", value: "image/webp", kind: "image" },
    { label: "AVIF", value: "image/avif", kind: "image" },
    { label: "ICO", value: "ico", kind: "image-ico" },
    { label: "PDF", value: "pdf", kind: "image-pdf" },
  ],
  gif: [
    { label: "WebM video", value: "webm", kind: "gif-video" },
    { label: "MP4 video", value: "mp4", kind: "gif-video" },
    { label: "JPG still", value: "image/jpeg", kind: "image" },
    { label: "PNG still", value: "image/png", kind: "image" },
  ],
  pdf: [
    { label: "Compressed PDF", value: "compressed-pdf", kind: "pdf-compress" },
    { label: "PNG images", value: "png", kind: "pdf-png" },
  ],
  video: [
    { label: "GIF", value: "gif", kind: "video-gif" },
    { label: "WebM", value: "webm", kind: "media" },
    { label: "MP4", value: "mp4", kind: "media" },
    { label: "MOV", value: "mov", kind: "media" },
    { label: "MKV", value: "mkv", kind: "media" },
    { label: "MP3", value: "mp3", kind: "media" },
    { label: "WAV", value: "wav", kind: "media" },
    { label: "AAC", value: "aac", kind: "media" },
    { label: "FLAC", value: "flac", kind: "media" },
  ],
  audio: [
    { label: "MP3", value: "mp3", kind: "media" },
    { label: "WAV", value: "wav", kind: "media" },
    { label: "AAC", value: "aac", kind: "media" },
    { label: "FLAC", value: "flac", kind: "media" },
    { label: "Ogg", value: "ogg", kind: "media" },
  ],
  midi: [{ label: "MP3", value: "mp3", kind: "midi" }],
  archive: [
    { label: "ZIP archive", value: "zip", kind: "archive" },
    { label: "TAR archive", value: "tar", kind: "archive" },
    { label: "TGZ archive", value: "tgz", kind: "archive" },
    { label: "GZIP file", value: "gz", kind: "archive" },
    {
      label: "7Z archive",
      value: "7z",
      kind: "archive",
      requiresNativeEncoder: true,
    },
    {
      label: "RAR archive",
      value: "rar",
      kind: "archive",
      requiresNativeEncoder: true,
    },
    {
      label: "BZIP2 file",
      value: "bz2",
      kind: "archive",
      requiresNativeEncoder: true,
    },
    {
      label: "XZ file",
      value: "xz",
      kind: "archive",
      requiresNativeEncoder: true,
    },
    {
      label: "Zstandard file",
      value: "zst",
      kind: "archive",
      requiresNativeEncoder: true,
    },
    {
      label: "Brotli file",
      value: "br",
      kind: "archive",
      requiresNativeEncoder: true,
    },
  ],
  document: [
    { label: "PDF", value: "pdf", kind: "document" },
    { label: "HTML", value: "html", kind: "document" },
    { label: "TXT", value: "txt", kind: "document" },
  ],
  office: [
    { label: "PDF", value: "pdf", kind: "office" },
    { label: "HTML", value: "html", kind: "office" },
    { label: "TXT", value: "txt", kind: "office" },
    { label: "CSV", value: "csv", kind: "office" },
    { label: "JSON", value: "json", kind: "office" },
  ],
  data: [
    { label: "JSON", value: "json", kind: "data" },
    { label: "YAML", value: "yaml", kind: "data" },
    { label: "CSV", value: "csv", kind: "data" },
    { label: "TSV", value: "tsv", kind: "data" },
    { label: "XML", value: "xml", kind: "data" },
    { label: "XLSX", value: "xlsx", kind: "data" },
  ],
  config: [
    { label: "JSON", value: "json", kind: "config" },
    { label: "YAML", value: "yaml", kind: "config" },
    { label: "TOML", value: "toml", kind: "config" },
    { label: "INI", value: "ini", kind: "config" },
    { label: "XML", value: "xml", kind: "config" },
  ],
  email: [
    { label: "TXT", value: "txt", kind: "email" },
    { label: "HTML", value: "html", kind: "email" },
    { label: "PDF", value: "pdf", kind: "email" },
    { label: "MSG", value: "msg", kind: "email", requiresNativeEncoder: true },
  ],
  certificate: [
    { label: "PEM", value: "pem", kind: "certificate" },
    { label: "DER", value: "der", kind: "certificate" },
    { label: "TXT", value: "txt", kind: "certificate" },
  ],
  playlist: [
    { label: "JSON", value: "json", kind: "playlist" },
    { label: "TXT", value: "txt", kind: "playlist" },
    { label: "CSV", value: "csv", kind: "playlist" },
  ],
  palette: [
    { label: "JSON", value: "json", kind: "palette" },
    { label: "CSS", value: "css", kind: "palette" },
  ],
  workout: [
    { label: "GPX", value: "gpx", kind: "workout" },
    { label: "CSV", value: "csv", kind: "workout" },
    {
      label: "FIT",
      value: "fit",
      kind: "workout",
      requiresNativeEncoder: true,
    },
  ],
  subtitle: [
    { label: "SRT", value: "srt", kind: "subtitle" },
    { label: "VTT", value: "vtt", kind: "subtitle" },
    { label: "TXT", value: "txt", kind: "subtitle" },
  ],
  geo: [
    { label: "GeoJSON", value: "geojson", kind: "geo" },
    { label: "KML", value: "kml", kind: "geo" },
    { label: "GPX", value: "gpx", kind: "geo" },
    { label: "CSV", value: "csv", kind: "geo" },
  ],
  ebook: [
    { label: "HTML", value: "html", kind: "ebook" },
    { label: "TXT", value: "txt", kind: "ebook" },
    { label: "PDF", value: "pdf", kind: "ebook" },
    {
      label: "MOBI",
      value: "mobi",
      kind: "ebook",
      requiresNativeEncoder: true,
    },
    {
      label: "AZW3",
      value: "azw3",
      kind: "ebook",
      requiresNativeEncoder: true,
    },
  ],
  vector: [
    { label: "PNG", value: "png", kind: "svg-raster" },
    { label: "WebP", value: "webp", kind: "svg-raster" },
    { label: "PDF", value: "pdf", kind: "svg-pdf" },
  ],
  font: [
    { label: "TTF", value: "ttf", kind: "font", requiresNativeEncoder: true },
    { label: "OTF", value: "otf", kind: "font", requiresNativeEncoder: true },
    { label: "WOFF", value: "woff", kind: "font", requiresNativeEncoder: true },
    {
      label: "WOFF2",
      value: "woff2",
      kind: "font",
      requiresNativeEncoder: true,
    },
  ],
  model3d: [
    { label: "OBJ", value: "obj", kind: "model3d" },
    { label: "STL", value: "stl", kind: "model3d" },
    { label: "GLTF", value: "gltf", kind: "model3d" },
    { label: "GLB", value: "glb", kind: "model3d" },
  ],
  code: [
    { label: "Pretty", value: "pretty", kind: "code" },
    { label: "Minified", value: "min", kind: "code" },
  ],
  rawImage: [{ label: "Original", value: "original", kind: "copy" }],
  unknown: [],
};

export function getSelectedOutput(item) {
  const output = getOutputOptions(item).find(
    (candidate) => candidate.value === item.output,
  );
  return output?.disabled ? null : output;
}

export function getOutputOptions(item) {
  return (OUTPUTS[item.kind] || []).map((output) => {
    const disabledReason = getDisabledReason(output, item);
    return {
      ...output,
      disabled: Boolean(disabledReason),
      disabledReason,
    };
  });
}

function getDisabledReason(output, item) {
  const ext = extension(item.file.name);
  if (
    output.kind === "image" &&
    output.value === "image/avif" &&
    !canCreateImageMime("image/avif")
  ) {
    return "AVIF is not available for this file.";
  }

  if (
    output.kind === "office" &&
    ["ods", "xlsx"].includes(ext) &&
    !["csv", "json"].includes(output.value)
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (
    output.kind === "office" &&
    !["ods", "xlsx"].includes(ext) &&
    ["csv", "json"].includes(output.value)
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "email" && ext === "msg" && output.value !== "msg") {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "email" && ext !== "msg" && output.value === "msg") {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "workout" && ext === "fit" && output.value !== "fit") {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "workout" && ext !== "fit" && output.value === "fit") {
    return `${output.label} is not available for this file.`;
  }

  if (
    ["font", "ebook"].includes(output.kind) &&
    output.requiresNativeEncoder &&
    extension(item.file.name) !== output.value
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (
    output.kind === "ebook" &&
    ["mobi", "azw3"].includes(extension(item.file.name)) &&
    output.value !== extension(item.file.name)
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (
    output.kind === "model3d" &&
    !canConvertModelByExtension(item.file, output.value)
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (
    output.kind === "svg-raster" &&
    !["svg"].includes(extension(item.file.name))
  ) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "archive") {
    if (output.requiresNativeEncoder) {
      return `${output.label} is not available for this file.`;
    }
    if (["gz", "tgz"].includes(output.value) && !canGzip()) {
      return "GZIP is not available for this file.";
    }
  }

  if (output.kind === "gif-video" && !pickVideoRecorderMime(output.value)) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "video-gif" && !canPlayVideoFile(item.file)) {
    return "That video file could not be read.";
  }

  if (
    output.kind === "media" &&
    !canConvertMediaByExtension(item.file, output.value)
  ) {
    return `${output.label} is not available for this file.`;
  }

  return "";
}

function canConvertModelByExtension(file, outputValue) {
  const ext = extension(file.name);
  if (ext === outputValue) return true;
  if (ext === "obj") return outputValue === "stl";
  if (ext === "stl") return outputValue === "obj";
  if (ext === "gltf") return outputValue === "glb";
  if (ext === "glb") return outputValue === "gltf";
  return false;
}

function canConvertMediaByExtension(file, outputValue) {
  const ext = extension(file.name);
  if (ext === outputValue) return true;
  if (ext === "ts") return false;
  if (["mp4", "mov", "mkv", "webm"].includes(ext))
    return ["mp4", "mov", "mkv", "webm", "mp3", "aac"].includes(outputValue);
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext))
    return ["mp3", "wav"].includes(outputValue);
  return false;
}

function canPlayVideoFile(file) {
  const video = document.createElement("video");
  const candidates = [
    file.type,
    mimeFromExtension(extension(file.name)),
  ].filter(Boolean);
  if (!candidates.length) return true;
  return candidates.some((mime) => Boolean(video.canPlayType(mime)));
}

function mimeFromExtension(ext) {
  return (
    {
      mp4: "video/mp4",
      mov: "video/quicktime",
      m4v: "video/mp4",
      webm: "video/webm",
      mkv: "video/x-matroska",
      ts: "video/mp2t",
    }[ext] || ""
  );
}

export function mimeForExtension(ext) {
  return (
    {
      zip: "application/zip",
      rar: "application/vnd.rar",
      "7z": "application/x-7z-compressed",
      gz: "application/gzip",
      gzip: "application/gzip",
      tgz: "application/gzip",
      tar: "application/x-tar",
      bz2: "application/x-bzip2",
      xz: "application/x-xz",
      zst: "application/zstd",
      br: "application/x-brotli",
      lz: "application/x-lzip",
      lzma: "application/x-lzma",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      md: "text/markdown",
      markdown: "text/markdown",
      html: "text/html",
      htm: "text/html",
      epub: "application/epub+zip",
      mobi: "application/x-mobipocket-ebook",
      azw3: "application/vnd.amazon.ebook",
      json: "application/json",
      yaml: "application/yaml",
      yml: "application/yaml",
      toml: "application/toml",
      ini: "text/plain",
      properties: "text/plain",
      plist: "application/x-plist",
      csv: "text/csv",
      tsv: "text/tab-separated-values",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xml: "application/xml",
      vcf: "text/vcard",
      ics: "text/calendar",
      srt: "application/x-subrip",
      vtt: "text/vtt",
      geojson: "application/geo+json",
      kml: "application/vnd.google-earth.kml+xml",
      gpx: "application/gpx+xml",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odt: "application/vnd.oasis.opendocument.text",
      odp: "application/vnd.oasis.opendocument.presentation",
      eml: "message/rfc822",
      msg: "application/vnd.ms-outlook",
      pem: "application/x-pem-file",
      der: "application/pkix-cert",
      crt: "application/x-x509-ca-cert",
      cer: "application/pkix-cert",
      m3u: "audio/x-mpegurl",
      m3u8: "application/vnd.apple.mpegurl",
      pls: "audio/x-scpls",
      cue: "application/x-cue",
      gpl: "text/plain",
      ase: "application/octet-stream",
      tcx: "application/xml",
      nmea: "text/plain",
      fit: "application/octet-stream",
      jxl: "image/jxl",
      psd: "image/vnd.adobe.photoshop",
      dng: "image/x-adobe-dng",
      cr2: "image/x-canon-cr2",
      nef: "image/x-nikon-nef",
      arw: "image/x-sony-arw",
      env: "text/plain",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      avif: "image/avif",
      bmp: "image/bmp",
      tif: "image/tiff",
      tiff: "image/tiff",
      ttf: "font/ttf",
      otf: "font/otf",
      woff: "font/woff",
      woff2: "font/woff2",
      obj: "model/obj",
      stl: "model/stl",
      gltf: "model/gltf+json",
      glb: "model/gltf-binary",
      css: "text/css",
      js: "text/javascript",
      sql: "application/sql",
      graphql: "application/graphql",
      proto: "text/plain",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      aac: "audio/aac",
      flac: "audio/flac",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      mid: "audio/midi",
      midi: "audio/midi",
      mp4: "video/mp4",
      mov: "video/quicktime",
      mkv: "video/x-matroska",
      webm: "video/webm",
      ts: "video/mp2t",
    }[ext] || "application/octet-stream"
  );
}

export function inferFileKind(file) {
  const ext = extension(file.name);
  if (["jxl", "psd", "dng", "cr2", "nef", "arw"].includes(ext))
    return "rawImage";
  if (file.name.includes(".palette.") || ["gpl", "ase"].includes(ext))
    return "palette";
  if (["pptx", "ods", "odt", "odp"].includes(ext)) return "office";
  if (["eml", "msg"].includes(ext)) return "email";
  if (["pem", "der", "crt", "cer"].includes(ext)) return "certificate";
  if (["m3u", "m3u8", "pls", "cue"].includes(ext)) return "playlist";
  if (["fit", "tcx", "nmea"].includes(ext)) return "workout";
  if (["srt", "vtt"].includes(ext)) return "subtitle";
  if (["geojson", "kml", "gpx"].includes(ext)) return "geo";
  if (["toml", "ini", "properties", "plist"].includes(ext)) return "config";
  if (
    [
      "json",
      "yaml",
      "yml",
      "csv",
      "tsv",
      "xml",
      "vcf",
      "ics",
      "env",
      "xlsx",
    ].includes(ext)
  )
    return "data";
  if (["docx", "txt", "md", "markdown", "html", "htm"].includes(ext))
    return "document";
  if (["epub", "mobi", "azw3"].includes(ext)) return "ebook";
  if (ext === "svg") return "vector";
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) return "font";
  if (["obj", "stl", "gltf", "glb"].includes(ext)) return "model3d";
  if (["css", "js", "sql", "graphql", "proto"].includes(ext)) return "code";
  if (isArchiveExtension(ext)) return "archive";
  if (isArchiveMime(file.type)) return "archive";
  if (["heic", "heif"].includes(ext) || /hei[cf]/i.test(file.type))
    return "heic";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (ext === "gif" || file.type === "image/gif") return "gif";
  if (
    file.type.startsWith("image/") ||
    ["ico", "avif", "bmp", "tif", "tiff"].includes(ext)
  )
    return "image";
  if (ext === "mp4" || file.type === "video/mp4") return "video";
  if (
    file.type.startsWith("video/") ||
    ["mov", "mkv", "webm", "ts"].includes(ext)
  )
    return "video";
  if (["mid", "midi"].includes(ext) || /midi/i.test(file.type))
    return "midi";
  if (
    file.type.startsWith("audio/") ||
    ["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)
  )
    return "audio";
  return "unknown";
}

export function fileKindLabel(kind) {
  return (
    {
      archive: "Archive",
      document: "Document",
      office: "Office",
      data: "Data",
      config: "Config",
      email: "Email",
      certificate: "Certificate",
      playlist: "Playlist",
      palette: "Palette",
      workout: "Workout",
      rawImage: "Specialized image",
      subtitle: "Subtitles",
      geo: "Map data",
      ebook: "Ebook",
      vector: "Vector",
      font: "Font",
      model3d: "3D model",
      code: "Code",
      heic: "HEIC image",
      image: "Image",
      gif: "GIF",
      pdf: "PDF",
      video: "Video",
      audio: "Audio",
      midi: "MIDI",
      unknown: "Unsupported",
    }[kind] || "File"
  );
}

function isArchiveExtension(ext) {
  return [
    "zip",
    "rar",
    "7z",
    "gz",
    "gzip",
    "tgz",
    "tar",
    "bz2",
    "xz",
    "zst",
    "br",
    "lz",
    "lzma",
  ].includes(ext);
}

function isArchiveMime(type) {
  return [
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.rar",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-gzip",
    "application/x-tar",
    "application/x-bzip2",
    "application/x-xz",
    "application/zstd",
    "application/x-brotli",
    "application/x-lzip",
    "application/x-lzma",
  ].includes(type);
}

function canCreateImageMime(mime) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(mime).startsWith(`data:${mime}`);
}

export function pickVideoRecorderMime(outputFormat) {
  const candidates =
    outputFormat === "mp4"
      ? [
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4;codecs=h264",
          "video/mp4",
        ]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}
