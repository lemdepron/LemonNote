import { simplifyStroke } from "@/lib/ink/smoothing";

// Compact stroke storage. Samples are simplified, then written as delta steps in
// base-64 tokens (one two-character token per point), which keeps a dense page a
// few hundred KB instead of several MB.
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
const INDEX = new Map(Array.from(ALPHABET, (char, index) => [char, index]));
const SCALE = 2; // half-pixel resolution
const SPAN = 32; // steps of -32..31 fit in a single token
const TOLERANCE = 0.5;

const zig = (value) => (value << 1) ^ (value >> 31);
const unzig = (value) => (value >>> 1) ^ -(value & 1);

export function encodePoints(points) {
  let px = 0;
  let py = 0;
  let out = "";
  (points || []).forEach((point) => {
    const x = Math.round(point[0] * SCALE);
    const y = Math.round(point[1] * SCALE);
    const dx = x - px;
    const dy = y - py;
    px = x;
    py = y;
    if (dx >= -SPAN && dx < SPAN && dy >= -SPAN && dy < SPAN) {
      out += ALPHABET[dx + SPAN] + ALPHABET[dy + SPAN];
    } else {
      out += `~${zig(dx).toString(36)}.${zig(dy).toString(36)};`;
    }
  });
  return out;
}

export function decodePoints(path) {
  const text = path || "";
  const points = [];
  let px = 0;
  let py = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "~") {
      const end = text.indexOf(";", i);
      const body = text.slice(i + 1, end === -1 ? text.length : end);
      const [a, b] = body.split(".");
      px += unzig(parseInt(a, 36) || 0);
      py += unzig(parseInt(b, 36) || 0);
      i = end === -1 ? text.length : end + 1;
    } else {
      px += (INDEX.get(text[i]) ?? SPAN) - SPAN;
      py += (INDEX.get(text[i + 1]) ?? SPAN) - SPAN;
      i += 2;
    }
    points.push([px / SCALE, py / SCALE]);
  }
  return points;
}

export function encodePressures(pressures) {
  if (!pressures?.length) return "";
  let out = "";
  pressures.forEach((value) => {
    const index = Math.max(0, Math.min(63, Math.round((value ?? 0.65) * 63)));
    out += ALPHABET[index];
  });
  return out;
}

export function decodePressures(text, length) {
  if (!text) return undefined;
  const out = [];
  for (let i = 0; i < Math.min(length, text.length); i += 1) {
    out.push((INDEX.get(text[i]) ?? 41) / 63);
  }
  return out;
}

export function packStroke(stroke) {
  if (!stroke?.points?.length) return { ...stroke };
  const { points, pressures, ...rest } = stroke;
  // `simple` marks a stroke that was already thinned, so re-saving a loaded page
  // reproduces the exact same bytes and unchanged shards are never rewritten.
  const source = rest.simple ? { points, pressures: pressures || [] } : simplifyStroke(points, pressures || [], TOLERANCE);
  return { ...rest, simple: true, path: encodePoints(source.points), press: encodePressures(source.pressures) };
}

export function unpackStroke(stroke) {
  if (!stroke?.path) return stroke;
  const { path, press, ...rest } = stroke;
  const points = decodePoints(path);
  return { ...rest, points, pressures: decodePressures(press, points.length) };
}