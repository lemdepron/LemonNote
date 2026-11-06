import { db } from "@/api/localDb";
import { deletePage } from "@/lib/ink/store";

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

export async function deleteNoteForever(id) {
  const note = await db.entities.Note.get(id).catch(() => null);
  await dropInk(note);
  return db.entities.Note.delete(id);
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