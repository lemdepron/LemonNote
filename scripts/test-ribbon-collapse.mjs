// Small Node test for the ribbon collapse helpers.
// Run:  node scripts/test-ribbon-collapse.mjs   (from the project folder)
import assert from "node:assert/strict";
import {
  pickNextToCollapse,
  pickNextToExpand,
  allFit,
  calculateTotalWidth,
  computeIdealStates,
  computeNextChange,
  EXPAND_MARGIN,
  GROUP_STATE,
} from "../src/lib/ribbon-collapse.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
};

// Lower priority collapses first.
const groups = [
  { id: "clipboard", priority: 90, width: 200 },   // Core editing - stays FULL longest
  { id: "font", priority: 80, width: 160 },        // Core editing
  { id: "lists", priority: 70, width: 140 },       // Core editing
  { id: "align", priority: 60, width: 120 },       // Core editing
  { id: "style", priority: 50, width: 100 },
  { id: "lines", priority: 40, width: 180 },
  { id: "tasks", priority: 30, width: 140 },
  { id: "ai", priority: 20, width: 160 },
  { id: "search", priority: 15, width: 100 },
  { id: "noteType", priority: 10, width: 120 },
  { id: "typography", priority: 1, width: 220 },   // Wide group - collapses first
];

const EMPTY_STATE = new Map();

test("nothing collapses when everything fits", () => {
  const state = computeIdealStates(groups, 2000);
  for (const g of groups) {
    assert.equal(state.get(g.id), GROUP_STATE.FULL);
  }
  assert.equal(allFit(groups, 2000), true);
  assert.equal(allFit(groups, 100), false);
});

test("collapses lowest-priority groups to ICON first", () => {
  // At 1000px, some groups should be ICON
  const state = computeIdealStates(groups, 1000);
  // Typography (priority 1) should be ICON or OVERFLOW
  assert.ok(state.get("typography") !== GROUP_STATE.FULL, "typography should not be FULL");
  // Clipboard (priority 90) should still be FULL
  assert.equal(state.get("clipboard"), GROUP_STATE.FULL, "clipboard should be FULL");
});

test("overflow appears only when ICON still doesn't fit", () => {
  // Very narrow - everything should collapse to ICON then OVERFLOW
  const state = computeIdealStates(groups, 300);
  // At least some should be OVERFLOW
  const overflowCount = [...state.values()].filter(s => s === GROUP_STATE.OVERFLOW).length;
  assert.ok(overflowCount > 0, "some groups should be in OVERFLOW at 300px");
});

test("priority order respected: typography collapses before clipboard", () => {
  const state = computeIdealStates(groups, 600);
  // Typography should be ICON or OVERFLOW
  assert.ok(state.get("typography") !== GROUP_STATE.FULL);
  // Clipboard should be FULL
  assert.equal(state.get("clipboard"), GROUP_STATE.FULL);
});

test("pickNextToCollapse returns lowest priority FULL group", () => {
  const state = new Map([
    ["typography", GROUP_STATE.FULL],
    ["clipboard", GROUP_STATE.FULL],
  ]);
  const result = pickNextToCollapse(groups, state);
  assert.equal(result.id, "typography");
});

test("pickNextToCollapse skips OVERFLOW groups", () => {
  const state = new Map([
    ["typography", GROUP_STATE.OVERFLOW],
    ["clipboard", GROUP_STATE.FULL],
  ]);
  const result = pickNextToCollapse(groups, state);
  // Should return the lowest priority FULL group (noteType at 10, not clipboard at 90)
  assert.equal(result.id, "noteType");
});

test("pickNextToCollapse skips groups without width", () => {
  const withUnknown = [...groups, { id: "mystery", priority: 0, width: 0 }];
  const state = new Map();
  for (const g of withUnknown) state.set(g.id, GROUP_STATE.FULL);
  const result = pickNextToCollapse(withUnknown, state);
  assert.equal(result.id, "typography");
});

test("pickNextToExpand expands highest priority collapsed group that fits", () => {
  const state = new Map([
    ["typography", GROUP_STATE.ICON],
    ["tasks", GROUP_STATE.ICON],
    ["clipboard", GROUP_STATE.FULL],
  ]);
  // tasks (priority 30) is higher than typography (1); 140 fits in 200 spare
  const result = pickNextToExpand(groups, state, 200);
  assert.equal(result.id, "tasks");
});

test("pickNextToExpand respects expand margin", () => {
  const one = [{ id: "a", priority: 1, width: 100 }];
  const state = new Map([["a", GROUP_STATE.ICON]]);
  assert.equal(pickNextToExpand(one, state, 100 + EXPAND_MARGIN).id, "a");
  assert.equal(pickNextToExpand(one, state, 100 + EXPAND_MARGIN - 1), null);
});

test("computeNextChange collapses when overflow", () => {
  const state = new Map();
  for (const g of groups) state.set(g.id, GROUP_STATE.FULL);
  // At 500px, we need to collapse
  const change = computeNextChange(groups, state, 500);
  assert.ok(change !== null);
  assert.equal(change.fromState, GROUP_STATE.FULL);
  assert.ok(change.toState === GROUP_STATE.ICON || change.toState === GROUP_STATE.OVERFLOW);
});

test("computeNextChange expands when room", () => {
  const state = new Map();
  for (const g of groups) state.set(g.id, GROUP_STATE.ICON);
  // At 2000px, we can expand
  const change = computeNextChange(groups, state, 2000);
  assert.ok(change !== null);
  assert.equal(change.fromState, GROUP_STATE.ICON);
  assert.equal(change.toState, GROUP_STATE.FULL);
});

test("calculateTotalWidth accounts for states correctly", () => {
  const state = new Map([
    ["clipboard", GROUP_STATE.FULL],
    ["font", GROUP_STATE.ICON],
    ["typography", GROUP_STATE.OVERFLOW],
    ["lists", GROUP_STATE.FULL],
    ["align", GROUP_STATE.FULL],
    ["style", GROUP_STATE.FULL],
    ["lines", GROUP_STATE.FULL],
    ["tasks", GROUP_STATE.FULL],
    ["ai", GROUP_STATE.FULL],
    ["search", GROUP_STATE.FULL],
    ["noteType", GROUP_STATE.FULL],
  ]);
  // clipboard: 200, font: 36, typography: 0, lists: 140, align: 120, style: 100, lines: 180, tasks: 140, ai: 160, search: 100, noteType: 120
  assert.equal(calculateTotalWidth(groups, state), 236 + 140 + 120 + 100 + 180 + 140 + 160 + 100 + 120);
});

test("empty ribbon is a no-op", () => {
  assert.equal(pickNextToCollapse([], new Map()), null);
  assert.equal(pickNextToExpand([], new Map(), 500), null);
  assert.equal(allFit([], 0), true);
  assert.deepEqual(computeIdealStates([], 500), new Map());
});

test("simulate widths for Home tab - print table", () => {
  const widths = [800, 1000, 1275, 1600, 1920];
  console.log("\n=== Home Tab Collapse Simulation ===");
  console.log("Width | FULL | ICON | OVERFLOW");
  console.log("------|------|------|---------");
  for (const w of widths) {
    const state = computeIdealStates(groups, w);
    const full = [...state.values()].filter(s => s === GROUP_STATE.FULL).length;
    const icon = [...state.values()].filter(s => s === GROUP_STATE.ICON).length;
    const overflow = [...state.values()].filter(s => s === GROUP_STATE.OVERFLOW).length;
    console.log(`${w.toString().padStart(5)} | ${full.toString().padStart(4)} | ${icon.toString().padStart(4)} | ${overflow.toString().padStart(7)}`);
  }
});

console.log(`\n${passed} ribbon-collapse tests passed`);