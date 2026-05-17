import { convertQueueItem } from "./converters/index.js";
import {
  fileKindLabel,
  getOutputOptions,
  getSelectedOutput,
  inferFileKind,
} from "./formats.js";
import { createZip } from "./lib/archive.js";
import { createDownload } from "./lib/downloads.js";
import { setObjectUrlTracker } from "./lib/runtime.js";
import { formatBytes } from "./lib/utils.js";

const state = {
  items: [],
  urls: [],
  isConverting: false,
};

setObjectUrlTracker((url) => state.urls.push(url));

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

dropzone.addEventListener("drop", (event) =>
  addFiles(event.dataTransfer.files),
);
goButton.addEventListener("click", convertAll);
clearButton.addEventListener("click", clearQueue);
downloadAllButton.addEventListener("click", downloadAll);
window.addEventListener("beforeunload", warnBeforeLeavingDuringConversion);

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
      status: defaultOutput
        ? "Ready"
        : outputs.length
          ? "Unavailable"
          : "Unsupported",
      downloads: [],
    };
  });

  state.items.push(...newItems);
  fileInput.value = "";
  renderQueue();
  setStatus(
    state.items.length
      ? `${state.items.length} file${state.items.length === 1 ? "" : "s"} ready.`
      : "Drop files to begin.",
  );
  queuePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderQueue() {
  queueEl.replaceChildren();
  emptyQueueEl.hidden = state.items.length > 0;
  goButton.disabled =
    state.isConverting || !state.items.some((item) => getSelectedOutput(item));
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
    item.downloads.forEach((download) =>
      downloads.append(createDownloadLink(download)),
    );

    const supportNote = document.createElement("p");
    supportNote.className = "support-note";
    supportNote.hidden = !hasDisabledOutputs || item.status === "Done";
    supportNote.textContent = "Some outputs are unavailable for this file.";

    row.append(info, select, status, remove, supportNote, downloads);
    queueEl.append(row);
  });
}

async function convertAll() {
  if (state.isConverting) return;

  clearDownloads();
  const convertible = state.items.filter((item) => getSelectedOutput(item));
  if (!convertible.length) {
    setStatus("Add supported files first.");
    return;
  }

  setConversionActive(true);
  setProgress(0);
  setStatus(
    `Converting ${convertible.length} file${convertible.length === 1 ? "" : "s"}...`,
  );
  let completed = 0;

  try {
    renderQueue();

    const results = await Promise.allSettled(
      convertible.map(async (item) => {
        item.status = "Converting";
        revokeItemDownloads(item);
        renderQueue();
        const output = getSelectedOutput(item);
        const downloads = await convertQueueItem(item.file, output);
        item.downloads = downloads.map((download) =>
          createDownload(download.blob, download.filename, download.mimeType),
        );
        item.status = "Done";
        completed += 1;
        setProgress(completed / convertible.length);
        renderQueue();
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const item = convertible[index];
        item.status = result.reason?.message || "Failed";
      }
    });

    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length;
    setProgress(1);
    setStatus(
      failed
        ? `${convertible.length - failed} done, ${failed} failed.`
        : `Converted ${convertible.length} file${convertible.length === 1 ? "" : "s"}.`,
    );
  } finally {
    setConversionActive(false);
    renderQueue();
  }
}

async function downloadAll() {
  const downloads = getAllDownloads();
  if (!downloads.length) return;

  downloadAllButton.disabled = true;
  setStatus(
    `Preparing ${downloads.length} file${downloads.length === 1 ? "" : "s"} for download...`,
  );

  try {
    if (downloads.length === 1) {
      triggerDownload(downloads[0]);
      setStatus(`Downloaded ${downloads[0].filename}.`);
      return;
    }

    const zipBlob = await createZip(downloads);
    const url = URL.createObjectURL(zipBlob);
    state.urls.push(url);
    triggerDownload({
      url,
      filename: `convertitbaby-${new Date().toISOString().slice(0, 10)}.zip`,
    });
    setStatus(
      `Downloaded ${downloads.length} file${downloads.length === 1 ? "" : "s"} as a ZIP.`,
    );
  } catch (error) {
    console.error(error);
    setStatus(error?.message || "Could not prepare the batch download.");
  } finally {
    downloadAllButton.disabled = getAllDownloads().length === 0;
  }
}

function statusClass(status) {
  const value = status.toLowerCase();
  if (value === "done") return "done";
  if (value === "converting") return "converting";
  if (value === "unsupported") return "unsupported";
  if (value === "unavailable") return "unavailable";
  if (
    value.includes("fail") ||
    value.includes("error") ||
    value.includes("cannot")
  )
    return "failed";
  return "";
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

function triggerDownload(download) {
  const link = document.createElement("a");
  link.href = download.url;
  link.download = download.filename;
  document.body.append(link);
  link.click();
  link.remove();
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

function setStatus(message) {
  statusEl.textContent = message;
}

function setConversionActive(isConverting) {
  state.isConverting = isConverting;
}

function warnBeforeLeavingDuringConversion(event) {
  if (!state.isConverting) return;

  event.preventDefault();
  event.returnValue = "";
}

function setProgress(value) {
  if (value === null) {
    progressEl.hidden = true;
    progressBar.style.setProperty("--progress", "0%");
    return;
  }
  progressEl.hidden = false;
  progressBar.style.setProperty(
    "--progress",
    `${Math.max(0, Math.min(100, value * 100))}%`,
  );
}
