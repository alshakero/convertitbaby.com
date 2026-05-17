import { copyOriginalFile, textDownload } from "../lib/downloads.js";
import { extension, readUint32, rename } from "../lib/utils.js";

export async function convertModelFile(file, outputValue) {
  const ext = extension(file.name);
  if (ext === outputValue) return copyOriginalFile(file, outputValue);
  if (ext === "obj" && outputValue === "stl") {
    return textDownload(
      objToStl(await file.text()),
      rename(file.name, "stl"),
      "model/stl",
    );
  }
  if (ext === "stl" && outputValue === "obj") {
    return textDownload(
      stlToObj(await file.text()),
      rename(file.name, "obj"),
      "model/obj",
    );
  }
  if (ext === "gltf" && outputValue === "glb") {
    return {
      blob: gltfToGlb(await file.text()),
      filename: rename(file.name, "glb"),
      mimeType: "model/gltf-binary",
    };
  }
  if (ext === "glb" && outputValue === "gltf") {
    return textDownload(
      await glbToGltf(file),
      rename(file.name, "gltf"),
      "model/gltf+json",
    );
  }
  throw new Error("That 3D output is not available for this file.");
}

function objToStl(text) {
  const vertices = [];
  const facets = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") vertices.push(parts.slice(1, 4).map(Number));
    if (parts[0] === "f") {
      const indexes = parts
        .slice(1)
        .map((part) => Number(part.split("/")[0]) - 1);
      for (let index = 1; index < indexes.length - 1; index += 1) {
        facets.push([
          vertices[indexes[0]],
          vertices[indexes[index]],
          vertices[indexes[index + 1]],
        ]);
      }
    }
  }
  return `solid converted\n${facets.map((facet) => `  facet normal 0 0 0\n    outer loop\n${facet.map((vertex) => `      vertex ${vertex.join(" ")}`).join("\n")}\n    endloop\n  endfacet`).join("\n")}\nendsolid converted\n`;
}

function stlToObj(text) {
  const vertices = [
    ...text.matchAll(/vertex\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/g),
  ].map((match) => match.slice(1, 4).map(Number));
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
  if (readUint32(bytes, 0) !== 0x46546c67)
    throw new Error("That GLB file could not be read.");
  const jsonLength = readUint32(bytes, 12);
  return new TextDecoder().decode(bytes.slice(20, 20 + jsonLength)).trim();
}

function align4(value) {
  return Math.ceil(value / 4) * 4;
}
