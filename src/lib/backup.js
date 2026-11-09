/**
 * LemonNote vault backup.
 *
 * exportBackup() reads every record from every table through the db API and
 * packs them into one JSON document. importBackup(data, mode) validates that
 * document and writes the records back. mode "merge" keeps existing records and
 * skips ids that already exist; mode "replace" wipes each table first.
 *
 * No IndexedDB is touched directly here — everything goes through
 * src/api/localDb.js, whose public shape stays untouched.
 */

import { db } from "../api/localDb.js";

const APP = "LemonNote";
const VERSION = 1;
const PAGE = 1000;

// Every table the app saves. If localDb.js adds a table, add it here too.
const TABLES = [
  "Note",
  "Canvas",
  "DataTable",
  "CodeFile",
  "InkPage",
  "InkChunk",
  "Flashcard",
];

/** Read every row of one table, paging through the cursor-based db API. */
async function readAll(tableName) {
  const entity = db.entities[tableName];
  if (!entity) throw new Error(`Unknown table: ${tableName}`);
  const items = [];
  let cursor = null;
  let page;
  do {
    page = await entity.list({ cursor, limit: PAGE });
    items.push(...page.items);
    cursor = page.next_cursor;
  } while (page.has_more);
  return items;
}

/** Read every id of one table (read-only, used for merge skip counts). */
async function readAllIds(tableName) {
  const rows = await readAll(tableName);
  return new Set(rows.map((row) => row.id));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Throw unless data looks like a LemonNote backup this app understands. */
function validateBackup(data) {
  if (!isPlainObject(data)) {
    throw new Error("Backup file is not a valid JSON object.");
  }
  if (data.app !== APP) {
    throw new Error(`This backup is for "${data.app ?? "unknown"}", not LemonNote.`);
  }
  if (data.version !== VERSION) {
    throw new Error(`Backup version ${data.version ?? "unknown"} is not supported (this app is ${VERSION}).`);
  }
  if (!isPlainObject(data.tables)) {
    throw new Error("Backup is missing table data.");
  }
  return data;
}

function tableCounts(incoming, mode, existing) {
  const toKeep = incoming.filter(
    (row) => row && typeof row === "object" && row.id && !existing?.has(row.id)
  );
  return {
    incoming: incoming.length,
    imported: toKeep.length,
    skipped: mode === "merge" ? incoming.length - toKeep.length : 0,
    toKeep,
  };
}

/** Count what importBackup would do, without writing anything. */
export async function previewBackup(data, mode = "merge") {
  if (mode !== "merge" && mode !== "replace") {
    throw new Error('mode must be "merge" or "replace".');
  }
  const backup = validateBackup(data);
  const counts = {};
  for (const name of TABLES) {
    const incoming = Array.isArray(backup.tables[name]) ? backup.tables[name] : [];
    const existing = mode === "merge" ? await readAllIds(name) : null;
    counts[name] = tableCounts(incoming, mode, existing);
  }
  return { tables: counts, mode };
}

/** Download-ready backup document: { app, version, exportedAt, tables: {...} }. */
export async function exportBackup() {
  const tables = {};
  for (const name of TABLES) {
    tables[name] = await readAll(name);
  }
  return {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

/** Restore records from a backup document. Returns counts per table. */
export async function importBackup(data, mode = "merge") {
  if (mode !== "merge" && mode !== "replace") {
    throw new Error('mode must be "merge" or "replace".');
  }
  const backup = validateBackup(data);

  const counts = {};
  for (const name of TABLES) {
    const incoming = Array.isArray(backup.tables[name]) ? backup.tables[name] : [];
    const existing = mode === "merge" ? await readAllIds(name) : null;

    if (mode === "replace") {
      await db.entities[name].deleteMany({});
    }

    const { toKeep, ...rest } = tableCounts(incoming, mode, existing);
    if (toKeep.length) {
      await db.entities[name].bulkCreate(toKeep);
    }

    counts[name] = rest;
  }

  return { tables: counts, mode };
}
