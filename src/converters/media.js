import { mimeForExtension, pickVideoRecorderMime } from "../formats.js";
import {
  getMp3EncoderCtor,
  loadGifenc,
  loadGifuct,
  loadHeic2Any,
  loadMediabunny,
  loadPdfJs,
  loadPdfLib,
} from "../lib/lazy-modules.js";
import { trackObjectUrl } from "../lib/runtime.js";
import {
  baseName,
  canvasToBlob,
  extension,
  extensionForMime,
  floatToInt16,
  once,
  readUint16,
  readUint32,
  rename,
  wait,
  writeAscii,
} from "../lib/utils.js";

const COMPRESSED_PDF_MAX_EDGE = 1600;
const COMPRESSED_PDF_MAX_SCALE = 2;
const COMPRESSED_PDF_JPEG_QUALITY = 0.68;

export async function convertSvgToRaster(file, outputValue) {
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
    mimeType: mime,
  };
}

export async function convertSvgToPdf(file) {
  const png = await convertSvgToRaster(file, "png");
  const imageFile = new File([png.blob], png.filename, { type: png.mimeType });
  return convertSingleImageToPdf(imageFile);
}

export async function convertImageToIco(file) {
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
    mimeType: "image/x-icon",
  };
}

export async function convertImageFile(file, mime, quality = 0.92) {
  const source = await imageFileToCanvas(
    file,
    mime === "image/jpeg" ? "image/png" : mime,
  );
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(source, 0, 0);

  const blob = await canvasToBlob(canvas, mime, quality);
  return {
    blob,
    filename: rename(file.name, extensionForMime(mime)),
    mimeType: mime,
  };
}

export async function convertSingleImageToPdf(file) {
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const pngBlob = await imageFileToPng(file);
  const bytes = await pngBlob.arrayBuffer();
  const image = await pdf.embedPng(bytes);
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });
  const pdfBytes = await pdf.save();
  return {
    blob: new Blob([pdfBytes], { type: "application/pdf" }),
    filename: rename(file.name, "pdf"),
    mimeType: "application/pdf",
  };
}

export async function convertMediaFile(file, formatKey) {
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
    MpegTsOutputFormat,
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
    ts: () => new MpegTsOutputFormat(),
  };

  const outputFormat = formats[formatKey]?.();
  if (!outputFormat) throw new Error("Unsupported media output.");

  const output = new Output({
    format: outputFormat,
    target: new BufferTarget(),
  });
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  const conversion = await Conversion.init({ input, output });
  if (!conversion.utilizedTracks.length) {
    const reason = conversion.discardedTracks
      ?.map((track) => track.reason)
      .filter(Boolean)
      .join(", ");
    throw new Error(
      reason ||
        "That file cannot be converted to the selected format on this device.",
    );
  }

  await conversion.execute();
  return {
    blob: new Blob([output.target.buffer], {
      type: outputFormat.mimeType || "application/octet-stream",
    }),
    filename: rename(file.name, formatKey),
    mimeType: outputFormat.mimeType,
  };
}

export async function convertAudioFileToWav(file) {
  const audioBuffer = await decodeAudioBuffer(file);
  const blob = encodeWav(audioBuffer);
  return {
    blob,
    filename: rename(file.name, "wav"),
    mimeType: "audio/wav",
  };
}

export async function convertAudioTrackToMp3(file) {
  const audioBuffer = await decodeAudioBuffer(file);
  const blob = await encodeMp3(audioBuffer);
  return {
    blob,
    filename: rename(file.name, "mp3"),
    mimeType: "audio/mpeg",
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

export async function convertGifToVideo(file, outputFormat) {
  const { parseGIF, decompressFrames } = await loadGifuct();
  const gif = parseGIF(await file.arrayBuffer());
  const frames = decompressFrames(gif, true);
  if (!frames.length)
    throw new Error("Could not find animation frames in that GIF.");

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

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2200000,
  });
  const chunks = [];
  recorder.ondataavailable = (event) =>
    event.data.size && chunks.push(event.data);
  recorder.start();

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const frameImage = ctx.createImageData(frame.dims.width, frame.dims.height);
    frameImage.data.set(frame.patch);
    ctx.putImageData(frameImage, frame.dims.left, frame.dims.top);
    await wait(Math.max(20, frame.delay || 100));
  }

  recorder.stop();
  await new Promise((resolve) => {
    recorder.onstop = resolve;
  });
  stream.getTracks().forEach((track) => track.stop());
  const extension = outputFormat === "mp4" ? "mp4" : "webm";
  return {
    blob: new Blob(chunks, { type: mimeType }),
    filename: rename(file.name, extension),
    mimeType,
  };
}

export async function convertVideoToGif(file) {
  const maxWidth = 480;
  const fps = 10;
  const { GIFEncoder, quantize, applyPalette } = await loadGifenc();
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = URL.createObjectURL(file);
  trackObjectUrl(video.src);
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
    gif.writeFrame(indexed, canvas.width, canvas.height, {
      palette,
      delay: Math.round(1000 / fps),
    });
  }

  gif.finish();
  return {
    blob: new Blob([gif.bytes()], { type: "image/gif" }),
    filename: rename(file.name, "gif"),
    mimeType: "image/gif",
  };
}

export async function compressPdfFile(file) {
  const [pdfjs, { PDFDocument }] = await Promise.all([
    loadPdfJs(),
    loadPdfLib(),
  ]);
  const originalBytes = await file.arrayBuffer();
  const sourcePdf = await pdfjs.getDocument({ data: originalBytes.slice(0) })
    .promise;
  if (!sourcePdf.numPages) throw new Error("Could not find pages in that PDF.");

  const outputPdf = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
    const sourcePage = await sourcePdf.getPage(pageNumber);
    const baseViewport = sourcePage.getViewport({ scale: 1 });
    const scale = compressedPdfScale(baseViewport.width, baseViewport.height);
    const viewport = sourcePage.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await sourcePage.render({ canvasContext: ctx, viewport }).promise;
    const jpgBlob = await canvasToBlob(
      canvas,
      "image/jpeg",
      COMPRESSED_PDF_JPEG_QUALITY,
    );
    const jpgImage = await outputPdf.embedJpg(await jpgBlob.arrayBuffer());
    const outputPage = outputPdf.addPage([
      baseViewport.width,
      baseViewport.height,
    ]);
    outputPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });

    sourcePage.cleanup();
    canvas.width = 0;
    canvas.height = 0;
  }

  const compressedBytes = await outputPdf.save({ useObjectStreams: true });
  const bestBytes =
    compressedBytes.byteLength < originalBytes.byteLength
      ? compressedBytes
      : originalBytes;

  return {
    blob: new Blob([bestBytes], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-compressed.pdf`,
    mimeType: "application/pdf",
  };
}

export async function pdfToPngFiles(file) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
    .promise;
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
      mimeType: "image/png",
    });
  }

  return downloads;
}

function compressedPdfScale(width, height) {
  const edgeScale = Math.min(
    COMPRESSED_PDF_MAX_EDGE / width,
    COMPRESSED_PDF_MAX_EDGE / height,
  );
  return Math.max(0.1, Math.min(COMPRESSED_PDF_MAX_SCALE, edgeScale));
}

async function imageFileToPng(file) {
  const canvas = await imageFileToCanvas(file, "image/png");
  return canvasToBlob(canvas, "image/png");
}

export async function imageFileToCanvas(file, heicOutputType = "image/png") {
  if (isHeic(file)) {
    const heic2any = (await loadHeic2Any()).default;
    let source = await heic2any({ blob: file, toType: heicOutputType });
    if (Array.isArray(source)) source = source[0];
    return blobToCanvas(source);
  }
  if (extension(file.name) === "bmp") return bmpToCanvas(file);
  if (["tif", "tiff"].includes(extension(file.name))) return tiffToCanvas(file);
  return blobToCanvas(file);
}

async function blobToCanvas(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

async function bmpToCanvas(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(0, true) !== 0x4d42)
    throw new Error("That BMP file could not be read.");
  const dataOffset = view.getUint32(10, true);
  const width = view.getInt32(18, true);
  const rawHeight = view.getInt32(22, true);
  const height = Math.abs(rawHeight);
  const bitsPerPixel = view.getUint16(28, true);
  if (![24, 32].includes(bitsPerPixel))
    throw new Error("That BMP file could not be read.");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);
  const bytesPerPixel = bitsPerPixel / 8;
  const rowSize = Math.floor((bitsPerPixel * width + 31) / 32) * 4;
  for (let y = 0; y < height; y += 1) {
    const sourceY = rawHeight > 0 ? height - 1 - y : y;
    const rowOffset = dataOffset + sourceY * rowSize;
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = rowOffset + x * bytesPerPixel;
      const targetOffset = (y * width + x) * 4;
      imageData.data[targetOffset] = bytes[sourceOffset + 2];
      imageData.data[targetOffset + 1] = bytes[sourceOffset + 1];
      imageData.data[targetOffset + 2] = bytes[sourceOffset];
      imageData.data[targetOffset + 3] =
        bitsPerPixel === 32 ? bytes[sourceOffset + 3] : 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function tiffToCanvas(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const littleEndian = view.getUint16(0, false) === 0x4949;
  if (!littleEndian && view.getUint16(0, false) !== 0x4d4d)
    throw new Error("That TIFF file could not be read.");
  if (view.getUint16(2, littleEndian) !== 42)
    throw new Error("That TIFF file could not be read.");
  const ifdOffset = view.getUint32(4, littleEndian);
  const tags = readTiffTags(view, ifdOffset, littleEndian);
  const width = tiffTagValue(view, tags.get(256), littleEndian);
  const height = tiffTagValue(view, tags.get(257), littleEndian);
  const stripOffset = tiffTagValue(view, tags.get(273), littleEndian);
  const samplesPerPixel = tiffTagValue(view, tags.get(277), littleEndian) || 3;
  const bitsPerSampleTag = tags.get(258);
  const bitsPerSample =
    bitsPerSampleTag.count === 1
      ? tiffTagValue(view, bitsPerSampleTag, littleEndian)
      : 8;
  const compression = tiffTagValue(view, tags.get(259), littleEndian) || 1;
  if (
    bitsPerSample !== 8 ||
    compression !== 1 ||
    !width ||
    !height ||
    !stripOffset
  ) {
    throw new Error("That TIFF file could not be read.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const sourceOffset = stripOffset + pixel * samplesPerPixel;
    const targetOffset = pixel * 4;
    imageData.data[targetOffset] = bytes[sourceOffset];
    imageData.data[targetOffset + 1] =
      samplesPerPixel > 1 ? bytes[sourceOffset + 1] : bytes[sourceOffset];
    imageData.data[targetOffset + 2] =
      samplesPerPixel > 2 ? bytes[sourceOffset + 2] : bytes[sourceOffset];
    imageData.data[targetOffset + 3] =
      samplesPerPixel > 3 ? bytes[sourceOffset + 3] : 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function readTiffTags(view, ifdOffset, littleEndian) {
  const count = view.getUint16(ifdOffset, littleEndian);
  const tags = new Map();
  for (let index = 0; index < count; index += 1) {
    const offset = ifdOffset + 2 + index * 12;
    const tag = view.getUint16(offset, littleEndian);
    tags.set(tag, {
      type: view.getUint16(offset + 2, littleEndian),
      count: view.getUint32(offset + 4, littleEndian),
      valueOffset: offset + 8,
    });
  }
  return tags;
}

function tiffTagValue(view, tag, littleEndian) {
  if (!tag) return 0;
  if (tag.type === 3 && tag.count === 1)
    return view.getUint16(tag.valueOffset, littleEndian);
  if (tag.type === 4 && tag.count === 1)
    return view.getUint32(tag.valueOffset, littleEndian);
  const offset = view.getUint32(tag.valueOffset, littleEndian);
  return tag.type === 3
    ? view.getUint16(offset, littleEndian)
    : view.getUint32(offset, littleEndian);
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

  const channels = Array.from({ length: channelCount }, (_, index) =>
    audioBuffer.getChannelData(index),
  );
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
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
  const right =
    channelCount > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : null;
  const chunks = [];
  const frameSize = 1152;

  for (let offset = 0; offset < left.length; offset += frameSize) {
    const leftChunk = left.subarray(offset, offset + frameSize);
    const mp3Buffer = right
      ? encoder.encodeBuffer(
          leftChunk,
          right.subarray(offset, offset + frameSize),
        )
      : encoder.encodeBuffer(leftChunk);
    if (mp3Buffer.length) chunks.push(mp3Buffer);
  }

  const finalBuffer = encoder.flush();
  if (finalBuffer.length) chunks.push(finalBuffer);
  return new Blob(chunks, { type: "audio/mpeg" });
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = URL.createObjectURL(blob);
    trackObjectUrl(image.src);
  });
}

function revokeImage(image) {
  if (image.src) URL.revokeObjectURL(image.src);
}

function isHeic(file) {
  return (
    ["heic", "heif"].includes(extension(file.name)) ||
    /hei[cf]/i.test(file.type)
  );
}
