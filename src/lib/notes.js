import { db } from "@/api/localDb";
import { deletePage } from "@/lib/ink/store";
import { findAttachmentRefs, deleteUnusedAttachments } from "@/lib/attachments";

/** Soft-delete lifecycle for notes: trash → restore, or permanent delete. */
export const TRASH_RETENTION_DAYS = 60;
export const NOT_TRASHED = { trashed: { $ne: true } };

const DAY = 86400000;
const cutoffIso = () => new Date(Date.now() - TRASH_RETENTION_DAYS * DAY).toISOString();

export async function listActiveNotes({ sort = "-updated_date", limit = 300 } = {}) {
  const page = await db.entities.Note.filter(NOT_TRASHED, { sort, limit });
  return page?.items ?? [];
}

export async function listTrashedNotes() {
  const page = await db.entities.Note.filter({ trashed: true }, { sort: "-trashed_date", limit: 200 });
  return page?.items ?? [];
}

export function trashNote(id) {
  return db.entities.Note.update(id, { trashed: true, trashed_date: new Date().toISOString() });
}

export function restoreNote(id) {
  return db.entities.Note.update(id, { trashed: false, trashed_date: null });
}

/** The handwriting of a note goes with it; a missing ink page is not an error. */
const dropInk = async (note) => {
  if (note?.ink_page_id) await deletePage(note.ink_page_id).catch(() => {});
};

/**
 * Find attachment refs used by a specific note.
 * @param {string} noteId - The note ID
 * @returns {Promise<Set<string>>} - Set of attachment refs used by this note
 */
async function getNoteAttachmentRefs(noteId) {
  const note = await db.entities.Note.get(noteId).catch(() => null);
  if (!note) return new Set();
  return new Set(findAttachmentRefs(note.body));
}

/**
 * Check if an attachment ref is used by any note other than the given one.
 * @param {string} ref - The attachment reference
 * @param {string} excludeNoteId - Note ID to exclude from check
 * @returns {Promise<boolean>} - True if used by another note
 */
async function isAttachmentUsedElsewhere(ref, excludeNoteId) {
  const notes = await db.entities.Note.list({ limit: 10000 });
  for (const note of notes.items) {
    if (note.id === excludeNoteId) continue;
    if (findAttachmentRefs(note.body).includes(ref)) return true;
  }
  return false;
}

export async function deleteNoteForever(id) {
  const note = await db.entities.Note.get(id).catch(() => null);
  await dropInk(note);
  await db.entities.Note.delete(id);
  
  // Clean up attachments that were only used by this note
  if (note?.body) {
    const refs = findAttachmentRefs(note.body);
    for (const ref of refs) {
      const usedElsewhere = await isAttachmentUsedElsewhere(ref, id);
      if (!usedElsewhere) {
        // Delete the attachment
        await db.deleteFile(String(ref).replace(/^local:/, "")).catch(() => {});
      }
    }
  }
  
  return { success: true };
}

/** Anything past the 60-day window is removed on the next trash visit. */
export async function purgeExpiredNotes() {
  const query = { trashed: true, trashed_date: { $lt: cutoffIso() } };
  const expired = await db.entities.Note.filter(query, { limit: 500 });
  for (const note of expired?.items ?? []) await dropInk(note);
  return db.entities.Note.deleteMany(query);
}

export function daysRemaining(trashedDate) {
  const then = new Date(trashedDate || Date.now()).getTime();
  if (Number.isNaN(then)) return TRASH_RETENTION_DAYS;
  const elapsed = Math.floor((Date.now() - then) / DAY);
  return Math.max(0, TRASH_RETENTION_DAYS - elapsed);
}

/* ---------- folders ---------- */

export async function moveNotesToFolder(noteIds, folder) {
  const updates = noteIds.map((id) => ({ id, folder }));
  return db.entities.Note.bulkUpdate(updates);
}

export async function deleteFolder(folder, notes) {
  // Move all notes in this folder to parent folder (or unfiled if no parent)
  const folderNotes = notes.filter((note) => note.folder === folder);
  const noteIds = folderNotes.map((note) => note.id);
  
  // Determine parent folder
  const parts = folder.split("/").filter(Boolean);
  const parentFolder = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  
  if (noteIds.length > 0) {
    await moveNotesToFolder(noteIds, parentFolder);
  }
  
  return { moved: noteIds.length, parentFolder };
}

export async function renameFolder(oldFolder, newFolder, notes) {
  // Update all notes with oldFolder prefix to newFolder prefix
  const updates = notes
    .filter((note) => note.folder === oldFolder || note.folder.startsWith(oldFolder + "/"))
    .map((note) => {
      let newPath = note.folder;
      if (note.folder === oldFolder) {
        newPath = newFolder;
      } else if (note.folder.startsWith(oldFolder + "/")) {
        newPath = newFolder + note.folder.slice(oldFolder.length);
      }
      return { id: note.id, folder: newPath };
    });
  
  if (updates.length > 0) {
    await db.entities.Note.bulkUpdate(updates);
  }
  
  return { updated: updates.length };
}

/* ---------- favourites ---------- */

export async function toggleFavourite(noteId) {
  const note = await db.entities.Note.get(noteId);
  return db.entities.Note.update(noteId, { favourite: !note.favourite });
}

export async function setFavourite(noteId, favourite) {
  return db.entities.Note.update(noteId, { favourite });
}