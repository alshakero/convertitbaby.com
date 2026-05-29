import { inferFileKind } from "../formats.js";
import { copyOriginalFile } from "../lib/downloads.js";
import { extension } from "../lib/utils.js";
import { convertArchiveFile } from "./archive.js";
import { convertCopyOnlyFormat } from "./copy.js";
import {
  convertAudioFileToWav,
  convertAudioTrackToMp3,
  convertGifToVideo,
  convertImageFile,
  convertImageToIco,
  convertMediaFile,
  convertMidiFileToMp3,
  compressPdfFile,
  convertSingleImageToPdf,
  convertSvgToPdf,
  convertSvgToRaster,
  convertVideoToGif,
  pdfToPngFiles,
} from "./media.js";
import { convertModelFile } from "./model.js";
import {
  convertCertificateFile,
  convertCodeFile,
  convertConfigFile,
  convertDataFile,
  convertDocumentFile,
  convertEbookFile,
  convertEmailFile,
  convertGeoFile,
  convertOfficeFile,
  convertPaletteFile,
  convertPlaylistFile,
  convertSubtitleFile,
  convertWorkoutFile,
} from "./structured.js";

export async function convertQueueItem(file, output) {
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
    case "pdf-compress":
      return [await compressPdfFile(file)];
    case "pdf-png":
      return pdfToPngFiles(file);
    case "media":
      if (extension(file.name) === output.value) {
        return [copyOriginalFile(file, output.value)];
      }
      if (
        output.value === "mp3" &&
        ["audio", "video"].includes(inferFileKind(file))
      ) {
        return [await convertAudioTrackToMp3(file)];
      }
      if (output.value === "wav" && inferFileKind(file) === "audio") {
        return [await convertAudioFileToWav(file)];
      }
      return [await convertMediaFile(file, output.value)];
    case "midi":
      return [await convertMidiFileToMp3(file)];
    case "archive":
      return [await convertArchiveFile(file, output.value)];
    case "document":
      return [await convertDocumentFile(file, output.value)];
    case "office":
      return [await convertOfficeFile(file, output.value)];
    case "data":
      return [await convertDataFile(file, output.value)];
    case "config":
      return [await convertConfigFile(file, output.value)];
    case "email":
      return [await convertEmailFile(file, output.value)];
    case "certificate":
      return [await convertCertificateFile(file, output.value)];
    case "playlist":
      return [await convertPlaylistFile(file, output.value)];
    case "palette":
      return [await convertPaletteFile(file, output.value)];
    case "workout":
      return [await convertWorkoutFile(file, output.value)];
    case "subtitle":
      return [await convertSubtitleFile(file, output.value)];
    case "geo":
      return [await convertGeoFile(file, output.value)];
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
    case "copy":
      return [copyOriginalFile(file, extension(file.name))];
    default:
      throw new Error("Unsupported output.");
  }
}
