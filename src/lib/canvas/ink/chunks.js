// A record may not exceed 100 KB, and stored marks count roughly 2.4x their raw
// JSON, so a page's marks are sliced into shards of ~34 KB raw JSON each.
export const MAX_CHUNK_BYTES = 34000;

export function strokeBytes(stroke) {
  try {
    return new TextEncoder().encode(JSON.stringify(stroke)).length + 1;
  } catch {
    return 0;
  }
}

export function hashChunk(strokes) {
  const text = JSON.stringify(strokes || []);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${(strokes || []).length}:${(hash >>> 0).toString(36)}`;
}

export function chunkStrokes(strokes, maxBytes = MAX_CHUNK_BYTES) {
  const chunks = [];
  let current = [];
  let bytes = 0;
  (strokes || []).forEach((stroke) => {
    const size = strokeBytes(stroke);
    if (current.length && bytes + size > maxBytes) {
      chunks.push(current);
      current = [];
      bytes = 0;
    }
    current.push(stroke);
    bytes += size;
  });
  if (current.length) chunks.push(current);
  return chunks;
}