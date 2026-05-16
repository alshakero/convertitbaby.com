import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

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
    supportNote.textContent = "Some outputs are disabled because this browser cannot create them locally.";

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
    default:
      throw new Error("Unsupported output.");
  }
}

async function convertImageFile(file, mime, quality = 0.92) {
  let sourceBlob = file;
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
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
  const { PDFDocument } = await import("pdf-lib");
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
  } = await import("mediabunny");

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
    throw new Error("This browser cannot decode audio locally.");
  }

  const audioContext = new AudioContextClass();
  try {
    return await audioContext.decodeAudioData(await file.arrayBuffer());
  } finally {
    await audioContext.close();
  }
}

async function convertGifToVideo(file, outputFormat) {
  const { parseGIF, decompressFrames } = await import("gifuct-js");
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
    throw new Error("This device cannot create MP4 locally. Try WebM video instead.");
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
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
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
  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
    const heic2any = (await import("heic2any")).default;
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
  if (output.kind === "gif-video" && !pickVideoRecorderMime(output.value)) {
    return `${output.label} is not available in this browser.`;
  }

  if (output.kind === "video-gif" && !canPlayVideoFile(item.file)) {
    return "This browser cannot read that video locally.";
  }

  if (output.kind === "media" && !canConvertMediaByExtension(item.file, output.value)) {
    return `${output.label} is not available for this file in this browser.`;
  }

  return "";
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
  if (["heic", "heif"].includes(ext) || /hei[cf]/i.test(file.type)) return "heic";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (ext === "gif" || file.type === "image/gif") return "gif";
  if (file.type.startsWith("image/")) return "image";
  if (ext === "mp4" || file.type === "video/mp4") return "video";
  if (file.type.startsWith("video/") || ["mov", "mkv", "webm", "ts"].includes(ext)) return "video";
  if (file.type.startsWith("audio/") || ["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) return "audio";
  return "unknown";
}

function fileKindLabel(kind) {
  return ({
    heic: "HEIC image",
    image: "Image",
    gif: "GIF",
    pdf: "PDF",
    video: "Video",
    audio: "Audio",
    unknown: "Unsupported"
  })[kind] || "File";
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
    throw new Error("This browser cannot create MP3 locally.");
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
  mp3EncoderCtorPromise ||= import("lamejs/lame.all.js?raw").then((module) => {
    const loadLame = new Function(`${module.default}\nreturn lamejs;`);
    return loadLame().Mp3Encoder;
  });
  return mp3EncoderCtorPromise;
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
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mime] || "bin";
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
