/**
 * Migration test for IndexedDB schema upgrade from v5 to v6 (note format migration).
 *
 * Run with: npx vitest run src/api/localDb.migration.v5-to-v6.test.js
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

describe("localDb migration from v5 to v6 (note format migration)", { timeout: 60000, sequential: true }, () => {
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

  it("opens a v5 database and converts old format notes to markdown with fenced code blocks", async () => {
    // Step 1: Create a v5 database with old Note structure (with old formats)
    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 5);
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
        // Add test notes WITH old formats
        const tx = database.transaction("Note", "readwrite");
        const store = tx.objectStore("Note");
        
        // JSON note
        store.put({
          id: "note-json",
          title: "JSON Config",
          body: '{\n  "name": "test",\n  "version": "1.0.0"\n}',
          tags: ["config"],
          format: "json",
          folder: "",
          favourite: false,
          created_date: "2024-01-01T00:00:00.000Z",
          updated_date: "2024-01-01T00:00:00.000Z",
        });
        
        // Python note
        store.put({
          id: "note-python",
          title: "Python Script",
          body: "def hello():\n    print('Hello, world!')\n\nhello()",
          tags: ["code"],
          format: "python",
          folder: "scripts",
          favourite: true,
          created_date: "2024-01-02T00:00:00.000Z",
          updated_date: "2024-01-02T00:00:00.000Z",
        });
        
        // Body with triple backticks - should use four backticks
        store.put({
          id: "note-triple-backticks",
          title: "Has Triple Backticks",
          body: "```json\n{\n  \"key\": \"value\"\n}\n```",
          tags: ["test"],
          format: "json",
          folder: "",
          favourite: false,
          created_date: "2024-01-03T00:00:00.000Z",
          updated_date: "2024-01-03T00:00:00.000Z",
        });
        
        // Empty body
        store.put({
          id: "note-empty",
          title: "Empty Body",
          body: "",
          tags: [],
          format: "yaml",
          folder: "",
          favourite: false,
          created_date: "2024-01-04T00:00:00.000Z",
          updated_date: "2024-01-04T00:00:00.000Z",
        });
        
        // Already markdown - should remain unchanged
        store.put({
          id: "note-markdown",
          title: "Already Markdown",
          body: "# Hello\n\nThis is **markdown**.",
          tags: ["docs"],
          format: "markdown",
          folder: "",
          favourite: false,
          created_date: "2024-01-05T00:00:00.000Z",
          updated_date: "2024-01-05T00:00:00.000Z",
        });
        
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Step 2: Open with current code (v6) - this should trigger upgrade
    await localDb.reopenDb();

    // Step 3: Verify all notes still exist
    const notesResult = await db.entities.Note.list({ limit: 10 });
    expect(notesResult.items).toHaveLength(5);

    // Step 4: Verify JSON note converted to markdown with ```json fence
    const jsonNote = notesResult.items.find((n) => n.id === "note-json");
    expect(jsonNote).toBeDefined();
    expect(jsonNote.format).toBe("markdown");
    expect(jsonNote.body).toContain("```json");
    expect(jsonNote.body).toContain('"name": "test"');
    expect(jsonNote.body).toContain('"version": "1.0.0"');

    // Step 5: Verify Python note converted to markdown with ```python fence
    const pythonNote = notesResult.items.find((n) => n.id === "note-python");
    expect(pythonNote).toBeDefined();
    expect(pythonNote.format).toBe("markdown");
    expect(pythonNote.body).toContain("```python");
    expect(pythonNote.body).toContain("def hello():");
    expect(pythonNote.body).toContain("print('Hello, world!')");

    // Step 6: Verify body with triple backticks uses four backticks (outer fence)
    const tripleNote = notesResult.items.find((n) => n.id === "note-triple-backticks");
    expect(tripleNote).toBeDefined();
    expect(tripleNote.format).toBe("markdown");
    // The outer fence should be four backticks since body already has triple backticks
    expect(tripleNote.body.startsWith("````json")).toBe(true);
    expect(tripleNote.body.endsWith("````")).toBe(true);
    // The original content (with triple backticks) should be preserved inside
    expect(tripleNote.body).toContain('```json\n{\n  "key": "value"\n}\n```');

    // Step 7: Verify empty body note converted
    const emptyNote = notesResult.items.find((n) => n.id === "note-empty");
    expect(emptyNote).toBeDefined();
    expect(emptyNote.format).toBe("markdown");
    expect(emptyNote.body).toBe("```yaml\n\n```");

    // Step 8: Verify already markdown note unchanged
    const markdownNote = notesResult.items.find((n) => n.id === "note-markdown");
    expect(markdownNote).toBeDefined();
    expect(markdownNote.format).toBe("markdown");
    expect(markdownNote.body).toBe("# Hello\n\nThis is **markdown**.");

    // Step 9: Verify we can create a new note after migration
    const newNote = await db.entities.Note.create({
      title: "New Note After Migration",
      body: "Created after v6 upgrade",
      tags: ["new"],
    });
    expect(newNote.id).toBeDefined();
    expect(newNote.title).toBe("New Note After Migration");
    expect(newNote.format).toBe("markdown"); // Default format

    // Step 10: Verify we can read it back
    const noteReadBack = await db.entities.Note.get(newNote.id);
    expect(noteReadBack.title).toBe("New Note After Migration");

    // Step 11: Verify all expected stores exist
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