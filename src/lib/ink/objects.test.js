/**
 * Group functions test for ink objects.
 * Run with: npx vitest run src/lib/ink/objects.test.js
 */
/* eslint-disable no-undef */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateGroupId,
  getGroupedObjects,
  groupObjects,
  ungroupObjects,
  applyToGroup,
  getGroupBounds,
  transformGroup,
  deleteGroup,
  createObject,
  OBJECT_TYPES,
} from "./objects.js";

describe("Group functions", () => {
  let objects;

  beforeEach(() => {
    // Create test objects
    objects = [
      createObject(OBJECT_TYPES.SHAPE, 100, 100, 100, 80, { shapeType: "rect", id: "obj-1" }),
      createObject(OBJECT_TYPES.SHAPE, 250, 100, 100, 80, { shapeType: "ellipse", id: "obj-2" }),
      createObject(OBJECT_TYPES.STICKER, 100, 250, 64, 64, { stickerId: "star-1", id: "obj-3" }),
      createObject(OBJECT_TYPES.TEXTBOX, 250, 250, 200, 100, { text: "Hello", id: "obj-4" }),
    ];
  });

  describe("generateGroupId", () => {
    it("generates unique IDs", () => {
      const id1 = generateGroupId();
      const id2 = generateGroupId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^group-/);
    });
  });

  describe("getGroupedObjects", () => {
    it("returns empty array for non-existent groupId", () => {
      const result = getGroupedObjects(objects, "group-nonexistent");
      expect(result).toEqual([]);
    });

    it("returns objects with matching groupId", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1" },
        { ...objects[1], groupId: "group-1" },
        objects[2],
        objects[3],
      ];
      const result = getGroupedObjects(groupedObjects, "group-1");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("obj-1");
      expect(result[1].id).toBe("obj-2");
    });
  });

  describe("groupObjects", () => {
    it("assigns same groupId to specified objects", () => {
      const result = groupObjects(objects, ["obj-1", "obj-2"]);
      expect(result[0].groupId).toBeDefined();
      expect(result[0].groupId).toBe(result[1].groupId);
      expect(result[2].groupId).toBeNull();
      expect(result[3].groupId).toBeNull();
    });

    it("returns original array if objectIds is empty", () => {
      const result = groupObjects(objects, []);
      expect(result).toBe(objects);
    });

    it("returns original array if objectIds is undefined", () => {
      const result = groupObjects(objects, undefined);
      expect(result).toBe(objects);
    });

    it("generates a new groupId each time", () => {
      const result1 = groupObjects(objects, ["obj-1"]);
      const result2 = groupObjects(objects, ["obj-2"]);
      expect(result1[0].groupId).not.toBe(result2[1].groupId);
    });
  });

  describe("ungroupObjects", () => {
    it("removes groupId from all objects in the group", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1" },
        { ...objects[1], groupId: "group-1" },
        { ...objects[2], groupId: "group-2" },
        objects[3],
      ];
      const result = ungroupObjects(groupedObjects, "group-1");
      expect(result[0].groupId).toBeNull();
      expect(result[1].groupId).toBeNull();
      expect(result[2].groupId).toBe("group-2");
      expect(result[3].groupId).toBeNull();
    });

    it("returns original array if groupId is falsy", () => {
      const result = ungroupObjects(objects, "");
      expect(result).toBe(objects);
    });
  });

  describe("applyToGroup", () => {
    it("applies transform function to grouped objects only", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100 },
        { ...objects[1], groupId: "group-1", x: 250 },
        { ...objects[2], groupId: "group-2", x: 100 },
        objects[3],
      ];
      const result = applyToGroup(groupedObjects, "group-1", (obj) => ({ ...obj, x: obj.x + 50 }));
      expect(result[0].x).toBe(150);
      expect(result[1].x).toBe(300);
      expect(result[2].x).toBe(100); // Not in group-1
      expect(result[3].x).toBe(250); // No groupId
    });
  });

  describe("getGroupBounds", () => {
    it("returns null for empty group", () => {
      const result = getGroupBounds(objects, "group-nonexistent");
      expect(result).toBeNull();
    });

    it("calculates bounds for grouped objects", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100, y: 100, width: 100, height: 80, rotation: 0 },
        { ...objects[1], groupId: "group-1", x: 250, y: 100, width: 100, height: 80, rotation: 0 },
      ];
      const bounds = getGroupBounds(groupedObjects, "group-1");
      expect(bounds).not.toBeNull();
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(250); // 250 + 100 - 100
      expect(bounds.height).toBe(80);
      expect(bounds.centerX).toBe(225);
      expect(bounds.centerY).toBe(140);
    });

    it("handles rotated objects", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100, y: 100, width: 100, height: 100, rotation: Math.PI / 2 },
      ];
      const bounds = getGroupBounds(groupedObjects, "group-1");
      expect(bounds).not.toBeNull();
    });
  });

  describe("transformGroup", () => {
    it("moves all objects in group by same delta", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100, y: 100, width: 100, height: 80, rotation: 0 },
        { ...objects[1], groupId: "group-1", x: 250, y: 100, width: 100, height: 80, rotation: 0 },
      ];
      const result = transformGroup(groupedObjects, "group-1", { type: "move", dx: 50, dy: 30 });
      expect(result[0].x).toBe(150);
      expect(result[0].y).toBe(130);
      expect(result[1].x).toBe(300);
      expect(result[1].y).toBe(130);
    });

    it("resizes objects relative to group center", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100, y: 100, width: 100, height: 80, rotation: 0 },
        { ...objects[1], groupId: "group-1", x: 250, y: 100, width: 100, height: 80, rotation: 0 },
      ];
      const result = transformGroup(groupedObjects, "group-1", { type: "resize", scaleX: 2, scaleY: 2 });
      // Group center is at (225, 140)
      // obj-1 center: (150, 140), rel: (-75, 0) -> new center: (225 - 150, 140) = (75, 140)
      // obj-1 new x: 75 - 100 = -25, new width: 200
      // obj-2 center: (300, 140), rel: (75, 0) -> new center: (225 + 150, 140) = (375, 140)
      // obj-2 new x: 375 - 100 = 275, new width: 200
      expect(result[0].width).toBe(200);
      expect(result[1].width).toBe(200);
    });

    it("rotates objects around group center", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100, y: 100, width: 100, height: 80, rotation: 0 },
        { ...objects[1], groupId: "group-1", x: 250, y: 100, width: 100, height: 80, rotation: 0 },
      ];
      const result = transformGroup(groupedObjects, "group-1", { type: "rotate", angle: Math.PI / 2 });
      expect(result[0].rotation).toBeCloseTo(Math.PI / 2, 3);
      expect(result[1].rotation).toBeCloseTo(Math.PI / 2, 3);
    });

    it("does not affect objects not in group", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1", x: 100 },
        { ...objects[1], groupId: "group-2", x: 250 },
      ];
      const result = transformGroup(groupedObjects, "group-1", { type: "move", dx: 50 });
      expect(result[0].x).toBe(150);
      expect(result[1].x).toBe(250); // Unchanged
    });
  });

  describe("deleteGroup", () => {
    it("removes all objects in the group", () => {
      const groupedObjects = [
        { ...objects[0], groupId: "group-1" },
        { ...objects[1], groupId: "group-1" },
        { ...objects[2], groupId: "group-2" },
        objects[3],
      ];
      const result = deleteGroup(groupedObjects, "group-1");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("obj-3");
      expect(result[1].id).toBe("obj-4");
    });
  });
});