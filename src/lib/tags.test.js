/**
 * Tags system test.
 *
 * Run with: npx vitest run src/lib/tags.test.js
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
let tags;

describe("Tags system", { timeout: 60000, sequential: true }, () => {
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
    tags = await import("./tags.js");
  });

  afterEach(async () => {
    if (db) {
      localDb.clearDbCache();
      localDb.closeDb();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("extracts line tag from a line", () => {
    const line = "  {tag:todo} This is a todo item";
    const extracted = tags.extractLineTag(line);
    expect(extracted).toEqual({
      tagId: "todo",
      rest: " This is a todo item",
      leading: "  ",
    });
  });

  it("returns null for lines without tags", () => {
    expect(tags.extractLineTag("Just a normal line")).toBeNull();
    expect(tags.extractLineTag("{not-a-tag}")).toBeNull();
    expect(tags.extractLineTag("  {tag:}")).toBeNull();
  });

  it("builds line tag marker", () => {
    expect(tags.buildLineTag("todo")).toBe("{tag:todo}");
    expect(tags.buildLineTag("TODO")).toBe("{tag:todo}"); // lowercases
  });

  it("gets tag definition for built-in tags", () => {
    const todoDef = tags.getTagDef("todo");
    expect(todoDef.id).toBe("todo");
    expect(todoDef.label).toBe("To Do");
    expect(todoDef.icon).toBeDefined();
    expect(todoDef.shortcut).toBe("Ctrl+1");
  });

  it("returns generic definition for custom tags", () => {
    const customDef = tags.getTagDef("custom");
    expect(customDef.id).toBe("custom");
    expect(customDef.label).toBe("Custom");
    expect(customDef.custom).toBe(true);
  });

  it("finds all tagged lines in notes", async () => {
    // Create some notes with tags
    await db.entities.Note.create({
      title: "Note 1",
      body: "{tag:todo} Buy milk\n{tag:idea} New project idea\nRegular line",
      tags: [],
    });
    await db.entities.Note.create({
      title: "Note 2",
      body: "{tag:important} Important note\nAnother line",
      tags: [],
    });
    await db.entities.Note.create({
      title: "Note 3",
      body: "No tags here",
      tags: [],
    });

    const notesResult = await db.entities.Note.list({ limit: 100 });
    const taggedLines = tags.findAllTaggedLines(notesResult.items);

    expect(taggedLines).toHaveLength(3);
    expect(taggedLines.map((l) => l.tagId).sort()).toEqual(["idea", "important", "todo"]);
    expect(taggedLines.map((l) => l.noteTitle).sort()).toEqual(["Note 1", "Note 1", "Note 2"]);
  });

  it("filters tagged lines by tag", async () => {
    await db.entities.Note.create({
      title: "Note 1",
      body: "{tag:todo} Task 1\n{tag:idea} Idea 1",
      tags: [],
    });
    await db.entities.Note.create({
      title: "Note 2",
      body: "{tag:todo} Task 2",
      tags: [],
    });

    const notesResult = await db.entities.Note.list({ limit: 100 });
    const allLines = tags.findAllTaggedLines(notesResult.items);

    const todoLines = tags.filterTaggedLines(allLines, { tagId: "todo" });
    expect(todoLines).toHaveLength(2);
    expect(todoLines.every((l) => l.tagId === "todo")).toBe(true);
  });

  it("filters tagged lines by search query", async () => {
    await db.entities.Note.create({
      title: "Shopping List",
      body: "{tag:todo} Buy milk\n{tag:todo} Buy eggs",
      tags: [],
    });
    await db.entities.Note.create({
      title: "Work Tasks",
      body: "{tag:todo} Write report",
      tags: [],
    });

    const notesResult = await db.entities.Note.list({ limit: 100 });
    const allLines = tags.findAllTaggedLines(notesResult.items);

    const milkLines = tags.filterTaggedLines(allLines, { query: "milk" });
    expect(milkLines).toHaveLength(1);
    expect(milkLines[0].lineText).toContain("milk");
  });

  it("toggles line tag on selection", () => {
    const selection = {
      value: "Line 1\nLine 2\nLine 3",
      start: 0,
      end: 0, // collapsed - whole note
    };

    const edit = tags.toggleLineTag(selection, "todo");
    expect(edit).not.toBeNull();
    expect(edit.next).toContain("{tag:todo} Line 1");
    expect(edit.next).toContain("{tag:todo} Line 2");
    expect(edit.next).toContain("{tag:todo} Line 3");
  });

  it("removes line tag when toggling again", () => {
    const selection = {
      value: "{tag:todo} Line 1\n{tag:todo} Line 2",
      start: 0,
      end: 0,
    };

    const edit = tags.toggleLineTag(selection, "todo");
    expect(edit).not.toBeNull();
    expect(edit.next).not.toContain("{tag:todo}");
    expect(edit.next).toContain("Line 1");
  });

  it("clears all line tags", () => {
    const selection = {
      value: "{tag:todo} Line 1\n{tag:idea} Line 2\n{tag:important} Line 3",
      start: 0,
      end: 0,
    };

    const edit = tags.clearLineTags(selection);
    expect(edit).not.toBeNull();
    expect(edit.next).not.toContain("{tag:");
    expect(edit.next).toContain("Line 1");
    expect(edit.next).toContain("Line 2");
    expect(edit.next).toContain("Line 3");
  });

  it("gets line tags in a note", () => {
    const body = "{tag:todo} Task\n{tag:idea} Idea\nRegular\n{tag:todo} Another task";
    const lineTags = tags.getLineTagsInNote(body);
    expect(lineTags.sort()).toEqual(["idea", "todo"]);
  });
});