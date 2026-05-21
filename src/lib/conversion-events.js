import { extension } from "./utils.js";

const MAX_FAILURE_MESSAGE_LENGTH = 120;

export function trackConversionSuccess({ file, inputKind, output, durationMs }) {
  trackEvent("file_conversion", {
    ...conversionParams({ file, inputKind, output, durationMs }),
    status: "success",
  });
}

export function trackConversionFailure({
  file,
  inputKind,
  output,
  durationMs,
  error,
}) {
  trackEvent("file_conversion", {
    ...conversionParams({ file, inputKind, output, durationMs }),
    status: "failure",
    failure_name: error?.name || "Error",
    failure_message: sanitizeFailureMessage(error?.message),
  });
}

export function trackConversionBatch({
  conversionCount,
  failureCount,
  durationMs,
}) {
  trackEvent("conversion_batch", {
    conversion_count: conversionCount,
    failure_count: failureCount,
    duration_ms: roundedDuration(durationMs),
    status: failureCount ? "partial_failure" : "success",
  });
}

function conversionParams({ file, inputKind, output, durationMs }) {
  return {
    input_format: formatInput(file, inputKind),
    output_format: formatOutput(output),
    conversion_kind: output?.kind || "unknown",
    duration_ms: roundedDuration(durationMs),
  };
}

function formatInput(file, inputKind) {
  return (
    extension(file?.name || "") ||
    formatMime(file?.type) ||
    inputKind ||
    "unknown"
  );
}

function formatOutput(output) {
  return formatMime(output?.value) || output?.value || output?.label || "unknown";
}

function formatMime(value = "") {
  if (!value.includes("/")) return "";

  const subtype = value.split("/").pop() || "";
  return subtype.replace(/^x-/, "").replace("jpeg", "jpg");
}

function roundedDuration(durationMs) {
  return Math.max(0, Math.round(durationMs || 0));
}

function sanitizeFailureMessage(message = "") {
  return message.slice(0, MAX_FAILURE_MESSAGE_LENGTH) || "Conversion failed";
}

function trackEvent(name, params) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  try {
    window.gtag("event", name, {
      event_category: "conversion",
      transport_type: "beacon",
      ...params,
    });
  } catch (error) {
    console.warn("Could not record conversion event.", error);
  }
}
