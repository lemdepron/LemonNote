/**
 * Migration test for IndexedDB schema upgrades.
 *
 * Run with: npx vitest run src/api/localDb.migration.test.js
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

describe("localDb migration from v4 to v5 (encryption fields)", { timeout: 60000, sequential: true }, () => {
  beforeEach(async () => {
    // Clear any existing database - force close first
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      // fake-indexeddb doesn't always fire events, so add a fallback
      setTimeout(resolve, 100);
    });

    // Import fresh module for each test
    vi.resetModules();
    localDb = await import("./localDb.js");
    db = localDb.db;
  });

  afterEach(async () => {
    if (db) {
      // Clear cache
      localDb.clearDbCache();
    }
    // Small delay to let async operations complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("opens a v4 database and adds encryption fields to Note store, preserving all data", async () => {
    // Step 1: Create a v4 database with old Note structure (no encryption fields)
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 4);
      req.onupgradeneeded = (event) => {
        const database = event.target.result;
        const stores = [
          "Note",
          "Canvas",
          "DataTable",
          "CodeFile",
          "InkPage",
          "InkChunk",
          "Flashcard",
          "Template",
          "_files",
        ];
        stores.forEach((name) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: "id" });
          }
        });
      };
      req.onsuccess = () => {
        const database = req.result;
        // Add some test notes WITHOUT encryption fields
        const tx = database.transaction("Note", "readwrite");
        const store = tx.objectStore("Note");
        store.put({
          id: "note1",
          title: "First Note",
          body: "Hello world",
          tags: ["test"],
          format: "markdown",
          folder: "",
          favourite: false,
          created_date: "2024-01-01T00:00:00.000Z",
          updated_date: "2024-01-01T00:00:00.000Z",
        });
        store.put({
          id: "note2",
          title: "Second Note",
          body: "Another note",
          tags: ["test", "demo"],
          format: "markdown",
          folder: "work",
          favourite: true,
          created_date: "2024-01-02T00:00:00.000Z",
          updated_date: "2024-01-02T00:00:00.000Z",
        });
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Step 2: Open with current code (v5) - this should trigger upgrade
    await localDb.reopenDb();

    // Step 3: Verify all notes still exist and have encryption fields with defaults
    const notesResult = await db.entities.Note.list({ limit: 10 });
    expect(notesResult.items).toHaveLength(2);

    const note1 = notesResult.items.find((n) => n.id === "note1");
    const note2 = notesResult.items.find((n) => n.id === "note2");

    expect(note1).toBeDefined();
    expect(note2).toBeDefined();

    // Verify encryption fields have default values
    [note1, note2].forEach((note) => {
      expect(note.is_encrypted).toBe(false);
      expect(note.encrypted_body).toBeNull();
      expect(note.encryption_version).toBe(1);
      expect(note.title_encrypted).toBe(false);
    });

    // Step 4: Verify we can create a new note with encryption fields
    const newNote = await db.entities.Note.create({
      title: "New Note With Encryption Fields",
      body: "Created after v5 upgrade",
      tags: ["new"],
    });
    expect(newNote.is_encrypted).toBe(false);
    expect(newNote.encrypted_body).toBeNull();
    expect(newNote.encryption_version).toBe(1);
    expect(newNote.title_encrypted).toBe(false);

    // Step 5: Verify we can update a note with encryption
    const updated = await db.entities.Note.update(note1.id, {
      is_encrypted: true,
      encrypted_body: "encrypted-data-base64",
      encryption_version: 1,
      title_encrypted: false,
    });
    expect(updated.is_encrypted).toBe(true);
    expect(updated.encrypted_body).toBe("encrypted-data-base64");

    // Step 6: Verify we can read it back
    const noteReadBack = await db.entities.Note.get(note1.id);
    expect(noteReadBack.is_encrypted).toBe(true);
    expect(noteReadBack.encrypted_body).toBe("encrypted-data-base64");

    // Step 7: Verify all expected stores exist
    const database = await localDb.reopenDb();
    const storeNames = [...database.objectStoreNames];
    const expectedStores = [
      "Note",
      "Canvas",
      "DataTable",
      "CodeFile",
      "InkPage",
      "InkChunk",
      "Flashcard",
      "Template",
      "_files",
    ];
    expectedStores.forEach((name) => {
      expect(storeNames).toContain(name);
    });
    database.close();
  }, 60000);
});

describe("localDb migration from v1 to v2", { timeout: 60000, sequential: true }, () => {
  beforeEach(async () => {
    // Clear any existing database - force close first
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      // fake-indexeddb doesn't always fire events, so add a fallback
      setTimeout(resolve, 100);
    });

    // Import fresh module for each test
    vi.resetModules();
    localDb = await import("./localDb.js");
    db = localDb.db;
  });

  afterEach(async () => {
    if (db) {
      // Clear cache
      localDb.clearDbCache();
    }
    // Small delay to let async operations complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("opens a v1 database and creates Template store on upgrade, preserving all data", async () => {
    // Step 1: Create a v1 database with old stores and some notes
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (event) => {
        const database = event.target.result;
        const stores = [
          "Note",
          "Canvas",
          "DataTable",
          "CodeFile",
          "InkPage",
          "InkChunk",
          "Flashcard",
          "_files",
        ];
        stores.forEach((name) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: "id" });
          }
        });
      };
      req.onsuccess = () => {
        const database = req.result;
        // Add some test notes
        const tx = database.transaction("Note", "readwrite");
        const store = tx.objectStore("Note");
        store.put({
          id: "note1",
          title: "First Note",
          body: "Hello world",
          tags: ["test"],
          format: "markdown",
          created_date: "2024-01-01T00:00:00.000Z",
          updated_date: "2024-01-01T00:00:00.000Z",
        });
        store.put({
          id: "note2",
          title: "Second Note",
          body: "Another note",
          tags: ["test", "demo"],
          format: "markdown",
          created_date: "2024-01-02T00:00:00.000Z",
          updated_date: "2024-01-02T00:00:00.000Z",
        });
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Step 2: Open with current code (v2) - this should trigger upgrade
    await localDb.reopenDb();

    // Step 3: Verify all notes still exist
    const notesResult = await db.entities.Note.list({ limit: 10 });
    expect(notesResult.items).toHaveLength(2);
    expect(notesResult.items.map((n) => n.title).sort()).toEqual(["First Note", "Second Note"]);

    // Step 4: Verify Template store exists and is queryable
    const templateResult = await db.entities.Template.list({ limit: 10 });
    expect(templateResult.items).toHaveLength(0); // empty but store exists
    expect(templateResult.has_more).toBe(false);

    // Step 5: Verify we can create a template
    const created = await db.entities.Template.create({
      name: "Test Template",
      body: "# Template\n\nContent here",
      tags: ["template"],
    });
    expect(created.name).toBe("Test Template");
    expect(created.body).toContain("Content here");

    // Step 6: Verify we can read it back
    const templateReadBack = await db.entities.Template.get(created.id);
    expect(templateReadBack.name).toBe("Test Template");

    // Step 7: Verify we can create and read notes after migration
    const newNote = await db.entities.Note.create({
      title: "New Note After Migration",
      body: "Created after v2 upgrade",
      tags: ["new"],
    });
    expect(newNote.id).toBeDefined();
    expect(newNote.title).toBe("New Note After Migration");
    const noteReadBack = await db.entities.Note.get(newNote.id);
    expect(noteReadBack.title).toBe("New Note After Migration");

    // Step 8: Verify all expected stores exist
    const database = await localDb.reopenDb();
    const storeNames = [...database.objectStoreNames];
    const expectedStores = [
      "Note",
      "Canvas",
      "DataTable",
      "CodeFile",
      "InkPage",
      "InkChunk",
      "Flashcard",
      "Template",
      "_files",
    ];
    expectedStores.forEach((name) => {
      expect(storeNames).toContain(name);
    });
    database.close();
  }, 60000);
});