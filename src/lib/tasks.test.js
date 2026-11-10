/**
 * Tests for task parsing and due date handling.
 * Run with: npx vitest run src/lib/tasks.test.js
 */
/* eslint-disable no-undef */

import { describe, it, expect, beforeEach, vi } from "vitest";

let tasks;

describe("tasks parsing", () => {
  beforeEach(async () => {
    vi.resetModules();
    tasks = await import("./tasks.js");
  });

  describe("parseDueDate", () => {
    it("parses date only", () => {
      const date = tasks.parseDueDate("Some task due:2026-11-15");
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(10); // 0-indexed
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
    });

    it("parses date with time", () => {
      const date = tasks.parseDueDate("Some task due:2026-11-15 14:30");
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(10);
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
    });

    it("parses date with time (case insensitive)", () => {
      const date = tasks.parseDueDate("Some task DUE:2026-11-15 09:00");
      expect(date).toBeInstanceOf(Date);
      expect(date.getHours()).toBe(9);
      expect(date.getMinutes()).toBe(0);
    });

    it("returns null for text without due date", () => {
      const date = tasks.parseDueDate("Some task without due date");
      expect(date).toBeNull();
    });

    it("returns null for empty string", () => {
      const date = tasks.parseDueDate("");
      expect(date).toBeNull();
    });

    it("returns null for null", () => {
      const date = tasks.parseDueDate(null);
      expect(date).toBeNull();
    });
  });

  describe("getDueDateStatus", () => {
    it("returns 'no-date' for null", () => {
      const status = tasks.getDueDateStatus(null);
      expect(status).toBe("no-date");
    });

    it("returns 'overdue' for past dates", () => {
      const past = new Date(Date.now() - 3600000); // 1 hour ago
      const status = tasks.getDueDateStatus(past);
      expect(status).toBe("overdue");
    });

    it("returns 'today' for today (end of day)", () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const status = tasks.getDueDateStatus(today);
      expect(status).toBe("today");
    });

    it("returns 'this-week' for dates within 7 days", () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      in3Days.setHours(23, 59, 59, 999);
      const status = tasks.getDueDateStatus(in3Days);
      expect(status).toBe("this-week");
    });

    it("returns 'future' for dates beyond 7 days", () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);
      in10Days.setHours(23, 59, 59, 999);
      const status = tasks.getDueDateStatus(in10Days);
      expect(status).toBe("future");
    });
  });

  describe("formatDueDate", () => {
    it("returns empty string for null", () => {
      const formatted = tasks.formatDueDate(null);
      expect(formatted).toBe("");
    });

    it("formats today with time only (locale format)", () => {
      const today = new Date();
      today.setHours(14, 30, 0, 0);
      const formatted = tasks.formatDueDate(today);
      // Locale format may be 12-hour (02:30 PM) or 24-hour (14:30)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it("formats tomorrow with 'Tomorrow' prefix", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const formatted = tasks.formatDueDate(tomorrow);
      expect(formatted).toContain("Tomorrow");
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it("formats this week with weekday", () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);
      in3Days.setHours(16, 45, 0, 0);
      const formatted = tasks.formatDueDate(in3Days);
      // Should contain weekday abbreviation
      expect(formatted.length).toBeGreaterThan(10);
    });
  });

  describe("parseTasks", () => {
    it("parses simple TODO task", () => {
      const note = {
        id: "note1",
        title: "Test Note",
        body: "- TODO Buy milk",
      };
      const parsed = tasks.parseTasks(note);
      expect(parsed).toHaveLength(1);
      // parseTasks returns text without the task marker prefix
      expect(parsed[0].text).toBe("Buy milk");
      expect(parsed[0].state).toBe("TODO");
      expect(parsed[0].noteId).toBe("note1");
    });

    it("parses task with due date", () => {
      const note = {
        id: "note1",
        title: "Test Note",
        body: "- TODO Buy milk due:2026-11-15 14:30",
      };
      const parsed = tasks.parseTasks(note);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].dueDate).toBeInstanceOf(Date);
      expect(parsed[0].dueDate.getFullYear()).toBe(2026);
      expect(parsed[0].dueDate.getMonth()).toBe(10);
      expect(parsed[0].dueDate.getDate()).toBe(15);
      expect(parsed[0].dueDate.getHours()).toBe(14);
      expect(parsed[0].dueDate.getMinutes()).toBe(30);
    });

    it("parses multiple tasks", () => {
      const note = {
        id: "note1",
        title: "Test Note",
        body: "- TODO Task 1\n- DOING Task 2 due:2026-11-20\n- DONE Task 3",
      };
      const parsed = tasks.parseTasks(note);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].state).toBe("TODO");
      expect(parsed[1].state).toBe("DOING");
      expect(parsed[2].state).toBe("DONE");
      expect(parsed[1].dueDate).toBeInstanceOf(Date);
      expect(parsed[0].dueDate).toBeNull();
      expect(parsed[2].dueDate).toBeNull();
    });

    it("parses checkbox syntax", () => {
      const note = {
        id: "note1",
        title: "Test Note",
        body: "- [ ] Task 1\n- [x] Task 2",
      };
      const parsed = tasks.parseTasks(note);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].state).toBe("TODO");
      expect(parsed[1].state).toBe("DONE");
    });

    it("ignores non-task lines", () => {
      const note = {
        id: "note1",
        title: "Test Note",
        body: "Some text\n- TODO Real task\nMore text",
      };
      const parsed = tasks.parseTasks(note);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].text).toBe("Real task");
    });
  });

  describe("filterTasks", () => {
    // Use fixed dates to avoid flakiness
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const yesterday = new Date(todayEnd);
    yesterday.setDate(yesterday.getDate() - 1);
    const in3Days = new Date(todayEnd);
    in3Days.setDate(in3Days.getDate() + 3);
    const in10Days = new Date(todayEnd);
    in10Days.setDate(in10Days.getDate() + 10);

    const mockTasks = [
      { state: "TODO", dueDate: null, text: "No date" },
      { state: "TODO", dueDate: yesterday, text: "Overdue" },
      { state: "TODO", dueDate: todayEnd, text: "Today" },
      { state: "TODO", dueDate: in3Days, text: "This week" },
      { state: "TODO", dueDate: in10Days, text: "Future" },
    ];

    it("returns all tasks for ALL filter", () => {
      const filtered = tasks.filterTasks(mockTasks, "ALL");
      expect(filtered).toHaveLength(5);
    });

    it("filters overdue tasks", () => {
      const filtered = tasks.filterTasks(mockTasks, "OVERDUE");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe("Overdue");
    });

    it("filters today tasks", () => {
      const filtered = tasks.filterTasks(mockTasks, "TODAY");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe("Today");
    });

    it("filters this week tasks", () => {
      const filtered = tasks.filterTasks(mockTasks, "THIS_WEEK");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe("This week");
    });

    it("filters no-date tasks", () => {
      const filtered = tasks.filterTasks(mockTasks, "NO_DATE");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe("No date");
    });
  });

  describe("sortTasks", () => {
    it("sorts by due date ascending", () => {
      const task1 = { dueDate: new Date("2026-11-20"), state: "TODO", text: "Later" };
      const task2 = { dueDate: new Date("2026-11-10"), state: "TODO", text: "Sooner" };
      const task3 = { dueDate: null, state: "TODO", text: "No date" };
      
      const sorted = tasks.sortTasks([task1, task2, task3], "dueDate");
      expect(sorted[0].text).toBe("Sooner");
      expect(sorted[1].text).toBe("Later");
      expect(sorted[2].text).toBe("No date");
    });

    it("sorts by state", () => {
      const task1 = { state: "DONE", dueDate: null, text: "Done" };
      const task2 = { state: "TODO", dueDate: null, text: "Todo" };
      const task3 = { state: "DOING", dueDate: null, text: "Doing" };
      
      const sorted = tasks.sortTasks([task1, task2, task3], "state");
      expect(sorted[0].text).toBe("Todo");
      expect(sorted[1].text).toBe("Doing");
      expect(sorted[2].text).toBe("Done");
    });
  });
});