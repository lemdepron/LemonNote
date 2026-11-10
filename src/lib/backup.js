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
// Files is handled specially because it contains blobs.
const TABLES = [
  "Note",
  "Canvas",
  "DataTable",
  "CodeFile",
  "InkPage",
  "InkChunk",
  "Flashcard",
];

const FILE_TABLE = "Files";

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

/** Read all files, converting blobs to base64 for export. */
async function readAllFiles() {
  const entity = db.entities[FILE_TABLE];
  if (!entity) return [];
  const items = [];
  let cursor = null;
  let page;
  do {
    page = await entity.list({ cursor, limit: PAGE });
    for (const row of page.items) {
      // Convert blob to base64 for JSON serialization
      if (row.blob instanceof Blob) {
        const base64 = await blobToBase64(row.blob);
        items.push({ ...row, blob: base64, _isBlob: true });
      } else {
        items.push(row);
      }
    }
    cursor = page.next_cursor;
  } while (page.has_more);
  return items;
}

/** Convert a Blob to a base64 data URL. */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Convert a base64 data URL back to a Blob. */
function base64ToBlob(dataUrl) {
  // data URL format: data:<mime>;base64,<data>
  const parts = dataUrl.split(",");
  if (parts.length !== 2) throw new Error("Invalid data URL");
  const mime = parts[0].split(":")[1].split(";")[0];
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
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

/** Calculate total size of files in backup (for warning). */
function calculateBackupFileSize(backup) {
  let totalBytes = 0;
  const files = Array.isArray(backup.tables[FILE_TABLE]) ? backup.tables[FILE_TABLE] : [];
  for (const file of files) {
    if (file._isBlob && file.blob) {
      // Approximate: base64 is ~33% larger than binary
      totalBytes += Math.round(file.blob.length * 0.75);
    } else if (file.size) {
      totalBytes += file.size;
    }
  }
  return totalBytes;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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
  // Also preview files
  const incomingFiles = Array.isArray(backup.tables[FILE_TABLE]) ? backup.tables[FILE_TABLE] : [];
  const existingFiles = mode === "merge" ? await readAllIds(FILE_TABLE) : null;
  counts[FILE_TABLE] = tableCounts(incomingFiles, mode, existingFiles);
  return { tables: counts, mode };
}

/** Download-ready backup document: { app, version, exportedAt, tables: {...} }. */
export async function exportBackup() {
  const tables = {};
  for (const name of TABLES) {
    tables[name] = await readAll(name);
  }
  // Include files with blobs converted to base64
  tables[FILE_TABLE] = await readAllFiles();

  const backup = {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };

  // Add size info for warning
  const fileSize = calculateBackupFileSize(backup);
  backup._fileSize = fileSize;
  backup._fileSizeFormatted = formatBytes(fileSize);

  return backup;
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

  // Import files (convert base64 back to blobs)
  const incomingFiles = Array.isArray(backup.tables[FILE_TABLE]) ? backup.tables[FILE_TABLE] : [];
  const existingFiles = mode === "merge" ? await readAllIds(FILE_TABLE) : null;
  const { toKeep: filesToKeep, ...fileRest } = tableCounts(incomingFiles, mode, existingFiles);

  if (filesToKeep.length) {
    // Convert base64 back to blobs
    const filesWithBlobs = filesToKeep.map((file) => {
      if (file._isBlob && file.blob) {
        return { ...file, blob: base64ToBlob(file.blob) };
      }
      return file;
    });
    await db.entities[FILE_TABLE].bulkCreate(filesWithBlobs);
  }

  counts[FILE_TABLE] = fileRest;

  return { tables: counts, mode };
}
