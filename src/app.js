import { convertQueueItem } from "./converters/index.js";
import { getOutputOptions, getSelectedOutput, inferFileKind } from "./formats.js";
import {
  formatFileKindLabel,
  formatOutputLabel,
  initI18n,
  itemStatusLabel,
  t,
} from "./i18n.js";
import { createZip } from "./lib/archive.js";
import { createDownload } from "./lib/downloads.js";
import { setObjectUrlTracker } from "./lib/runtime.js";
import { formatBytes } from "./lib/utils.js";

let activeConversionEvents = null;
const pendingConversionEvents = [];
const conversionEvents = {
  trackConversionBatch: (...args) =>
    trackOptionalConversionEvent("trackConversionBatch", args),
  trackConversionFailure: (...args) =>
    trackOptionalConversionEvent("trackConversionFailure", args),
  trackConversionSuccess: (...args) =>
    trackOptionalConversionEvent("trackConversionSuccess", args),
};

const state = {
  items: [],
  urls: [],
  isConverting: false,
  status: { key: "status.dropFiles", params: {} },
};

initI18n({
  onLanguageChange: () => {
    renderQueue();
    renderStatus();
  },
});
loadConversionEvents();
setObjectUrlTracker((url) => state.urls.push(url));

const fileInput = document.querySelector("#file-input");
const dropzone = document.querySelector(".dropzone");
const queuePanel = document.querySelector(".queue-panel");
const queueEl = document.querySelector(".file-queue");
const emptyQueueEl = document.querySelector(".empty-queue");
const actionBar = document.querySelector(".action-bar");
const actionSummary = document.querySelector("[data-action-summary]");
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
  const files = [...(fileList || [])];
  if (!files.length) {
    fileInput.value = "";
    setStatus("status.noFilesSelected");
    return;
  }

  let newItems;
  try {
    newItems = files.map(createQueueItem);
  } catch (error) {
    console.error(error);
    fileInput.value = "";
    if (error?.message) {
      setStatusText(error.message);
    } else {
      setStatus("status.couldNotAdd");
    }
    return;
  }

  state.items.push(...newItems);
  fileInput.value = "";
  renderQueue();
  setStatus("status.filesAdded", {
    added: newItems.length,
    total: state.items.length,
  });
  queuePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createQueueItem(file) {
  const kind = inferFileKind(file);
  const outputs = getOutputOptions({ kind, file });
  const defaultOutput = outputs.find((output) => !output.disabled);
  return {
    id: crypto.randomUUID(),
    file,
    kind,
    output: defaultOutput?.value || outputs[0]?.value || "",
    status: defaultOutput ? "ready" : outputs.length ? "unavailable" : "unsupported",
    errorMessage: "",
    downloads: [],
  };
}

function renderQueue() {
  queueEl.replaceChildren();
  emptyQueueEl.hidden = state.items.length > 0;
  const downloads = getAllDownloads();
  const hasConvertibleItems = state.items.some((item) => getSelectedOutput(item));
  const hasPendingConvertibleItems = state.items.some(
    (item) => getSelectedOutput(item) && item.status !== "done",
  );
  const showDownloadAction =
    downloads.length > 0 && !hasPendingConvertibleItems && !state.isConverting;
  actionBar.hidden = state.items.length === 0;
  actionSummary.textContent = actionSummaryLabel({
    downloads,
    hasPendingConvertibleItems,
  });
  goButton.hidden = showDownloadAction;
  goButton.disabled = state.isConverting || !hasConvertibleItems;
  clearButton.disabled = state.items.length === 0;
  downloadAllButton.hidden = !showDownloadAction;
  downloadAllButton.disabled = downloads.length === 0;

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
    meta.textContent = `${formatFileKindLabel(item.kind)} · ${formatBytes(item.file.size)}`;
    info.append(name, meta);

    const select = document.createElement("select");
    select.className = "output-select";
    select.id = `output-${item.id}`;
    select.name = `output-${item.id}`;
    select.ariaLabel = t("queue.outputFor", { filename: item.file.name });
    select.disabled = outputs.length === 0;
    outputs.forEach((output) => {
      const option = new Option(formatOutputLabel(output.label), output.value);
      option.selected = output.value === item.output;
      option.disabled = output.disabled;
      select.append(option);
    });
    select.addEventListener("change", () => {
      item.output = select.value;
      item.status = "ready";
      item.errorMessage = "";
      revokeItemDownloads(item);
      renderQueue();
    });

    const status = document.createElement("div");
    status.className = `item-status ${statusClass(item.status)}`;
    status.textContent = item.errorMessage || itemStatusLabel(item.status);

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.ariaLabel = t("queue.removeFile", { filename: item.file.name });
    remove.textContent = t("queue.remove");
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
    supportNote.hidden = !hasDisabledOutputs || item.status === "done";
    supportNote.textContent = t("queue.supportNote");

    row.append(info, select, status, remove, supportNote, downloads);
    queueEl.append(row);
  });
}

function actionSummaryLabel({ downloads, hasPendingConvertibleItems }) {
  if (state.isConverting) {
    return t("action.converting", { count: state.items.length });
  }
  if (downloads.length > 0 && !hasPendingConvertibleItems) {
    return t("action.converted", { count: downloads.length });
  }
  return t("action.ready", { count: state.items.length });
}

async function convertAll() {
  if (state.isConverting) return;

  clearDownloads();
  const convertible = state.items.filter((item) => getSelectedOutput(item));
  if (!convertible.length) {
    setStatus("status.addSupportedFiles");
    return;
  }

  setConversionActive(true);
  setProgress(0);
  setStatus("status.converting", { count: convertible.length });
  const batchStartedAt = performance.now();
  let completed = 0;

  try {
    renderQueue();

    const results = await Promise.allSettled(
      convertible.map(async (item) => {
        item.status = "converting";
        item.errorMessage = "";
        revokeItemDownloads(item);
        renderQueue();
        const output = getSelectedOutput(item);
        const conversionStartedAt = performance.now();

        try {
          const downloads = await convertQueueItem(item.file, output);
          item.downloads = downloads.map((download) =>
            createDownload(download.blob, download.filename, download.mimeType),
          );
          item.status = "done";
          completed += 1;
          conversionEvents.trackConversionSuccess({
            file: item.file,
            inputKind: item.kind,
            output,
            durationMs: performance.now() - conversionStartedAt,
          });
          setProgress(completed / convertible.length);
          renderQueue();
        } catch (error) {
          conversionEvents.trackConversionFailure({
            file: item.file,
            inputKind: item.kind,
            output,
            durationMs: performance.now() - conversionStartedAt,
            error,
          });
          throw error;
        }
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const item = convertible[index];
        item.status = "failed";
        item.errorMessage = result.reason?.message || "";
      }
    });

    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length;
    conversionEvents.trackConversionBatch({
      conversionCount: convertible.length,
      failureCount: failed,
      durationMs: performance.now() - batchStartedAt,
    });
    setProgress(1);
    if (failed) {
      setStatus("status.doneFailed", {
        done: convertible.length - failed,
        failed,
      });
    } else {
      setStatus("status.converted", { count: convertible.length });
    }
  } finally {
    setConversionActive(false);
    renderQueue();
  }
}

async function downloadAll() {
  const downloads = getAllDownloads();
  if (!downloads.length) return;

  downloadAllButton.disabled = true;
  setStatus("status.preparingDownload", { count: downloads.length });

  try {
    if (downloads.length === 1) {
      triggerDownload(downloads[0]);
      setStatus("status.downloaded", { filename: downloads[0].filename });
      return;
    }

    const zipBlob = await createZip(downloads);
    const url = URL.createObjectURL(zipBlob);
    state.urls.push(url);
    triggerDownload({
      url,
      filename: `convertitbaby-${new Date().toISOString().slice(0, 10)}.zip`,
    });
    setStatus("status.downloadedZip", { count: downloads.length });
  } catch (error) {
    console.error(error);
    if (error?.message) {
      setStatusText(error.message);
    } else {
      setStatus("status.couldNotPrepareDownload");
    }
  } finally {
    renderQueue();
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
  setStatus("status.dropFiles");
}

function clearDownloads() {
  state.urls.splice(0).forEach((url) => URL.revokeObjectURL(url));
}

function getAllDownloads() {
  return state.items.flatMap((item) => item.downloads);
}

function setStatus(key, params = {}) {
  state.status = { key, params };
  renderStatus();
}

function setStatusText(message) {
  state.status = { message };
  renderStatus();
}

function renderStatus() {
  statusEl.textContent = state.status.key
    ? t(state.status.key, state.status.params)
    : state.status.message;
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

function loadConversionEvents() {
  import("./lib/conversion-events.js")
    .then((module) => {
      activeConversionEvents = module;
      pendingConversionEvents.splice(0).forEach(([name, args]) => {
        module[name]?.(...args);
      });
    })
    .catch(() => {
      pendingConversionEvents.length = 0;
    });
}

function trackOptionalConversionEvent(name, args) {
  if (activeConversionEvents) {
    activeConversionEvents[name]?.(...args);
    return;
  }
  pendingConversionEvents.push([name, args]);
}
