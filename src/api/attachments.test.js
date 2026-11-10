/**
 * Attachment system test.
 *
 * Run with: npx vitest run src/api/attachments.test.js
 */
/* eslint-disable no-undef */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";

const DB_NAME = "notecraft";

// Polyfill indexedDB globally
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Mock URL.createObjectURL and revokeObjectURL
const mockBlobUrls = new Map();
global.URL = class URL {
  static createObjectURL(blob) {
    const url = `blob:${mockBlobUrls.size}`;
    mockBlobUrls.set(url, blob);
    return url;
  }
  static revokeObjectURL(url) {
    mockBlobUrls.delete(url);
  }
  constructor(url) {
    this.href = url;
  }
};

// Mock FileReader for blob to base64 conversion
global.FileReader = class FileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  readAsDataURL(blob) {
    // Convert blob to base64 synchronously for testing
    setTimeout(() => {
      // Simple conversion: create a base64 string from blob
      const base64 = btoa(String.fromCharCode(...new Uint8Array(blob.size ? blob.size : 10)));
      this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
      if (this.onload) this.onload({ target: { result: this.result } });
    }, 0);
  }
};

// Mock fetch for data URLs
global.fetch = vi.fn((url) => {
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return Promise.resolve({
      blob: () => Promise.resolve(new Blob([bytes])),
    });
  }
  return Promise.reject(new Error("Not implemented"));
});

// Import the localDb module after polyfill
let localDb;
let db;
let attachments;

describe("Attachment system", { timeout: 120000, sequential: true }, () => {
  beforeEach(async () => {
    // Clear any existing database
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      setTimeout(resolve, 100);
    });

    vi.resetModules();
    localDb = await import("./localDb.js");
    db = localDb.db;
    attachments = await import("../lib/attachments.js");
  });

  afterEach(async () => {
    if (db) {
      localDb.clearDbCache();
      localDb.closeDb();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("adds an attachment and retrieves it", async () => {
    const file = new File(["test content"], "test.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);

    expect(attachment.id).toBeDefined();
    expect(attachment.name).toBe("test.png");
    expect(attachment.type).toBe("image/png");
    expect(attachment.size).toBe(12);
    expect(attachment.ref).toMatch(/^local:/);
  });

  it("gets an object URL for an attachment", async () => {
    const file = new File(["image data"], "image.jpg", { type: "image/jpeg" });
    const attachment = await attachments.addAttachment(file);
    const url = await attachments.getAttachmentUrl(attachment.ref);

    expect(url).toBeDefined();
    expect(url).toMatch(/^blob:/);
  });

  it("deletes an attachment", async () => {
    const file = new File(["delete me"], "delete.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);

    const result = await attachments.deleteAttachment(attachment.ref);
    expect(result.success).toBe(true);

    // Try to get the deleted attachment - should fail
    await expect(attachments.getAttachmentUrl(attachment.ref)).rejects.toThrow(/not found/);
  });

  it("gets attachment info without loading blob", async () => {
    const file = new File(["info test"], "info.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);
    const info = await attachments.getAttachmentInfo(attachment.ref);

    expect(info).toBeDefined();
    expect(info.id).toBe(attachment.id);
    expect(info.name).toBe("info.png");
    expect(info.type).toBe("image/png");
    expect(info.size).toBe(9);
  });

  it("finds attachment refs in markdown", () => {
    const markdown = `
# Note

![Image 1](local:abc123)
Some text
![Image 2](local:def456)
![Regular image](https://example.com/image.png)
    `;

    const refs = attachments.findAttachmentRefs(markdown);
    expect(refs).toEqual(["local:abc123", "local:def456"]);
  });

  it("converts base64 images to attachments", async () => {
    // Create a simple base64 PNG (1x1 transparent pixel)
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${base64Png}`;
    const markdown = `![Test](${dataUrl})`;

    const { markdown: newMarkdown, converted } = await attachments.convertBase64ImagesToAttachments(markdown);

    expect(converted).toBe(1);
    expect(newMarkdown).toMatch(/!\[Test\]\(local:[a-z0-9]+\)/);
  });

  it("converts multiple base64 images", async () => {
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${base64Png}`;
    const markdown = `![First](${dataUrl})\n\n![Second](${dataUrl})`;

    const { markdown: newMarkdown, converted } = await attachments.convertBase64ImagesToAttachments(markdown);

    expect(converted).toBe(2);
    const refs = attachments.findAttachmentRefs(newMarkdown);
    expect(refs).toHaveLength(2);
    expect(refs[0]).not.toBe(refs[1]); // Different IDs
  });

  it("does not convert non-base64 images", async () => {
    const markdown = `![Regular](https://example.com/image.png)`;
    const { markdown: newMarkdown, converted } = await attachments.convertBase64ImagesToAttachments(markdown);

    expect(converted).toBe(0);
    expect(newMarkdown).toBe(markdown);
  });

  it("handles empty markdown", async () => {
    const { markdown, converted } = await attachments.convertBase64ImagesToAttachments("");
    expect(converted).toBe(0);
    expect(markdown).toBe("");
  });

  it("export/import backup includes attachments", async () => {
    const { exportBackup, importBackup } = await import("../lib/backup.js");

    // Add some notes and attachments
    const note = await db.entities.Note.create({ title: "Test", body: "Hello" });
    const file = new File(["backup test"], "backup.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);

    // Update note to reference attachment
    await db.entities.Note.update(note.id, { body: `![Image](${attachment.ref})` });

    // Export backup
    const backup = await exportBackup();

    expect(backup.tables.Files).toBeDefined();
    expect(backup.tables.Files.length).toBeGreaterThan(0);
    expect(backup._fileSizeFormatted).toBeDefined();

    // Verify file has base64 blob
    const fileInBackup = backup.tables.Files[0];
    expect(fileInBackup._isBlob).toBe(true);
    expect(fileInBackup.blob).toMatch(/^data:image\/png;base64,/);

    // Import backup (replace mode)
    const result = await importBackup(backup, "replace");
    expect(result.tables.Files.imported).toBeGreaterThan(0);

    // Verify attachment was restored
    const restoredFile = await db.getFile(fileInBackup.id);
    expect(restoredFile).toBeDefined();
    expect(restoredFile.name).toBe("backup.png");
    expect(restoredFile.type).toBe("image/png");
  });

  it("deletes note and cleans up unused attachments", async () => {
    const { deleteNoteForever } = await import("../lib/notes.js");

    // Create note with attachment
    const file = new File(["cleanup test"], "cleanup.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);
    const note = await db.entities.Note.create({ title: "To Delete", body: `![Image](${attachment.ref})` });

    // Delete note forever
    await deleteNoteForever(note.id);

    // Attachment should be deleted since no other note uses it
    const info = await attachments.getAttachmentInfo(attachment.ref);
    expect(info).toBeNull();
  });

  it("does not delete attachment used by another note", async () => {
    const { deleteNoteForever } = await import("../lib/notes.js");

    // Create two notes sharing the same attachment
    const file = new File(["shared"], "shared.png", { type: "image/png" });
    const attachment = await attachments.addAttachment(file);
    const note1 = await db.entities.Note.create({ title: "Note 1", body: `![Image](${attachment.ref})` });
    const note2 = await db.entities.Note.create({ title: "Note 2", body: `![Image](${attachment.ref})` });

    // Delete first note
    await deleteNoteForever(note1.id);

    // Attachment should still exist because note2 uses it
    const info = await attachments.getAttachmentInfo(attachment.ref);
    expect(info).toBeDefined();
    expect(info.id).toBe(attachment.id);
  });
});