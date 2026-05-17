const lazyModules = {};
let mp3EncoderCtorPromise;

export function getMp3EncoderCtor() {
  mp3EncoderCtorPromise ||= loadLameRaw().then((module) => {
    const loadLame = new Function(`${module.default}\nreturn lamejs;`);
    return loadLame().Mp3Encoder;
  });
  return mp3EncoderCtorPromise;
}

export function loadHeic2Any() {
  lazyModules.heic2any ||= import("heic2any");
  return lazyModules.heic2any;
}

export function loadPdfLib() {
  lazyModules.pdfLib ||= import("pdf-lib");
  return lazyModules.pdfLib;
}

export function loadMediabunny() {
  lazyModules.mediabunny ||= import("mediabunny");
  return lazyModules.mediabunny;
}

export function loadGifuct() {
  lazyModules.gifuct ||= import("gifuct-js");
  return lazyModules.gifuct;
}

export function loadGifenc() {
  lazyModules.gifenc ||= import("gifenc");
  return lazyModules.gifenc;
}

function loadLameRaw() {
  lazyModules.lameRaw ||= import("lamejs/lame.all.js?raw");
  return lazyModules.lameRaw;
}

export async function loadPdfJs() {
  lazyModules.pdfJs ||= Promise.all([
    import("pdfjs-dist/build/pdf.mjs"),
    import("pdfjs-dist/build/pdf.worker.mjs?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return lazyModules.pdfJs;
}
