/**
 * Unit tests for InkEngine pointer handling and history.
 * Run with: npx vitest run src/lib/canvas/ink/engine.test.js
 */
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import InkEngine from "./engine.js";

// Polyfill requestAnimationFrame for test environment
beforeAll(() => {
  global.requestAnimationFrame = vi.fn((cb) => {
    const id = setTimeout(cb, 0);
    return id;
  });
  global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));
});

// Mock canvas elements
function createMockCanvas() {
  const canvas = {
    width: 800,
    height: 600,
    getContext: vi.fn(() => ({
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      setLineDash: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
    })),
  };
  return canvas;
}

function createEngine() {
  const base = createMockCanvas();
  const overlay = createMockCanvas();
  const callbacks = {
    onCommit: vi.fn((newStrokes) => {
      // Simulate parent appending new strokes to existing ones
      const current = engine.strokes;
      engine.setStrokes([...current, ...newStrokes]);
    }),
    onReplace: vi.fn((strokes) => {
      // Simulate parent updating engine with replaced strokes
      engine.setStrokes(strokes);
    }),
    onSelection: vi.fn(),
    onCamera: vi.fn(),
    onPickColor: vi.fn(),
    onUpdateObject: vi.fn(),
  };
  const engine = new InkEngine({ base, overlay, callbacks });
  engine.resize(800, 600, 1);
  return { engine, callbacks };
}

function pointerInput(x, y, overrides = {}) {
  return {
    x,
    y,
    pressure: 0.5,
    tilt: 0,
    button: 0,
    pointerType: "mouse",
    altKey: false,
    ...overrides,
  };
}

describe("InkEngine pointer handling", () => {
  let engine, callbacks;

  beforeEach(() => {
    ({ engine, callbacks } = createEngine());
    // Reset to draw mode
    engine.setTool({ mode: "draw" });
    callbacks.onCommit.mockClear();
    callbacks.onReplace.mockClear();
  });

  describe("draw mode", () => {
    it("starts and commits a stroke on pointer down/up", () => {
      const initialStrokes = engine.strokes.length;

      // Pointer down - starts stroke
      engine.pointerDown(pointerInput(100, 100));
      expect(engine.live).not.toBeNull();
      expect(engine.dragging).toBe("draw");

      // Pointer move - adds points
      engine.pointerMove(pointerInput(150, 150));
      expect(engine.live.points.length).toBe(2);

      // Pointer up - commits stroke
      engine.pointerUp();
      expect(engine.live).toBeNull();
      expect(engine.strokes.length).toBe(initialStrokes + 1);
      expect(callbacks.onCommit).toHaveBeenCalled();
    });

    it("increments stroke count by 1 for a single stroke", () => {
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(100, 100));
      engine.pointerMove(pointerInput(150, 150));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes + 1);
    });
  });

  describe("shape mode", () => {
    beforeEach(() => {
      engine.setTool({ mode: "shape", shapeRecognition: true });
    });

    it("starts and commits a shape stroke on pointer down/up", () => {
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(100, 100));
      // With default shapeType="rect", shape mode now creates liveShape instead of live
      expect(engine.liveShape).not.toBeNull();
      expect(engine.liveShape.shapeType).toBe("rect");

      engine.pointerMove(pointerInput(200, 100)); // Horizontal line
      engine.pointerUp();

      // Direct shape drawing creates a shape object, not strokes
      expect(engine.objects.length).toBeGreaterThanOrEqual(1);
      const shapeObj = engine.objects.find(o => o.type === "shape");
      expect(shapeObj).toBeDefined();
      expect(shapeObj.shapeType).toBe("rect");
    });
  });

  describe("select mode", () => {
    beforeEach(() => {
      engine.setTool({ mode: "select" });
      // Add a stroke to select
      engine.pointerDown(pointerInput(100, 100));
      engine.pointerMove(pointerInput(150, 150));
      engine.pointerUp();
    });

    it("does not create a stroke on click", () => {
      const initialStrokes = engine.strokes.length;

      // Click in select mode
      engine.pointerDown(pointerInput(200, 200));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes);
      expect(engine.live).toBeNull();
    });

    it("does not change stroke count after multiple clicks", () => {
      const initialStrokes = engine.strokes.length;

      for (let i = 0; i < 5; i++) {
        engine.pointerDown(pointerInput(200 + i * 10, 200 + i * 10));
        engine.pointerUp();
      }

      expect(engine.strokes.length).toBe(initialStrokes);
    });
  });

  describe("erase mode", () => {
    beforeEach(() => {
      // Add strokes to erase
      engine.pointerDown(pointerInput(100, 100));
      engine.pointerMove(pointerInput(150, 150));
      engine.pointerUp();

      engine.pointerDown(pointerInput(200, 200));
      engine.pointerMove(pointerInput(250, 250));
      engine.pointerUp();

      engine.setTool({ mode: "erase", size: 20 });
    });

    it("erases strokes on pointer down/move", () => {
      const initialStrokes = engine.strokes.length;

      // Erase at first stroke location
      engine.pointerDown(pointerInput(125, 125));
      engine.pointerMove(pointerInput(130, 130));
      engine.pointerUp();

      expect(engine.strokes.length).toBeLessThan(initialStrokes);
      expect(callbacks.onReplace).toHaveBeenCalled();
    });
  });

  describe("lasso mode", () => {
    beforeEach(() => {
      // Add strokes to select
      engine.pointerDown(pointerInput(100, 100));
      engine.pointerMove(pointerInput(150, 150));
      engine.pointerUp();

      engine.setTool({ mode: "lasso" });
    });

    it("does not create a stroke", () => {
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(80, 80));
      engine.pointerMove(pointerInput(180, 80));
      engine.pointerMove(pointerInput(180, 180));
      engine.pointerMove(pointerInput(80, 180));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes);
      expect(callbacks.onSelection).toHaveBeenCalled();
    });
  });

  describe("pan mode", () => {
    it("does not create a stroke", () => {
      engine.setTool({ mode: "pan" });
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(100, 100));
      engine.pointerMove(pointerInput(150, 150));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes);
    });
  });

  describe("eyedropper mode", () => {
    it("does not create a stroke", () => {
      engine.setTool({ mode: "eyedropper" });
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(100, 100));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes);
    });
  });

  describe("insertSpace mode", () => {
    it("does not create a stroke", () => {
      engine.setTool({ mode: "insertSpace" });
      const initialStrokes = engine.strokes.length;

      engine.pointerDown(pointerInput(100, 100));
      engine.pointerUp();

      expect(engine.strokes.length).toBe(initialStrokes);
    });
  });

  describe("object creation modes (addCard, addConnector, etc.)", () => {
    const creationModes = [
      "addCard",
      "addFrame",
      "addTextFrame",
      "addImage",
      "addPdfPage",
      "addShape",
      "addSticker",
      "addTextBox",
      "addSticky",
      "addConnector",
    ];

    creationModes.forEach((mode) => {
      it(`does not create a stroke in ${mode} mode`, () => {
        engine.setTool({ mode });
        const initialStrokes = engine.strokes.length;

        engine.pointerDown(pointerInput(100, 100));
        engine.pointerUp();

        expect(engine.strokes.length).toBe(initialStrokes);
      });
    });
  });
});

describe("InkEngine history (undo/redo)", () => {
  let engine, callbacks;

  beforeEach(() => {
    ({ engine, callbacks } = createEngine());
    engine.resize(800, 600, 1);
    callbacks.onCommit.mockClear();
    callbacks.onReplace.mockClear();
    callbacks.onUpdateObject.mockClear();
  });

  it("canUndo is false initially", () => {
    expect(engine.canUndo).toBe(false);
  });

  it("canRedo is false initially", () => {
    expect(engine.canRedo).toBe(false);
  });

  it("pushes history on stroke commit", () => {
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    expect(engine.canUndo).toBe(true);
    expect(engine.canRedo).toBe(false);
  });

  it("undo removes the last stroke", () => {
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    const strokeCount = engine.strokes.length;
    const result = engine.undo();

    expect(result).toBe(true);
    expect(engine.strokes.length).toBe(strokeCount - 1);
    expect(engine.canUndo).toBe(false);
    expect(engine.canRedo).toBe(true);
  });

  it("redo restores the undone stroke", () => {
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    engine.undo();
    const strokeCount = engine.strokes.length;
    const result = engine.redo();

    expect(result).toBe(true);
    expect(engine.strokes.length).toBe(strokeCount + 1);
    expect(engine.canUndo).toBe(true);
    expect(engine.canRedo).toBe(false);
  });

  it("undo/redo works for erased strokes", () => {
    // Add two strokes
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    engine.pointerDown(pointerInput(200, 200));
    engine.pointerMove(pointerInput(250, 250));
    engine.pointerUp();

    const initialCount = engine.strokes.length;

    // Erase first stroke
    engine.setTool({ mode: "erase", size: 30 });
    engine.pointerDown(pointerInput(125, 125));
    engine.pointerUp();

    expect(engine.strokes.length).toBeLessThan(initialCount);
    expect(engine.canUndo).toBe(true);

    // Undo erase
    engine.undo();
    expect(engine.strokes.length).toBe(initialCount);

    // Redo erase
    engine.redo();
    expect(engine.strokes.length).toBeLessThan(initialCount);
  });

  it("undo/redo works for selection transform", () => {
    // Add a stroke
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    // Select it with lasso
    engine.setTool({ mode: "lasso" });
    engine.pointerDown(pointerInput(80, 80));
    engine.pointerMove(pointerInput(180, 80));
    engine.pointerMove(pointerInput(180, 180));
    engine.pointerMove(pointerInput(80, 180));
    engine.pointerUp();

    // Transform selection
    engine.setSelectionTransform({ dx: 50, dy: 30 });
    engine.commitSelection();

    expect(engine.canUndo).toBe(true);

    // Undo transform
    engine.undo();
    expect(engine.canRedo).toBe(true);

    // Redo transform
    engine.redo();
    expect(engine.canUndo).toBe(true);
  });

  it("undo/redo works for recolor selection", () => {
    // Add a stroke
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    // Select it
    engine.setTool({ mode: "lasso" });
    engine.pointerDown(pointerInput(80, 80));
    engine.pointerMove(pointerInput(180, 80));
    engine.pointerMove(pointerInput(180, 180));
    engine.pointerMove(pointerInput(80, 180));
    engine.pointerUp();

    const originalColor = engine.strokes[0].color;

    // Recolor
    engine.recolorSelection("#ff0000", 1);
    expect(engine.strokes[0].color).toBe("#ff0000");

    // Undo
    engine.undo();
    expect(engine.strokes[0].color).toBe(originalColor);

    // Redo
    engine.redo();
    expect(engine.strokes[0].color).toBe("#ff0000");
  });

  it("undo/redo works for delete selection", () => {
    // Add two strokes
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    engine.pointerDown(pointerInput(200, 200));
    engine.pointerMove(pointerInput(250, 250));
    engine.pointerUp();

    // Select first stroke
    engine.setTool({ mode: "lasso" });
    engine.pointerDown(pointerInput(80, 80));
    engine.pointerMove(pointerInput(180, 80));
    engine.pointerMove(pointerInput(180, 180));
    engine.pointerMove(pointerInput(80, 180));
    engine.pointerUp();

    const initialCount = engine.strokes.length;

    // Delete selection
    engine.deleteSelection();
    expect(engine.strokes.length).toBe(initialCount - 1);
    expect(engine.canUndo).toBe(true);

    // Undo delete
    engine.undo();
    expect(engine.strokes.length).toBe(initialCount);

    // Redo delete
    engine.redo();
    expect(engine.strokes.length).toBe(initialCount - 1);
  });

  it("undo/redo works for insertSpace", () => {
    // Add strokes at different Y positions
    engine.pointerDown(pointerInput(100, 100));
    engine.pointerMove(pointerInput(150, 150));
    engine.pointerUp();

    engine.pointerDown(pointerInput(100, 300));
    engine.pointerMove(pointerInput(150, 350));
    engine.pointerUp();

    const initialY = engine.strokes[1].points[0][1];

    // Insert space
    const result = engine.insertSpace(200, 100);
    expect(result.moved).toBe(100);

    const newY = engine.strokes[1].points[0][1];
    expect(newY).toBe(initialY + 100);

    // Undo
    engine.undo();
    expect(engine.strokes[1].points[0][1]).toBe(initialY);

    // Redo
    engine.redo();
    expect(engine.strokes[1].points[0][1]).toBe(initialY + 100);
  });
});