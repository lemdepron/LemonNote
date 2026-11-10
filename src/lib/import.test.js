/**
 * Import duplicate handling test.
 * Run with: npx vitest run src/lib/import.test.js
 */
/* eslint-disable no-undef */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";

const DB_NAME = "notecraft";

// Polyfill indexedDB globally
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

// Import the localDb module after polyfill
let localDb;
let db;
let importModule;

describe("Import duplicate handling", { timeout: 60000, sequential: true }, () => {
  beforeEach(async () => {
    // Clear any existing database
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      setTimeout(resolve, 100);
    });

    vi.resetModules();
    localDb = await import("../api/localDb.js");
    db = localDb.db;
    importModule = await import("./import.js");
  });

  afterEach(async () => {
    if (db) {
      localDb.clearDbCache();
      localDb.closeDb();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  describe("checkDuplicates", () => {
    it("returns empty map when no duplicates", async () => {
      const previewNotes = [
        { title: "Note 1", folder: "" },
        { title: "Note 2", folder: "folder1" },
      ];
      const duplicates = await importModule.checkDuplicates(previewNotes);
      expect(duplicates.size).toBe(0);
    });

    it("detects duplicate by title and folder", async () => {
      // Create an existing note
      await db.entities.Note.create({
        title: "Existing Note",
        body: "Content",
        folder: "test",
        tags: [],
      });

      const previewNotes = [
        { title: "Existing Note", folder: "test" }, // duplicate
        { title: "New Note", folder: "test" }, // not duplicate
      ];
      const duplicates = await importModule.checkDuplicates(previewNotes, { folder: "", preserveFolderStructure: false });
      expect(duplicates.size).toBe(1);
      expect(duplicates.has(0)).toBe(true);
      expect(duplicates.get(0).title).toBe("Existing Note");
    });

    it("considers folder when matching duplicates", async () => {
      await db.entities.Note.create({
        title: "Same Title",
        body: "Content",
        folder: "folder1",
        tags: [],
      });

      const previewNotes = [
        { title: "Same Title", folder: "folder1" }, // duplicate
        { title: "Same Title", folder: "folder2" }, // not duplicate (different folder)
      ];
      const duplicates = await importModule.checkDuplicates(previewNotes, { folder: "", preserveFolderStructure: false });
      expect(duplicates.size).toBe(1);
      expect(duplicates.has(0)).toBe(true);
    });
  });

  describe("generateUniqueTitle", () => {
    it("returns base title if not in existing titles", () => {
      const existingTitles = new Set(["Note 1", "Note 2"]);
      const title = importModule.generateUniqueTitle("Note 3", existingTitles);
      expect(title).toBe("Note 3");
    });

    it("appends number suffix if title exists", () => {
      const existingTitles = new Set(["Note", "Note (1)", "Note (2)"]);
      const title = importModule.generateUniqueTitle("Note", existingTitles);
      expect(title).toBe("Note (3)");
    });

    it("handles titles with parentheses", () => {
      const existingTitles = new Set(["Note", "Note (1)", "Note (2)"]);
      const title = importModule.generateUniqueTitle("Note", existingTitles);
      expect(title).toBe("Note (3)");
    });
  });

  describe("previewImport with duplicates", () => {
    beforeEach(async () => {
      // Create some existing notes
      await db.entities.Note.create({
        title: "Existing Note",
        body: "Content",
        folder: "",
        tags: [],
      });
      await db.entities.Note.create({
        title: "Another Note",
        body: "Content",
        folder: "test",
        tags: [],
      });
    });

    it("marks duplicates in preview", async () => {
      // Create mock files with titles matching existing notes
      const file1 = new File(["# Existing Note\n\nContent"], "Existing Note.md", { type: "text/markdown" });
      const file2 = new File(["# New Note\n\nContent"], "New Note.md", { type: "text/markdown" });
      
      // Mock webkitRelativePath
      Object.defineProperty(file1, "webkitRelativePath", { value: "Existing Note.md", writable: true });
      Object.defineProperty(file2, "webkitRelativePath", { value: "New Note.md", writable: true });

      const preview = await importModule.previewImport([file1, file2], { folder: "", preserveFolderStructure: false });
      
      expect(preview.notes[0].isDuplicate).toBe(true);
      expect(preview.notes[1].isDuplicate).toBe(false);
    });
  });
});