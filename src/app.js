const state = {
  items: [],
  urls: []
};

const fileInput = document.querySelector("#file-input");
const dropzone = document.querySelector(".dropzone");
const queuePanel = document.querySelector(".queue-panel");
const queueEl = document.querySelector(".file-queue");
const emptyQueueEl = document.querySelector(".empty-queue");
const goButton = document.querySelector("#go-button");
const clearButton = document.querySelector("#clear-button");
const downloadAllButton = document.querySelector("#download-all-button");
const statusEl = document.querySelector(".status");
const progressEl = document.querySelector(".progress");
const progressBar = document.querySelector(".progress-bar");
const crcTable = createCrcTable();
const lazyModules = {};
let mp3EncoderCtorPromise;

const OUTPUTS = {
  heic: [
    { label: "JPG", value: "image/jpeg", kind: "image" },
    { label: "PNG", value: "image/png", kind: "image" },
    { label: "WebP", value: "image/webp", kind: "image" }
  ],
  image: [
    { label: "JPG", value: "image/jpeg", kind: "image" },
    { label: "PNG", value: "image/png", kind: "image" },
    { label: "WebP", value: "image/webp", kind: "image" },
    { label: "ICO", value: "ico", kind: "image-ico" },
    { label: "PDF", value: "pdf", kind: "image-pdf" }
  ],
  gif: [
    { label: "WebM video", value: "webm", kind: "gif-video" },
    { label: "MP4 video", value: "mp4", kind: "gif-video" },
    { label: "JPG still", value: "image/jpeg", kind: "image" },
    { label: "PNG still", value: "image/png", kind: "image" }
  ],
  pdf: [
    { label: "PNG images", value: "png", kind: "pdf-png" }
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
    { label: "FLAC", value: "flac", kind: "media" }
  ],
  audio: [
    { label: "MP3", value: "mp3", kind: "media" },
    { label: "WAV", value: "wav", kind: "media" },
    { label: "AAC", value: "aac", kind: "media" },
    { label: "FLAC", value: "flac", kind: "media" },
    { label: "Ogg", value: "ogg", kind: "media" }
  ],
  archive: [
    { label: "ZIP archive", value: "zip", kind: "archive" },
    { label: "TAR archive", value: "tar", kind: "archive" },
    { label: "TGZ archive", value: "tgz", kind: "archive" },
    { label: "GZIP file", value: "gz", kind: "archive" },
    { label: "7Z archive", value: "7z", kind: "archive", requiresNativeEncoder: true },
    { label: "RAR archive", value: "rar", kind: "archive", requiresNativeEncoder: true },
    { label: "BZIP2 file", value: "bz2", kind: "archive", requiresNativeEncoder: true },
    { label: "XZ file", value: "xz", kind: "archive", requiresNativeEncoder: true },
    { label: "Zstandard file", value: "zst", kind: "archive", requiresNativeEncoder: true },
    { label: "Brotli file", value: "br", kind: "archive", requiresNativeEncoder: true }
  ],
  document: [
    { label: "PDF", value: "pdf", kind: "document" },
    { label: "HTML", value: "html", kind: "document" },
    { label: "TXT", value: "txt", kind: "document" }
  ],
  data: [
    { label: "JSON", value: "json", kind: "data" },
    { label: "YAML", value: "yaml", kind: "data" },
    { label: "CSV", value: "csv", kind: "data" },
    { label: "TSV", value: "tsv", kind: "data" },
    { label: "XML", value: "xml", kind: "data" }
  ],
  ebook: [
    { label: "HTML", value: "html", kind: "ebook" },
    { label: "TXT", value: "txt", kind: "ebook" },
    { label: "PDF", value: "pdf", kind: "ebook" },
    { label: "MOBI", value: "mobi", kind: "ebook", requiresNativeEncoder: true },
    { label: "AZW3", value: "azw3", kind: "ebook", requiresNativeEncoder: true }
  ],
  vector: [
    { label: "PNG", value: "png", kind: "svg-raster" },
    { label: "WebP", value: "webp", kind: "svg-raster" },
    { label: "PDF", value: "pdf", kind: "svg-pdf" }
  ],
  font: [
    { label: "TTF", value: "ttf", kind: "font", requiresNativeEncoder: true },
    { label: "OTF", value: "otf", kind: "font", requiresNativeEncoder: true },
    { label: "WOFF", value: "woff", kind: "font", requiresNativeEncoder: true },
    { label: "WOFF2", value: "woff2", kind: "font", requiresNativeEncoder: true }
  ],
  model3d: [
    { label: "OBJ", value: "obj", kind: "model3d" },
    { label: "STL", value: "stl", kind: "model3d" },
    { label: "GLTF", value: "gltf", kind: "model3d" },
    { label: "GLB", value: "glb", kind: "model3d" }
  ],
  code: [
    { label: "Pretty", value: "pretty", kind: "code" },
    { label: "Minified", value: "min", kind: "code" }
  ],
  unknown: []
};

fileInput.addEventListener("change", () => addFiles(fileInput.files));

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
});

dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
goButton.addEventListener("click", convertAll);
clearButton.addEventListener("click", clearQueue);
downloadAllButton.addEventListener("click", downloadAll);

function addFiles(fileList) {
  const newItems = [...fileList].map((file) => {
    const kind = inferFileKind(file);
    const outputs = getOutputOptions({ kind, file });
    const defaultOutput = outputs.find((output) => !output.disabled);
    return {
      id: crypto.randomUUID(),
      file,
      kind,
      output: defaultOutput?.value || outputs[0]?.value || "",
      status: defaultOutput ? "Ready" : outputs.length ? "Unavailable" : "Unsupported",
      downloads: []
    };
  });

  state.items.push(...newItems);
  fileInput.value = "";
  renderQueue();
  setStatus(state.items.length ? `${state.items.length} file${state.items.length === 1 ? "" : "s"} ready.` : "Drop files to begin.");
  queuePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderQueue() {
  queueEl.replaceChildren();
  emptyQueueEl.hidden = state.items.length > 0;
  goButton.disabled = !state.items.some((item) => getSelectedOutput(item));
  clearButton.disabled = state.items.length === 0;
  downloadAllButton.disabled = getAllDownloads().length === 0;

  state.items.forEach((item) => {
    const outputs = getOutputOptions(item);
    const hasDisabledOutputs = outputs.some((output) => output.disabled);
    const row = document.createElement("li");
    row.className = "queue-item";
    row.dataset.id = item.id;

    const info = document.createElement("div");
    info.className = "file-info";
    const name = document.createElement("strong");
    name.textContent = item.file.name;
    const meta = document.createElement("span");
    meta.textContent = `${fileKindLabel(item.kind)} · ${formatBytes(item.file.size)}`;
    info.append(name, meta);

    const select = document.createElement("select");
    select.className = "output-select";
    select.id = `output-${item.id}`;
    select.name = `output-${item.id}`;
    select.ariaLabel = `Output format for ${item.file.name}`;
    select.disabled = outputs.length === 0;
    outputs.forEach((output) => {
      const option = new Option(output.label, output.value);
      option.selected = output.value === item.output;
      option.disabled = output.disabled;
      select.append(option);
    });
    select.addEventListener("change", () => {
      item.output = select.value;
      item.status = "Ready";
      revokeItemDownloads(item);
      renderQueue();
    });

    const status = document.createElement("div");
    status.className = `item-status ${statusClass(item.status)}`;
    status.textContent = item.status;

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.ariaLabel = `Remove ${item.file.name}`;
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.items = state.items.filter((candidate) => candidate.id !== item.id);
      revokeItemDownloads(item);
      renderQueue();
    });

    const downloads = document.createElement("div");
    downloads.className = "item-downloads";
    item.downloads.forEach((download) => downloads.append(createDownloadLink(download)));

    const supportNote = document.createElement("p");
    supportNote.className = "support-note";
    supportNote.hidden = !hasDisabledOutputs || item.status === "Done";
    supportNote.textContent = "Some outputs are unavailable for this file.";

    row.append(info, select, status, remove, supportNote, downloads);
    queueEl.append(row);
  });
}

async function convertAll() {
  clearDownloads();
  const convertible = state.items.filter((item) => getSelectedOutput(item));
  if (!convertible.length) {
    setStatus("Add supported files first.");
    return;
  }

  goButton.disabled = true;
  setProgress(0);
  setStatus(`Converting ${convertible.length} file${convertible.length === 1 ? "" : "s"}...`);
  let completed = 0;

  const results = await Promise.allSettled(convertible.map(async (item) => {
    item.status = "Converting";
    revokeItemDownloads(item);
    renderQueue();
    const output = getSelectedOutput(item);
    const downloads = await convertQueueItem(item.file, output);
    item.downloads = downloads.map((download) => createDownload(download.blob, download.filename, download.mimeType));
    item.status = "Done";
    completed += 1;
    setProgress(completed / convertible.length);
    renderQueue();
  }));

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const item = convertible[index];
      item.status = result.reason?.message || "Failed";
    }
  });

  renderQueue();
  const failed = results.filter((result) => result.status === "rejected").length;
  setProgress(1);
  setStatus(failed ? `${convertible.length - failed} done, ${failed} failed.` : `Converted ${convertible.length} file${convertible.length === 1 ? "" : "s"}.`);
}

async function downloadAll() {
  const downloads = getAllDownloads();
  if (!downloads.length) return;

  downloadAllButton.disabled = true;
  setStatus(`Preparing ${downloads.length} file${downloads.length === 1 ? "" : "s"} for download...`);

  try {
    const zipBlob = await createZip(downloads);
    const url = URL.createObjectURL(zipBlob);
    state.urls.push(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = `convertitbaby-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.append(link);
    link.click();
    link.remove();
    setStatus(`Downloaded ${downloads.length} file${downloads.length === 1 ? "" : "s"} as a ZIP.`);
  } catch (error) {
    console.error(error);
    setStatus(error?.message || "Could not prepare the batch download.");
  } finally {
    downloadAllButton.disabled = getAllDownloads().length === 0;
  }
}

async function convertQueueItem(file, output) {
  switch (output.kind) {
    case "image":
      return [await convertImageFile(file, output.value)];
    case "image-ico":
      return [await convertImageToIco(file)];
    case "image-pdf":
      return [await convertSingleImageToPdf(file)];
    case "gif-video":
      return [await convertGifToVideo(file, output.value)];
    case "video-gif":
      return [await convertVideoToGif(file)];
    case "pdf-png":
      return pdfToPngFiles(file);
    case "media":
      if (extension(file.name) === output.value) {
        return [copyOriginalFile(file, output.value)];
      }
      if (output.value === "mp3" && ["audio", "video"].includes(inferFileKind(file))) {
        return [await convertAudioTrackToMp3(file)];
      }
      if (output.value === "wav" && inferFileKind(file) === "audio") {
        return [await convertAudioFileToWav(file)];
      }
      return [await convertMediaFile(file, output.value)];
    case "archive":
      return [await convertArchiveFile(file, output.value)];
    case "document":
      return [await convertDocumentFile(file, output.value)];
    case "data":
      return [await convertDataFile(file, output.value)];
    case "ebook":
      return [await convertEbookFile(file, output.value)];
    case "svg-raster":
      return [await convertSvgToRaster(file, output.value)];
    case "svg-pdf":
      return [await convertSvgToPdf(file)];
    case "font":
      return [convertCopyOnlyFormat(file, output.value, "font")];
    case "model3d":
      return [await convertModelFile(file, output.value)];
    case "code":
      return [await convertCodeFile(file, output.value)];
    default:
      throw new Error("Unsupported output.");
  }
}

async function convertDocumentFile(file, outputValue) {
  const ext = extension(file.name);
  const text = ext === "docx" ? await docxToText(file) : await file.text();
  if (outputValue === "txt") {
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  }
  if (outputValue === "html") {
    return textDownload(textToHtml(text), rename(file.name, "html"), "text/html");
  }
  if (outputValue === "pdf") {
    return textToPdfDownload(text, rename(file.name, "pdf"));
  }
  throw new Error("That document output is not available for this file.");
}

async function convertEbookFile(file, outputValue) {
  if (["mobi", "azw3"].includes(outputValue)) {
    return convertCopyOnlyFormat(file, outputValue, "ebook");
  }
  const text = extension(file.name) === "epub" ? await epubToText(file) : await file.text();
  if (outputValue === "txt") {
    return textDownload(text, rename(file.name, "txt"), "text/plain");
  }
  if (outputValue === "html") {
    return textDownload(textToHtml(text), rename(file.name, "html"), "text/html");
  }
  if (outputValue === "pdf") {
    return textToPdfDownload(text, rename(file.name, "pdf"));
  }
  throw new Error("That ebook output is not available for this file.");
}

async function convertDataFile(file, outputValue) {
  const source = parseDataText(await file.text(), extension(file.name));
  const text = serializeData(source, outputValue);
  return textDownload(text, rename(file.name, outputValue), mimeForExtension(outputValue));
}

async function convertCodeFile(file, mode) {
  const ext = extension(file.name);
  const text = await file.text();
  const converted = mode === "min" ? minifyCode(text, ext) : prettyCode(text, ext);
  return textDownload(converted, rename(file.name, ext), mimeForExtension(ext));
}

async function convertSvgToRaster(file, outputValue) {
  const image = await loadImageFromBlob(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || 512;
  canvas.height = image.naturalHeight || 512;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  revokeImage(image);
  const mime = outputValue === "webp" ? "image/webp" : "image/png";
  return {
    blob: await canvasToBlob(canvas, mime, 0.92),
    filename: rename(file.name, outputValue),
    mimeType: mime
  };
}

async function convertSvgToPdf(file) {
  const png = await convertSvgToRaster(file, "png");
  const imageFile = new File([png.blob], png.filename, { type: png.mimeType });
  return convertSingleImageToPdf(imageFile);
}

async function convertImageToIco(file) {
  const pngBlob = await imageFileToPng(file);
  const png = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  header[6] = 0;
  header[7] = 0;
  header[8] = 0;
  header[9] = 0;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, png.length, true);
  view.setUint32(18, header.length, true);
  return {
    blob: new Blob([header, png], { type: "image/x-icon" }),
    filename: rename(file.name, "ico"),
    mimeType: "image/x-icon"
  };
}

async function convertModelFile(file, outputValue) {
  const ext = extension(file.name);
  if (ext === outputValue) return copyOriginalFile(file, outputValue);
  if (ext === "obj" && outputValue === "stl") {
    return textDownload(objToStl(await file.text()), rename(file.name, "stl"), "model/stl");
  }
  if (ext === "stl" && outputValue === "obj") {
    return textDownload(stlToObj(await file.text()), rename(file.name, "obj"), "model/obj");
  }
  if (ext === "gltf" && outputValue === "glb") {
    return {
      blob: gltfToGlb(await file.text()),
      filename: rename(file.name, "glb"),
      mimeType: "model/gltf-binary"
    };
  }
  if (ext === "glb" && outputValue === "gltf") {
    return textDownload(await glbToGltf(file), rename(file.name, "gltf"), "model/gltf+json");
  }
  throw new Error("That 3D output is not available for this file.");
}

function convertCopyOnlyFormat(file, outputValue, label) {
  if (extension(file.name) === outputValue) return copyOriginalFile(file, outputValue);
  throw new Error(`That ${label} output is not available for this file.`);
}

async function convertArchiveFile(file, formatKey) {
  if (extension(file.name) === formatKey) {
    return copyOriginalFile(file, formatKey);
  }

  const source = {
    blob: file,
    filename: file.name,
    mimeType: file.type || mimeForExtension(extension(file.name)),
    size: file.size
  };

  if (formatKey === "zip") {
    return {
      blob: await createZip([source]),
      filename: rename(file.name, "zip"),
      mimeType: "application/zip"
    };
  }

  if (formatKey === "tar") {
    return {
      blob: await createTar([source]),
      filename: rename(file.name, "tar"),
      mimeType: "application/x-tar"
    };
  }

  if (formatKey === "tgz") {
    const tarBlob = await createTar([source]);
    return {
      blob: await gzipBlob(tarBlob),
      filename: rename(file.name, "tgz"),
      mimeType: "application/gzip"
    };
  }

  if (formatKey === "gz") {
    return {
      blob: await gzipBlob(file),
      filename: `${file.name}.gz`,
      mimeType: "application/gzip"
    };
  }

  throw new Error("That archive output is not available for this file.");
}

async function convertImageFile(file, mime, quality = 0.92) {
  let sourceBlob = file;
  if (isHeic(file)) {
    const heic2any = (await loadHeic2Any()).default;
    sourceBlob = await heic2any({ blob: file, toType: mime, quality });
    if (Array.isArray(sourceBlob)) sourceBlob = sourceBlob[0];
  }

  const bitmap = await createImageBitmap(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, filename: rename(file.name, extensionForMime(mime)), mimeType: mime };
}

async function convertSingleImageToPdf(file) {
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const pngBlob = await imageFileToPng(file);
  const bytes = await pngBlob.arrayBuffer();
  const image = await pdf.embedPng(bytes);
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: "application/pdf" }),
    filename: rename(file.name, "pdf"),
    mimeType: "application/pdf"
  };
}

async function convertMediaFile(file, formatKey) {
  const {
    Input,
    Output,
    Conversion,
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    MovOutputFormat,
    MkvOutputFormat,
    WebMOutputFormat,
    OggOutputFormat,
    Mp3OutputFormat,
    WavOutputFormat,
    AdtsOutputFormat,
    FlacOutputFormat,
    MpegTsOutputFormat
  } = await loadMediabunny();

  const formats = {
    mp4: () => new Mp4OutputFormat({ fastStart: "in-memory" }),
    mov: () => new MovOutputFormat({ fastStart: "in-memory" }),
    mkv: () => new MkvOutputFormat(),
    webm: () => new WebMOutputFormat(),
    ogg: () => new OggOutputFormat(),
    mp3: () => new Mp3OutputFormat(),
    wav: () => new WavOutputFormat(),
    aac: () => new AdtsOutputFormat(),
    flac: () => new FlacOutputFormat(),
    ts: () => new MpegTsOutputFormat()
  };

  const outputFormat = formats[formatKey]?.();
  if (!outputFormat) throw new Error("Unsupported media output.");

  const output = new Output({ format: outputFormat, target: new BufferTarget() });
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const conversion = await Conversion.init({ input, output });
  if (!conversion.utilizedTracks.length) {
    const reason = conversion.discardedTracks?.map((track) => track.reason).filter(Boolean).join(", ");
    throw new Error(reason || "That file cannot be converted to the selected format on this device.");
  }

  await conversion.execute();
  return {
    blob: new Blob([output.target.buffer], { type: outputFormat.mimeType || "application/octet-stream" }),
    filename: rename(file.name, formatKey),
    mimeType: outputFormat.mimeType
  };
}

async function convertAudioFileToWav(file) {
  const audioBuffer = await decodeAudioBuffer(file);
  const blob = encodeWav(audioBuffer);
  return {
    blob,
    filename: rename(file.name, "wav"),
    mimeType: "audio/wav"
  };
}

async function convertAudioTrackToMp3(file) {
  const audioBuffer = await decodeAudioBuffer(file);
  const blob = await encodeMp3(audioBuffer);
  return {
    blob,
    filename: rename(file.name, "mp3"),
    mimeType: "audio/mpeg"
  };
}

async function decodeAudioBuffer(file) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("That audio file could not be read.");
  }

  const audioContext = new AudioContextClass();
  try {
    return await audioContext.decodeAudioData(await file.arrayBuffer());
  } finally {
    await audioContext.close();
  }
}

async function convertGifToVideo(file, outputFormat) {
  const { parseGIF, decompressFrames } = await loadGifuct();
  const gif = parseGIF(await file.arrayBuffer());
  const frames = decompressFrames(gif, true);
  if (!frames.length) throw new Error("Could not find animation frames in that GIF.");

  const canvas = document.createElement("canvas");
  canvas.width = gif.lsd.width;
  canvas.height = gif.lsd.height;
  const ctx = canvas.getContext("2d");
  const stream = canvas.captureStream(30);
  const mimeType = pickVideoRecorderMime(outputFormat);
  if (!mimeType) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("MP4 is not available here. Try WebM video instead.");
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2200000 });
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  recorder.start();

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const frameImage = ctx.createImageData(frame.dims.width, frame.dims.height);
    frameImage.data.set(frame.patch);
    ctx.putImageData(frameImage, frame.dims.left, frame.dims.top);
    await wait(Math.max(20, frame.delay || 100));
  }

  recorder.stop();
  await new Promise((resolve) => { recorder.onstop = resolve; });
  stream.getTracks().forEach((track) => track.stop());
  const extension = outputFormat === "mp4" ? "mp4" : "webm";
  return { blob: new Blob(chunks, { type: mimeType }), filename: rename(file.name, extension), mimeType };
}

async function convertVideoToGif(file) {
  const maxWidth = 480;
  const fps = 10;
  const { GIFEncoder, quantize, applyPalette } = await loadGifenc();
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = URL.createObjectURL(file);
  state.urls.push(video.src);
  await once(video, "loadedmetadata");
  const duration = Math.min(video.duration || 0, 12);
  if (!duration) throw new Error("Could not read the video duration.");

  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const gif = GIFEncoder();
  const frameCount = Math.max(1, Math.floor(duration * fps));

  for (let index = 0; index < frameCount; index += 1) {
    video.currentTime = index / fps;
    await once(video, "seeked");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    gif.writeFrame(indexed, canvas.width, canvas.height, { palette, delay: Math.round(1000 / fps) });
  }

  gif.finish();
  return { blob: new Blob([gif.bytes()], { type: "image/gif" }), filename: rename(file.name, "gif"), mimeType: "image/gif" };
}

async function pdfToPngFiles(file) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const downloads = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    await page.render({ canvasContext: ctx, viewport }).promise;
    downloads.push({
      blob: await canvasToBlob(canvas, "image/png"),
      filename: `${baseName(file.name)}-page-${String(pageNumber).padStart(2, "0")}.png`,
      mimeType: "image/png"
    });
  }

  return downloads;
}

async function imageFileToPng(file) {
  let source = file;
  if (isHeic(file)) {
    const heic2any = (await loadHeic2Any()).default;
    source = await heic2any({ blob: file, toType: "image/png" });
    if (Array.isArray(source)) source = source[0];
  }
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvasToBlob(canvas, "image/png");
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
  while (offset + 30 <= bytes.length && readUint32(bytes, offset) === 0x04034b50) {
    const method = readUint16(bytes, offset + 8);
    const compressedSize = readUint32(bytes, offset + 18);
    const uncompressedSize = readUint32(bytes, offset + 22);
    const nameLength = readUint16(bytes, offset + 26);
    const extraLength = readUint16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLength));
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
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream(format));
      const result = new Uint8Array(await new Response(stream).arrayBuffer());
      if (!expectedSize || result.length === expectedSize) return result;
    } catch {
      // Try the next deflate wrapper.
    }
  }
  throw new Error("That compressed file could not be read.");
}

function parseDataText(text, ext) {
  if (ext === "json") return JSON.parse(text);
  if (["yaml", "yml"].includes(ext)) return parseSimpleYaml(text);
  if (ext === "csv") return parseDelimited(text, ",");
  if (ext === "tsv") return parseDelimited(text, "\t");
  if (ext === "xml") return xmlToObject(text);
  if (ext === "vcf") return parseKeyValueLines(text, /^BEGIN:VCARD|^END:VCARD/i);
  if (ext === "ics") return parseKeyValueLines(text, /^BEGIN:VCALENDAR|^END:VCALENDAR|^BEGIN:VEVENT|^END:VEVENT/i);
  if (ext === "env") return parseEnv(text);
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

function parseDelimited(text, delimiter) {
  const rows = text.trim().split(/\r?\n/).map((line) => splitDelimitedLine(line, delimiter));
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
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
    ...rows.map((row) => headers.map((header) => escapeDelimited(row[header] ?? "", delimiter)).join(delimiter))
  ].join("\n");
}

function escapeDelimited(value, delimiter) {
  const text = String(value);
  return /["\n\r]/.test(text) || text.includes(delimiter) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizeRows(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" && item ? item : { value: item });
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
  if (Array.isArray(value)) return value.map((item) => `- ${JSON.stringify(item)}`).join("\n");
  return Object.entries(value || {}).map(([key, item]) => `${key}: ${formatYamlScalar(item)}`).join("\n");
}

function formatYamlScalar(value) {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
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
  if (!children.length) return { [element.nodeName]: element.textContent.trim() };
  return {
    [element.nodeName]: Object.assign({}, ...children.map(elementToObject))
  };
}

function objectToXml(value) {
  const [root, content] = Object.entries(value || { root: "" })[0];
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(root || "root", content)}\n`;
}

function xmlNode(name, value) {
  if (Array.isArray(value)) return value.map((item) => xmlNode(name, item)).join("");
  if (typeof value === "object" && value !== null) {
    return `<${name}>${Object.entries(value).map(([key, item]) => xmlNode(key, item)).join("")}</${name}>`;
  }
  return `<${name}>${escapeHtml(String(value ?? ""))}</${name}>`;
}

function parseKeyValueLines(text, ignoredPattern) {
  return text.split(/\r?\n/).filter((line) => line && !ignoredPattern.test(line)).map((line) => {
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

function textToHtml(text) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Converted document</title></head><body>${escapeHtml(text).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`).join("")}</body></html>`;
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
    mimeType: "application/pdf"
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

function textDownload(text, filename, mimeType) {
  return {
    blob: new Blob([text], { type: mimeType }),
    filename,
    mimeType
  };
}

function minifyCode(text, ext) {
  if (ext === "json") return JSON.stringify(JSON.parse(text));
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").trim();
}

function prettyCode(text, ext) {
  if (ext === "json") return `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
  if (["html", "xml"].includes(ext)) return text.replace(/></g, ">\n<");
  return text.replace(/([{};])/g, "$1\n").replace(/\n{2,}/g, "\n").trim();
}

function objToStl(text) {
  const vertices = [];
  const facets = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") vertices.push(parts.slice(1, 4).map(Number));
    if (parts[0] === "f") {
      const indexes = parts.slice(1).map((part) => Number(part.split("/")[0]) - 1);
      for (let index = 1; index < indexes.length - 1; index += 1) {
        facets.push([vertices[indexes[0]], vertices[indexes[index]], vertices[indexes[index + 1]]]);
      }
    }
  }
  return `solid converted\n${facets.map((facet) => `  facet normal 0 0 0\n    outer loop\n${facet.map((vertex) => `      vertex ${vertex.join(" ")}`).join("\n")}\n    endloop\n  endfacet`).join("\n")}\nendsolid converted\n`;
}

function stlToObj(text) {
  const vertices = [...text.matchAll(/vertex\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/g)].map((match) => match.slice(1, 4).map(Number));
  const lines = vertices.map((vertex) => `v ${vertex.join(" ")}`);
  for (let index = 0; index < vertices.length; index += 3) {
    lines.push(`f ${index + 1} ${index + 2} ${index + 3}`);
  }
  return `${lines.join("\n")}\n`;
}

function gltfToGlb(text) {
  const json = new TextEncoder().encode(text);
  const paddedJsonLength = align4(json.length);
  const totalLength = 12 + 8 + paddedJsonLength;
  const bytes = new Uint8Array(totalLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(json, 20);
  bytes.fill(0x20, 20 + json.length, 20 + paddedJsonLength);
  return new Blob([bytes], { type: "model/gltf-binary" });
}

async function glbToGltf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (readUint32(bytes, 0) !== 0x46546c67) throw new Error("That GLB file could not be read.");
  const jsonLength = readUint32(bytes, 12);
  return new TextDecoder().decode(bytes.slice(20, 20 + jsonLength)).trim();
}

function align4(value) {
  return Math.ceil(value / 4) * 4;
}

function readUint16(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
}

function readUint32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = URL.createObjectURL(blob);
    state.urls.push(image.src);
  });
}

function revokeImage(image) {
  if (image.src) URL.revokeObjectURL(image.src);
}

function getSelectedOutput(item) {
  const output = getOutputOptions(item).find((candidate) => candidate.value === item.output);
  return output?.disabled ? null : output;
}

function getOutputOptions(item) {
  return (OUTPUTS[item.kind] || []).map((output) => {
    const disabledReason = getDisabledReason(output, item);
    return {
      ...output,
      disabled: Boolean(disabledReason),
      disabledReason
    };
  });
}

function getDisabledReason(output, item) {
  if (["font", "ebook"].includes(output.kind) && output.requiresNativeEncoder && extension(item.file.name) !== output.value) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "ebook" && ["mobi", "azw3"].includes(extension(item.file.name)) && output.value !== extension(item.file.name)) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "model3d" && !canConvertModelByExtension(item.file, output.value)) {
    return `${output.label} is not available for this file.`;
  }

  if (output.kind === "svg-raster" && !["svg"].includes(extension(item.file.name))) {
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

  if (output.kind === "media" && !canConvertMediaByExtension(item.file, output.value)) {
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
  if (["mp4", "mov", "mkv", "webm"].includes(ext)) return ["mp4", "mov", "mkv", "webm", "mp3", "aac"].includes(outputValue);
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) return ["mp3", "wav"].includes(outputValue);
  return false;
}

function canPlayVideoFile(file) {
  const video = document.createElement("video");
  const candidates = [file.type, mimeFromExtension(extension(file.name))].filter(Boolean);
  if (!candidates.length) return true;
  return candidates.some((mime) => Boolean(video.canPlayType(mime)));
}

function mimeFromExtension(ext) {
  return ({
    mp4: "video/mp4",
    mov: "video/quicktime",
    m4v: "video/mp4",
    webm: "video/webm",
    mkv: "video/x-matroska",
    ts: "video/mp2t"
  })[ext] || "";
}

function mimeForExtension(ext) {
  return ({
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
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    xml: "application/xml",
    vcf: "text/vcard",
    ics: "text/calendar",
    env: "text/plain",
    svg: "image/svg+xml",
    ico: "image/x-icon",
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
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    flac: "audio/flac",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    webm: "video/webm",
    ts: "video/mp2t"
  })[ext] || "application/octet-stream";
}

function inferFileKind(file) {
  const ext = extension(file.name);
  if (["json", "yaml", "yml", "csv", "tsv", "xml", "vcf", "ics", "env"].includes(ext)) return "data";
  if (["docx", "txt", "md", "markdown", "html", "htm"].includes(ext)) return "document";
  if (["epub", "mobi", "azw3"].includes(ext)) return "ebook";
  if (ext === "svg") return "vector";
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) return "font";
  if (["obj", "stl", "gltf", "glb"].includes(ext)) return "model3d";
  if (["css", "js"].includes(ext)) return "code";
  if (isArchiveExtension(ext)) return "archive";
  if (isArchiveMime(file.type)) return "archive";
  if (["heic", "heif"].includes(ext) || /hei[cf]/i.test(file.type)) return "heic";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (ext === "gif" || file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/") || ext === "ico") return "image";
  if (ext === "mp4" || file.type === "video/mp4") return "video";
  if (file.type.startsWith("video/") || ["mov", "mkv", "webm", "ts"].includes(ext)) return "video";
  if (file.type.startsWith("audio/") || ["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) return "audio";
  return "unknown";
}

function fileKindLabel(kind) {
  return ({
    archive: "Archive",
    document: "Document",
    data: "Data",
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
    unknown: "Unsupported"
  })[kind] || "File";
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
    "lzma"
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
    "application/x-lzma"
  ].includes(type);
}

function statusClass(status) {
  const value = status.toLowerCase();
  if (value === "done") return "done";
  if (value === "converting") return "converting";
  if (value === "unsupported") return "unsupported";
  if (value === "unavailable") return "unavailable";
  if (value.includes("fail") || value.includes("error") || value.includes("cannot")) return "failed";
  return "";
}

function createDownload(blob, filename, mimeType = blob.type) {
  const url = URL.createObjectURL(blob);
  state.urls.push(url);
  const download = { url, filename, mimeType, size: blob.size, blob };
  return download;
}

function copyOriginalFile(file, ext) {
  return {
    blob: file.slice(0, file.size, file.type || mimeForExtension(ext)),
    filename: rename(file.name, ext),
    mimeType: file.type || mimeForExtension(ext)
  };
}

function encodeWav(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const frameCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function encodeMp3(audioBuffer) {
  const Mp3Encoder = await getMp3EncoderCtor();
  if (!Mp3Encoder) {
    throw new Error("MP3 is not available for this file.");
  }

  const channelCount = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channelCount, sampleRate, 128);
  const left = floatToInt16(audioBuffer.getChannelData(0));
  const right = channelCount > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : null;
  const chunks = [];
  const frameSize = 1152;

  for (let offset = 0; offset < left.length; offset += frameSize) {
    const leftChunk = left.subarray(offset, offset + frameSize);
    const mp3Buffer = right
      ? encoder.encodeBuffer(leftChunk, right.subarray(offset, offset + frameSize))
      : encoder.encodeBuffer(leftChunk);
    if (mp3Buffer.length) chunks.push(mp3Buffer);
  }

  const finalBuffer = encoder.flush();
  if (finalBuffer.length) chunks.push(finalBuffer);
  return new Blob(chunks, { type: "audio/mpeg" });
}

function getMp3EncoderCtor() {
  mp3EncoderCtorPromise ||= loadLameRaw().then((module) => {
    const loadLame = new Function(`${module.default}\nreturn lamejs;`);
    return loadLame().Mp3Encoder;
  });
  return mp3EncoderCtorPromise;
}

function loadHeic2Any() {
  lazyModules.heic2any ||= import("heic2any");
  return lazyModules.heic2any;
}

function loadPdfLib() {
  lazyModules.pdfLib ||= import("pdf-lib");
  return lazyModules.pdfLib;
}

function loadMediabunny() {
  lazyModules.mediabunny ||= import("mediabunny");
  return lazyModules.mediabunny;
}

function loadGifuct() {
  lazyModules.gifuct ||= import("gifuct-js");
  return lazyModules.gifuct;
}

function loadGifenc() {
  lazyModules.gifenc ||= import("gifenc");
  return lazyModules.gifenc;
}

function loadLameRaw() {
  lazyModules.lameRaw ||= import("lamejs/lame.all.js?raw");
  return lazyModules.lameRaw;
}

async function loadPdfJs() {
  lazyModules.pdfJs ||= Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.mjs?url")
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return lazyModules.pdfJs;
}

function floatToInt16(samples) {
  const result = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    result[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return result;
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function writeBytes(target, offset, bytes) {
  target.set(bytes, offset);
}

function writeOctal(target, offset, length, value) {
  const octal = value.toString(8).padStart(length - 1, "0").slice(-(length - 1));
  for (let index = 0; index < octal.length; index += 1) {
    target[offset + index] = octal.charCodeAt(index);
  }
  target[offset + length - 1] = 0;
}

function createDownloadLink(download) {
  const link = document.createElement("a");
  link.className = "download";
  link.href = download.url;
  link.download = download.filename;
  link.type = download.mimeType;
  link.textContent = `${download.filename} (${formatBytes(download.size)})`;
  return link;
}

function revokeItemDownloads(item) {
  item.downloads.forEach((download) => URL.revokeObjectURL(download.url));
  item.downloads = [];
}

function clearQueue() {
  state.items.forEach(revokeItemDownloads);
  state.items = [];
  clearDownloads();
  setProgress(null);
  renderQueue();
  setStatus("Drop files to begin.");
}

function clearDownloads() {
  state.urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
}

function getAllDownloads() {
  return state.items.flatMap((item) => item.downloads);
}

async function createZip(downloads) {
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
    const localHeader = createLocalZipHeader({ nameBytes, crc, size: data.length, time, date });
    const centralHeader = createCentralZipHeader({ nameBytes, crc, size: data.length, time, date, offset });

    chunks.push(localHeader, data);
    centralDirectory.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.length, 0);
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

  return new Blob([...chunks, ...centralDirectory, endRecord], { type: "application/zip" });
}

async function createTar(downloads) {
  const chunks = [];
  const usedNames = new Map();

  for (const download of downloads) {
    const filename = uniqueArchiveName(download.filename, usedNames);
    const data = new Uint8Array(await download.blob.arrayBuffer());
    chunks.push(createTarHeader(filename, data.length), data, tarPadding(data.length));
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

async function gzipBlob(blob) {
  if (!canGzip()) {
    throw new Error("GZIP is not available for this file.");
  }

  const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
  return new Blob([await new Response(stream).arrayBuffer()], { type: "application/gzip" });
}

function canGzip() {
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
  const date = ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate();
  const time = (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2);
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

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the output file.")), type, quality);
  });
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setProgress(value) {
  if (value === null) {
    progressEl.hidden = true;
    progressBar.style.setProperty("--progress", "0%");
    return;
  }
  progressEl.hidden = false;
  progressBar.style.setProperty("--progress", `${Math.max(0, Math.min(100, value * 100))}%`);
}

function rename(name, ext) {
  return `${baseName(name)}.${ext.replace(/^\./, "")}`;
}

function baseName(name) {
  return name.replace(/\.[^.]+$/, "") || "converted";
}

function extension(name) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function extensionForMime(mime) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/x-icon": "ico" })[mime] || "bin";
}

function isHeic(file) {
  return ["heic", "heif"].includes(extension(file.name)) || /hei[cf]/i.test(file.type);
}

function pickVideoRecorderMime(outputFormat) {
  const candidates = outputFormat === "mp4"
    ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=h264", "video/mp4"]
    : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
}

function once(target, event) {
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
