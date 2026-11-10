/**
 * LemonNote attachment system.
 *
 * Attachments are files (images, audio, etc.) stored as blobs in the _files
 * IndexedDB store. Notes reference them with markdown like:
 *   ![alt text](local:<id>)
 *
 * This module provides a clean API for adding, reading, and deleting attachments.
 * All storage goes through src/api/localDb.js.
 */

import { db, getDb, putFile, getFile, deleteFile, createFileObjectUrl } from "@/api/localDb";

const FILE_STORE = "_files";

/** In-memory cache of object URLs so we don't create duplicate blob URLs. */
const urlCache = new Map();

/**
 * Generate a new short ID.
 * Mirrors the algorithm in localDb.js.
 */
function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/**
 * Store a file as an attachment.
 * @param {File} file - The file to store
 * @returns {Promise<{ id: string, name: string, type: string, size: number, ref: string }>}
 */
export async function addAttachment(file) {
  if (!file || !(file instanceof Blob)) {
    throw new Error("Expected a File or Blob");
  }
  const result = await putFile(file);
  return result;
}

/**
 * Get an object URL for an attachment reference.
 * The URL is cached and will be revoked when the page unloads or when
 * deleteAttachment is called for that reference.
 * @param {string} ref - The attachment reference (e.g., "local:abc123")
 * @returns {Promise<string>} - Object URL that can be used as an image src
 */
export async function getAttachmentUrl(ref) {
  const id = String(ref || "").replace(/^local:/, "");
  if (!id) throw new Error("Invalid attachment reference");

  // Return cached URL if available
  if (urlCache.has(id)) {
    return urlCache.get(id);
  }

  const url = await createFileObjectUrl(id);
  urlCache.set(id, url);
  return url;
}

/**
 * Delete an attachment and revoke its object URL if cached.
 * @param {string} ref - The attachment reference (e.g., "local:abc123")
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteAttachment(ref) {
  const id = String(ref || "").replace(/^local:/, "");
  if (!id) return { success: false };

  // Revoke cached URL
  if (urlCache.has(id)) {
    URL.revokeObjectURL(urlCache.get(id));
    urlCache.delete(id);
  }

  await deleteFile(id);

  return { success: true };
}

/**
 * Get attachment metadata without loading the blob.
 * @param {string} ref - The attachment reference (e.g., "local:abc123")
 * @returns {Promise<{ id: string, name: string, type: string, size: number, created_date: string } | null>}
 */
export async function getAttachmentInfo(ref) {
  const id = String(ref || "").replace(/^local:/, "");
  if (!id) return null;

  const row = await getFile(id);
  if (!row) return null;
  return { id: row.id, name: row.name, type: row.type, size: row.size, created_date: row.created_date };
}

/**
 * Find all attachment references used in a markdown string.
 * @param {string} markdown - The markdown text to search
 * @returns {string[]} - Array of attachment references (e.g., ["local:abc123"])
 */
export function findAttachmentRefs(markdown) {
  if (!markdown) return [];
  const regex = /!\[([^\]]*)\]\((local:[^)]+)\)/g;
  const refs = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    refs.push(match[2]);
  }
  return refs;
}

/**
 * Find all attachment references used across all notes.
 * @returns {Promise<Set<string>>} - Set of attachment references in use
 */
export async function findAllUsedAttachmentRefs() {
  const notes = await db.entities.Note.list({ limit: 10000 });
  const refs = new Set();
  for (const note of notes.items) {
    findAttachmentRefs(note.body).forEach((ref) => refs.add(ref));
  }
  return refs;
}

/**
 * Delete attachments that are not referenced by any note.
 * @returns {Promise<{ deleted: number }>}
 */
export async function deleteUnusedAttachments() {
  const usedRefs = await findAllUsedAttachmentRefs();
  const database = await getDb();

  // Get all attachment IDs
  const allRows = await new Promise((resolve, reject) => {
    const tx = database.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  let deleted = 0;
  for (const row of allRows) {
    const ref = `local:${row.id}`;
    if (!usedRefs.has(ref)) {
      // Revoke cached URL
      if (urlCache.has(row.id)) {
        URL.revokeObjectURL(urlCache.get(row.id));
        urlCache.delete(row.id);
      }
      await new Promise((resolve, reject) => {
        const tx = database.transaction(FILE_STORE, "readwrite");
        tx.objectStore(FILE_STORE).delete(row.id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      deleted++;
    }
  }

  return { deleted };
}

/**
 * Convert base64 images in markdown to attachments.
 * Returns the new markdown with local: refs and a count of converted images.
 * @param {string} markdown - The markdown text with base64 images
 * @returns {Promise<{ markdown: string, converted: number }>}
 */
export async function convertBase64ImagesToAttachments(markdown) {
  if (!markdown) return { markdown, converted: 0 };

  // Match markdown images with data: URLs
  const dataUrlRegex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g;
  const matches = [];
  let match;
  while ((match = dataUrlRegex.exec(markdown)) !== null) {
    matches.push({ alt: match[1], dataUrl: match[2], fullMatch: match[0] });
  }

  if (matches.length === 0) return { markdown, converted: 0 };

  let newMarkdown = markdown;
  let converted = 0;

  for (const { alt, dataUrl, fullMatch } of matches) {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });

      // Store as attachment
      const attachment = await addAttachment(file);

      // Replace in markdown
      newMarkdown = newMarkdown.replace(fullMatch, `![${alt || "image"}](${attachment.ref})`);
      converted++;
    } catch (err) {
      console.warn("Failed to convert base64 image:", err);
      // Keep the original base64 if conversion fails
    }
  }

  return { markdown: newMarkdown, converted };
}

/**
 * Revoke all cached object URLs. Call on page unload.
 */
export function revokeAllCachedUrls() {
  for (const url of urlCache.values()) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
}

// Clean up on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", revokeAllCachedUrls);
}