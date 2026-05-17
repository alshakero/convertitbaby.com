import { copyOriginalFile } from "../lib/downloads.js";
import { extension } from "../lib/utils.js";

export function convertCopyOnlyFormat(file, outputValue, label) {
  if (extension(file.name) === outputValue)
    return copyOriginalFile(file, outputValue);
  throw new Error(`That ${label} output is not available for this file.`);
}
