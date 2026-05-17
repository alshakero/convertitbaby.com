let objectUrlTracker = () => {};

export function setObjectUrlTracker(tracker) {
  objectUrlTracker = typeof tracker === "function" ? tracker : () => {};
}

export function trackObjectUrl(url) {
  objectUrlTracker(url);
  return url;
}
