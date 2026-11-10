/**
 * LemonNote import utilities.
 *
 * Handles importing .md and .txt files, including:
 * - Single files
 * - Folders (recursive, preserving folder structure)
 * - Obsidian vaults (wikilinks, embeds, front matter, tags)
 */

import { db } from "@/api/localDb";
import { addAttachment } from "@/lib/attachments";
import { toast } from "@/lib/toast";

const YAML_FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;
const EMBED_REGEX = /!\[\[([^\]]+)\]\]/g;
const INLINE_TAG_REGEX = /(^|[\s(])#([A-Za-z0-9_][A-Za-z0-9_/-]*)/g;

/**
 * Check for existing notes that would be duplicates.
 * Duplicates are matched by title (and folder if folders exist).
 * Returns a map of preview note index -> existing note (if duplicate).
 */
export async function checkDuplicates(previewNotes, options = {}) {
  const { folder = "", preserveFolderStructure = false } = options;
  
  // Get all existing notes
  const existingNotes = await db.entities.Note.list({ limit: 10000 });
  const existingItems = existingNotes?.items ?? [];
  
  // Build a lookup map: "title|folder" -> note
  const existingMap = new Map();
  for (const note of existingItems) {
    if (note.trashed) continue;
    const key = `${note.title}|${note.folder || ""}`;
    existingMap.set(key, note);
  }
  
  const duplicates = new Map();
  
  for (let i = 0; i < previewNotes.length; i++) {
    const previewNote = previewNotes[i];
    if (previewNote.error) continue; // Skip errored notes
    
    const key = `${previewNote.title}|${previewNote.folder || ""}`;
    const existing = existingMap.get(key);
    if (existing) {
      duplicates.set(i, existing);
    }
  }
  
  return duplicates;
}

/**
 * Generate a unique title by appending a number suffix.
 */
export function generateUniqueTitle(baseTitle, existingTitles) {
  let title = baseTitle;
  let counter = 1;
  const existingSet = new Set(existingTitles);
  
  while (existingSet.has(title)) {
    title = `${baseTitle} (${counter})`;
    counter++;
  }
  
  return title;
}

/**
 * Import files with duplicate handling, progress, and cancel support.
 * 
 * @param {File[]} files - Files to import
 * @param {Object} options - Import options
 * @param {string} options.folder - Default folder
 * @param {boolean} options.preserveFolderStructure - Preserve folder structure
 * @param {Function} options.onProgress - Progress callback
 * @param {Function} options.onCancel - Cancel check callback (returns true if cancelled)
 * @param {string} options.duplicateAction - 'skip' | 'rename' | 'overwrite'
 * @returns {Promise<Object>} Import results
 */
export async function importFilesWithOptions(files, options = {}) {
  const { 
    folder = "", 
    onProgress, 
    onCancel,
    preserveFolderStructure = false,
    duplicateAction = "skip" // 'skip', 'rename', 'overwrite'
  } = options;
  
  // First, generate preview to detect duplicates
  const preview = await previewImport(files, { folder, preserveFolderStructure });
  const duplicates = await checkDuplicates(preview.notes, { folder, preserveFolderStructure });
  
  // Build a map of available files for embed processing
  const fileMap = new Map();
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const fileName = relativePath.split("/").pop();
    fileMap.set(fileName, file);
    fileMap.set(relativePath, file);
  }
  
  // Get all existing titles for rename logic
  const existingNotes = await db.entities.Note.list({ limit: 10000 });
  const existingItems = existingNotes?.items ?? [];
  const existingTitles = new Set(existingItems.filter(n => !n.trashed).map(n => n.title));
  
  const results = {
    notes: [],
    attachments: [],
    errors: [],
    skipped: 0,
    renamed: 0,
    overwritten: 0,
    imported: 0,
    cancelled: false,
  };
  
  for (let i = 0; i < files.length; i++) {
    // Check for cancel
    if (onCancel && onCancel()) {
      results.cancelled = true;
      break;
    }
    
    const file = files[i];
    const relativePath = file.webkitRelativePath || file.name;
    const previewNote = preview.notes[i];
    
    // Determine folder from path if preserving structure
    let noteFolder = folder;
    if (preserveFolderStructure && relativePath.includes("/")) {
      const pathParts = relativePath.split("/");
      pathParts.pop();
      noteFolder = pathParts.join("/");
    }
    
    try {
      if (onProgress) onProgress({ type: "progress", current: i + 1, total: files.length, file: relativePath });
      
      // Check if this is a duplicate
      const duplicate = duplicates.get(i);
      
      if (duplicate) {
        // Handle duplicate based on action
        if (duplicateAction === "skip") {
          results.skipped++;
          if (onProgress) onProgress({ type: "skipped", title: previewNote.title, folder: noteFolder });
          continue;
        } else if (duplicateAction === "rename") {
          // Generate unique title
          const newTitle = generateUniqueTitle(previewNote.title, existingTitles);
          existingTitles.add(newTitle);
          previewNote.title = newTitle;
          results.renamed++;
        } else if (duplicateAction === "overwrite") {
          // Delete existing note first
          await db.entities.Note.delete(duplicate.id);
          results.overwritten++;
        }
      }
      
      const text = await file.text();
      const { frontMatter, body } = parseFrontMatter(text);
      
      // Process embeds
      const { body: processedBody, attachments } = await processEmbeds(body, fileMap);
      
      const title = frontMatter.title || previewNote.title;
      
      let tags = [];
      if (frontMatter.tags) {
        tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [frontMatter.tags];
      }
      
      const noteFolderFinal = frontMatter.folder || noteFolder;
      
      const note = await createNote({
        title,
        body: processedBody,
        folder: noteFolderFinal,
        tags,
        format: frontMatter.format || "markdown",
      });
      
      results.notes.push(note);
      results.attachments.push(...attachments);
      results.imported++;
      
      if (onProgress) onProgress({ type: "note", title: note.title, folder: noteFolderFinal });
    } catch (err) {
      results.errors.push({ file: relativePath, error: err.message });
      if (onProgress) onProgress({ type: "error", file: relativePath, error: err.message });
    }
  }
  
  return results;
}

/**
 * Parse YAML front matter from markdown content.
 * Returns { frontMatter: object, body: string }
 */
export function parseFrontMatter(content) {
  const match = content.match(YAML_FRONT_MATTER_REGEX);
  if (!match) return { frontMatter: {}, body: content };

  const yamlContent = match[1];
  const frontMatter = {};
  
  try {
    yamlContent.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        
        // Handle arrays: tags: [a, b, c] or tags: a, b, c
        if (value.startsWith("[") && value.endsWith("]")) {
          value = value.slice(1, -1);
        }
        if (value.includes(",")) {
          frontMatter[key] = value.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
        } else {
          // Remove quotes
          frontMatter[key] = value.replace(/^["']|["']$/g, "");
        }
      }
    });
  } catch (err) {
    console.warn("Failed to parse front matter:", err);
  }

  // Remove front matter from body
  const body = content.slice(match[0].length).trimStart();
  return { frontMatter, body };
}

/**
 * Extract inline tags from markdown body.
 */
export function extractInlineTags(markdown) {
  const tags = [];
  const matches = markdown.matchAll(INLINE_TAG_REGEX);
  for (const match of matches) {
    const tag = match[2].replace(/[-/]+$/, "").toLowerCase();
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * Process Obsidian-style embeds (![[image.png]]) - convert to attachments.
 * Returns { body: string, attachments: Array<{ filename: string, file: File }> }
 */
export async function processEmbeds(body, fileMap) {
  const attachments = [];
  let newBody = body;
  const matches = [...body.matchAll(EMBED_REGEX)];

  for (const match of matches) {
    const embedContent = match[1].trim();
    const fullMatch = match[0];
    
    // Check if it's an image file
    const isImage = /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(embedContent);
    
    if (isImage && fileMap.has(embedContent)) {
      try {
        const file = fileMap.get(embedContent);
        const attachment = await addAttachment(file);
        newBody = newBody.replace(fullMatch, `![${embedContent}](${attachment.ref})`);
        attachments.push({ filename: embedContent, ref: attachment.ref });
      } catch (err) {
        console.warn(`Failed to process embed ${embedContent}:`, err);
        // Keep original embed if conversion fails
      }
    } else {
      // Non-image embed or file not found - keep as wikilink
      newBody = newBody.replace(fullMatch, `[[${embedContent}]]`);
    }
  }

  return { body: newBody, attachments };
}

/**
 * Create a note in the database.
 */
export async function createNote({ title, body, folder = "", tags = [], format = "markdown" }) {
  // Combine explicit tags with inline tags
  const inlineTags = extractInlineTags(body);
  const allTags = [...new Set([...tags, ...inlineTags].map((t) => String(t).trim().toLowerCase()).filter(Boolean))];

  const note = await db.entities.Note.create({
    title: title || "Untitled",
    body: body || "",
    folder,
    tags: allTags,
    format,
    favourite: false,
  });

  return note;
}

/**
 * Import a single markdown/text file.
 */
export async function importFile(file, options = {}) {
  const { folder = "", onProgress } = options;
  
  const text = await file.text();
  const { frontMatter, body } = parseFrontMatter(text);
  
  // Use filename as title if no title in front matter
  const title = frontMatter.title || file.name.replace(/\.(md|markdown|txt)$/i, "");
  
  // Extract tags from front matter
  let tags = [];
  if (frontMatter.tags) {
    tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [frontMatter.tags];
  }
  
  // Use folder from front matter if present, otherwise use provided folder
  const noteFolder = frontMatter.folder || folder;
  
  const note = await createNote({
    title,
    body,
    folder: noteFolder,
    tags,
    format: frontMatter.format || "markdown",
  });

  if (onProgress) onProgress({ type: "note", title: note.title, folder: noteFolder });
  
  return { note, attachments: [] };
}

/**
 * Import multiple files with progress reporting.
 */
export async function importFiles(files, options = {}) {
  const { folder = "", onProgress, preserveFolderStructure = false } = options;
  
  // Build a map of available files for embed processing
  const fileMap = new Map();
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const fileName = relativePath.split("/").pop();
    fileMap.set(fileName, file);
    // Also map by relative path for nested images
    fileMap.set(relativePath, file);
  }

  const results = {
    notes: [],
    attachments: [],
    errors: [],
    skipped: 0,
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = file.webkitRelativePath || file.name;
    
    // Determine folder from path if preserving structure
    let noteFolder = folder;
    if (preserveFolderStructure && relativePath.includes("/")) {
      const pathParts = relativePath.split("/");
      pathParts.pop(); // Remove filename
      noteFolder = pathParts.join("/");
    }

    try {
      if (onProgress) onProgress({ type: "progress", current: i + 1, total: files.length, file: relativePath });
      
      const text = await file.text();
      const { frontMatter, body } = parseFrontMatter(text);
      
      // Process embeds
      const { body: processedBody, attachments } = await processEmbeds(body, fileMap);
      
      const title = frontMatter.title || file.name.replace(/\.(md|markdown|txt)$/i, "");
      
      let tags = [];
      if (frontMatter.tags) {
        tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [frontMatter.tags];
      }
      
      const noteFolderFinal = frontMatter.folder || noteFolder;
      
      const note = await createNote({
        title,
        body: processedBody,
        folder: noteFolderFinal,
        tags,
        format: frontMatter.format || "markdown",
      });

      results.notes.push(note);
      results.attachments.push(...attachments);
      
      if (onProgress) onProgress({ type: "note", title: note.title, folder: noteFolderFinal });
    } catch (err) {
      results.errors.push({ file: relativePath, error: err.message });
      if (onProgress) onProgress({ type: "error", file: relativePath, error: err.message });
    }
  }

  return results;
}

/**
 * Import from a folder (uses File System Access API or file input with webkitRelativePath).
 * Returns a promise that resolves when user selects files.
 */
export function pickFilesFromFolder() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.webkitdirectory = true;
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files || []);
      resolve(files);
    };
    input.click();
  });
}

/**
 * Pick multiple files (non-folder).
 */
export function pickFiles() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.multiple = true;
    input.onchange = (event) => {
      const files = Array.from(event.target.files || []);
      resolve(files);
    };
    input.click();
  });
}

/**
 * Generate import preview without actually importing.
 * Useful for showing the user what will be imported.
 */
export async function previewImport(files, options = {}) {
  const { folder = "", preserveFolderStructure = false } = options;
  
  const fileMap = new Map();
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const fileName = relativePath.split("/").pop();
    fileMap.set(fileName, file);
    fileMap.set(relativePath, file);
  }

  const preview = {
    notes: [],
    attachments: [],
    folders: new Set(),
    totalFiles: files.length,
  };

  // First pass: collect all preview notes
  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    
    let noteFolder = folder;
    if (preserveFolderStructure && relativePath.includes("/")) {
      const pathParts = relativePath.split("/");
      pathParts.pop();
      noteFolder = pathParts.join("/");
    }

    try {
      const text = await file.text();
      const { frontMatter, body } = parseFrontMatter(text);
      
      // Check for embeds
      const embedMatches = [...body.matchAll(EMBED_REGEX)];
      const imageEmbeds = embedMatches
        .map((m) => m[1].trim())
        .filter((e) => /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(e));
      
      const title = frontMatter.title || file.name.replace(/\.(md|markdown|txt)$/i, "");
      
      let tags = [];
      if (frontMatter.tags) {
        tags = Array.isArray(frontMatter.tags) ? frontMatter.tags : [frontMatter.tags];
      }
      
      const inlineTags = extractInlineTags(body);
      const allTags = [...new Set([...tags, ...inlineTags].map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
      
      const noteFolderFinal = frontMatter.folder || noteFolder;
      if (noteFolderFinal) preview.folders.add(noteFolderFinal);
      
      preview.notes.push({
        title,
        folder: noteFolderFinal,
        tags: allTags,
        format: frontMatter.format || "markdown",
        embedCount: imageEmbeds.length,
        embedFilenames: imageEmbeds,
        size: text.length,
        relativePath,
      });
    } catch (err) {
      preview.notes.push({
        title: file.name,
        error: err.message,
      });
    }
  }

  // Second pass: check for duplicates
  const duplicates = await checkDuplicates(preview.notes, { folder, preserveFolderStructure });
  for (let i = 0; i < preview.notes.length; i++) {
    if (preview.notes[i].error) continue;
    preview.notes[i].isDuplicate = duplicates.has(i);
  }

  preview.folders = Array.from(preview.folders).sort();
  return preview;
}