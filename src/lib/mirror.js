/**
 * Mirror library - converts notes to Markdown files with front matter.
 * One-way export from app to disk. Never deletes files it didn't create.
 */

import { db } from "@/api/localDb";
import { getFile, createFileObjectUrl } from "@/api/localDb";
import { readPref, writePref } from "@/lib/preferences";

/** Characters not allowed in file names on Windows */
const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
/** Reserved file names on Windows */
const RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

/**
 * Sanitize a string to be safe as a file/folder name.
 * Replaces invalid chars with underscore, handles reserved names.
 */
export function sanitizeFileName(name, maxLength = 200) {
  if (!name || !name.trim()) return "untitled";
  
  let sanitized = name.trim().replace(INVALID_CHARS, "_");
  
  // Handle reserved names
  const upper = sanitized.toUpperCase();
  if (RESERVED_NAMES.has(upper)) {
    sanitized = "_" + sanitized;
  }
  
  // Trim trailing dots and spaces (Windows doesn't like these)
  sanitized = sanitized.replace(/[.\s]+$/, "");
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength).replace(/[.\s]+$/, "");
  }
  
  return sanitized || "untitled";
}

/**
 * Generate front matter for a note.
 */
export function generateFrontMatter(note) {
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const lines = [
    "---",
    `id: "${note.id}"`,
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `created: "${note.created_date}"`,
    `updated: "${note.updated_date}"`,
    tags.length > 0 ? `tags: [${tags.map(t => `"${t}"`).join(", ")}]` : "tags: []",
    note.folder ? `folder: "${note.folder.replace(/"/g, '\\"')}"` : "",
    note.favourite ? "favourite: true" : "favourite: false",
    note.format ? `format: "${note.format}"` : "",
    note.style ? `style: ${JSON.stringify(note.style)}` : "",
    note.ink_page_id ? `ink_page_id: "${note.ink_page_id}"` : "",
    "---",
  ].filter(Boolean);
  
  return lines.join("\n") + "\n\n";
}

/**
 * Convert a note to markdown with front matter.
 */
export function noteToMarkdown(note) {
  const frontMatter = generateFrontMatter(note);
  const body = note.body || "";
  return frontMatter + body;
}

/**
 * Determine the file path for a note within the mirror folder.
 * Uses folder structure from the note's folder field.
 */
export function getNoteMirrorPath(note, mirrorRoot) {
  const folder = note.folder || "";
  const fileName = sanitizeFileName(note.title) + ".md";
  
  if (!folder) {
    return `${mirrorRoot}/${fileName}`;
  }
  
  // Split folder path and sanitize each part
  const folderParts = folder.split("/").map(p => sanitizeFileName(p));
  const folderPath = folderParts.join("/");
  return `${mirrorRoot}/${folderPath}/${fileName}`;
}

/**
 * Get the attachments folder path.
 */
export function getAttachmentsMirrorPath(mirrorRoot) {
  return `${mirrorRoot}/attachments`;
}

/**
 * Sanitize attachment filename.
 */
export function sanitizeAttachmentName(name) {
  return sanitizeFileName(name, 255);
}

/**
 * Mirror a single note to disk.
 * Returns the path written, or null if skipped.
 */
export async function mirrorNote(note, mirrorRoot, options = {}) {
  const { writeAttachments = true, onProgress } = options;
  
  const notePath = getNoteMirrorPath(note, mirrorRoot);
  const markdown = noteToMarkdown(note);
  
  // Ensure parent directory exists
  const pathParts = notePath.split("/");
  pathParts.pop(); // Remove filename
  let currentPath = "";
  for (const part of pathParts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    await invokeCreateDir(currentPath);
  }
  
  // Write the note file
  await invokeWriteFile(notePath, markdown);
  
  // Handle attachments if note has them
  if (writeAttachments && note.body) {
    const attachmentRefs = extractAttachmentRefs(note.body);
    for (const ref of attachmentRefs) {
      await mirrorAttachment(ref, mirrorRoot, note.id);
    }
  }
  
  if (onProgress) {
    onProgress({ type: "note", title: note.title, path: notePath });
  }
  
  return notePath;
}

/**
 * Mirror all notes to disk.
 */
export async function mirrorAllNotes(mirrorRoot, options = {}) {
  const { onProgress, onlyActive = true } = options;
  
  const query = onlyActive ? { trashed: { $ne: true } } : {};
  const notes = await db.entities.Note.filter(query, { limit: 10000 });
  
  const results = {
    notes: [],
    attachments: [],
    errors: [],
  };
  
  for (let i = 0; i < notes.items.length; i++) {
    const note = notes.items[i];
    try {
      const path = await mirrorNote(note, mirrorRoot, { onProgress });
      results.notes.push({ id: note.id, title: note.title, path });
    } catch (err) {
      results.errors.push({ id: note.id, title: note.title, error: err.message });
    }
    
    if (onProgress) {
      onProgress({ 
        type: "progress", 
        current: i + 1, 
        total: notes.items.length,
        note: note.title 
      });
    }
  }
  
  return results;
}

/**
 * Extract attachment references from note body.
 * Matches both local: refs and attachment refs.
 */
function extractAttachmentRefs(body) {
  const refs = [];
  
  // Match ![alt](local:xxx) or ![alt](attachment:xxx)
  const markdownImageRegex = /!\[([^\]]*)\]\((local:|attachment:)([^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(body)) !== null) {
    refs.push({ type: match[2].slice(0, -1), id: match[3], alt: match[1] });
  }
  
  // Match wiki-style embeds ![[filename]]
  const wikiEmbedRegex = /!\[\[([^\]]+)\]\]/g;
  while ((match = wikiEmbedRegex.exec(body)) !== null) {
    refs.push({ type: "wiki", id: match[1], alt: "" });
  }
  
  return refs;
}

/**
 * Mirror a single attachment to disk.
 */
async function mirrorAttachment(ref, mirrorRoot, noteId) {
  try {
    let fileData = null;
    let fileName = ref.id;
    
    if (ref.type === "local") {
      const file = await getFile(ref.id);
      if (file) {
        fileData = file.blob;
        fileName = file.name;
      }
    } else if (ref.type === "attachment") {
      const file = await getFile(ref.id);
      if (file) {
        fileData = file.blob;
        fileName = file.name;
      }
    } else if (ref.type === "wiki") {
      // Wiki embeds reference files by name - we can't resolve these without more context
      // Skip for now
      return;
    }
    
    if (!fileData) return;
    
    const attachmentsDir = getAttachmentsMirrorPath(mirrorRoot);
    await invokeCreateDir(attachmentsDir);
    
    // Handle name collisions
    let safeName = sanitizeAttachmentName(fileName);
    let finalPath = `${attachmentsDir}/${safeName}`;
    let counter = 1;
    
    // Check if file exists (simple approach - try to read)
    while (true) {
      try {
        await invokeReadFile(finalPath);
        // File exists, try with counter
        const dotIndex = safeName.lastIndexOf(".");
        const base = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
        const ext = dotIndex > 0 ? safeName.slice(dotIndex) : "";
        safeName = `${base}_${counter}${ext}`;
        finalPath = `${attachmentsDir}/${safeName}`;
        counter++;
      } catch {
        // File doesn't exist, we can use this name
        break;
      }
    }
    
    // Convert blob to base64 for writing
    const base64 = await blobToBase64(fileData);
    await invokeWriteFile(finalPath, base64, true);
    
  } catch (err) {
    console.warn(`Failed to mirror attachment ${ref.id}:`, err);
  }
}

/**
 * Convert blob to base64 string.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove data URL prefix if present
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Tauri command invocations.
 * These will be replaced by actual Tauri calls when running in Tauri.
 */

async function invokePickFolder() {
  if (typeof window.__TAURI__ !== "undefined") {
    const { invoke } = await import("@tauri-apps/api/core");
    // Use the dialog plugin's open command with directory: true
    return invoke("plugin:dialog|open", {
      directory: true,
      title: "Select Mirror Folder",
      recursive: true,
    });
  }
  // Browser fallback - use File System Access API
  try {
    const handle = await window.showDirectoryPicker();
    return handle.name; // Just return name for browser demo
  } catch {
    return null;
  }
}

async function invokeWriteFile(path, content, isBase64 = false) {
  if (typeof window.__TAURI__ !== "undefined") {
    const { invoke } = await import("@tauri-apps/api/core");
    // Use the plugin's write_text_file command
    return invoke("plugin:fs|write_text_file", { 
      path, 
      contents: content 
    });
  }
  // Browser fallback - can't write to arbitrary paths
  console.log("[Mirror] Browser mode: would write", path, "length:", content.length);
}

async function invokeCreateDir(path) {
  if (typeof window.__TAURI__ !== "undefined") {
    const { invoke } = await import("@tauri-apps/api/core");
    // Use the plugin's mkdir command
    return invoke("plugin:fs|mkdir", { 
      path, 
      recursive: true 
    });
  }
  console.log("[Mirror] Browser mode: would create dir", path);
}

async function invokeReadFile(path) {
  if (typeof window.__TAURI__ !== "undefined") {
    const { invoke } = await import("@tauri-apps/api/core");
    // Use the plugin's read_text_file command
    return invoke("plugin:fs|read_text_file", { path });
  }
  throw new Error("Not in Tauri");
}

async function invokeListDir(path) {
  if (typeof window.__TAURI__ !== "undefined") {
    const { invoke } = await import("@tauri-apps/api/core");
    // Use the plugin's read_dir command
    return invoke("plugin:fs|read_dir", { path });
  }
  return [];
}

/**
 * Pick a folder for mirroring.
 */
export async function pickMirrorFolder() {
  return invokePickFolder();
}

/**
 * Save mirror folder path to preferences.
 */
export function saveMirrorFolder(path) {
  writePref("settings:mirrorFolder", path);
}

/**
 * Get saved mirror folder path.
 */
export function getMirrorFolder() {
  return readPref("settings:mirrorFolder", "");
}

/**
 * Save mirror enabled state.
 */
export function saveMirrorEnabled(enabled) {
  writePref("settings:mirrorEnabled", enabled);
}

/**
 * Get mirror enabled state.
 */
export function getMirrorEnabled() {
  return readPref("settings:mirrorEnabled", false);
}

/**
 * Save auto-mirror setting.
 */
export function saveAutoMirror(enabled) {
  writePref("settings:autoMirror", enabled);
}

/**
 * Get auto-mirror setting.
 */
export function getAutoMirror() {
  return readPref("settings:autoMirror", true);
}