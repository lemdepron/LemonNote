import { db } from "@/api/localDb";
import { chunkStrokes, hashChunk } from "@/lib/ink/chunks";
import { packStroke, unpackStroke } from "@/lib/ink/path";

const PAGE_SIZE = 100;

function pageFields(snapshot) {
  return {
    name: snapshot.name || "Untitled page",
    strokes: [],
    markCount: (snapshot.strokes || []).length,
    paper: snapshot.paper,
    camera: snapshot.camera || { x: 0, y: 0, scale: 1 },
    audio: snapshot.audio ?? null,
    ocrText: snapshot.ocrText || "",
  };
}

async function eachChunk(pageId, visit) {
  let cursor = null;
  for (let guard = 0; guard < 40; guard += 1) {
    const page = await db.entities.InkChunk.filter(
      { pageId },
      { sort: "index", limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }
    );
    const chunks = page?.items ?? [];
    chunks.forEach(visit);
    if (!page?.has_more || !page?.next_cursor) break;
    cursor = page.next_cursor;
  }
}

// Registry maps a shard position to its record id and content hash, so a save
// only rewrites the slices that actually changed.
export async function loadPage(pageId) {
  const record = await db.entities.InkPage.get(pageId);
  const registry = new Map();
  const strokes = [];
  await eachChunk(pageId, (chunk) => {
    registry.set(chunk.index, { id: chunk.id, hash: hashChunk(chunk.strokes || []) });
    (chunk.strokes || []).forEach((stroke) => strokes.push(unpackStroke(stroke)));
  });
  if (!registry.size) {
    return { page: record, strokes: Array.isArray(record.strokes) ? record.strokes : [], registry };
  }
  return { page: record, strokes, registry };
}

export async function savePage(snapshot, registry) {
  const groups = chunkStrokes((snapshot.strokes || []).map(packStroke));
  const writes = [];
  groups.forEach((group, index) => {
    const hash = hashChunk(group);
    const known = registry.get(index);
    if (known && known.hash === hash) return;
    writes.push({ index, id: known?.id || null, strokes: group, hash });
  });

  const updates = writes.filter((write) => write.id);
  const fresh = writes.filter((write) => !write.id);

  for (let i = 0; i < updates.length; i += 20) {
    await db.entities.InkChunk.bulkUpdate(
      updates.slice(i, i + 20).map(({ id, index, strokes }) => ({ id, index, strokes }))
    );
  }
  updates.forEach((write) => registry.set(write.index, { id: write.id, hash: write.hash }));

  for (let i = 0; i < fresh.length; i += 10) {
    const batch = fresh.slice(i, i + 10);
    const created = await db.entities.InkChunk.bulkCreate(
      batch.map(({ index, strokes }) => ({ pageId: snapshot.id, index, strokes }))
    );
    const byIndex = new Map((created || []).map((entry) => [entry.index, entry.id]));
    batch.forEach((write) => registry.set(write.index, { id: byIndex.get(write.index) || null, hash: write.hash }));
  }

  const stale = [];
  registry.forEach((known, index) => {
    if (index >= groups.length) {
      if (known.id) stale.push(known.id);
      registry.delete(index);
    }
  });
  await Promise.all(stale.map((id) => db.entities.InkChunk.delete(id).catch(() => {})));

  await db.entities.InkPage.update(snapshot.id, pageFields(snapshot));
}

export async function deletePage(pageId) {
  const ids = [];
  await eachChunk(pageId, (chunk) => ids.push(chunk.id));
  await Promise.all(ids.map((id) => db.entities.InkChunk.delete(id).catch(() => {})));
  await db.entities.InkPage.delete(pageId);
}