// Small Node test for the ribbon collapse helpers.
// Run:  node scripts/test-ribbon-collapse.mjs   (from the project folder)
import assert from "node:assert/strict";
import { pickNextToCollapse, pickNextToExpand, allFit, EXPAND_MARGIN } from "../src/lib/ribbon-collapse.js";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
};

// Lower priority collapses first.
const groups = [
  { id: "clipboard", priority: 10, width: 200 },
  { id: "font", priority: 5, width: 160 },
  { id: "typography", priority: 1, width: 220 },
  { id: "tasks", priority: 3, width: 140 },
];

test("nothing collapses when everything fits", () => {
  assert.equal(pickNextToCollapse(groups, new Set()), groups[2]); // typography is lowest priority
  assert.equal(allFit(groups, 1000), true);
  assert.equal(allFit(groups, 100), false);
});

test("collapses the lowest-priority expanded group first", () => {
  const collapsed = new Set();
  const first = pickNextToCollapse(groups, collapsed);
  assert.equal(first.id, "typography");
  collapsed.add(first.id);
  const second = pickNextToCollapse(groups, collapsed);
  assert.equal(second.id, "tasks");
  collapsed.add(second.id);
  const third = pickNextToCollapse(groups, collapsed);
  assert.equal(third.id, "font");
  collapsed.add(third.id);
  const fourth = pickNextToCollapse(groups, collapsed);
  assert.equal(fourth.id, "clipboard");
  collapsed.add(fourth.id);
  assert.equal(pickNextToCollapse(groups, collapsed), null);
});

test("skips groups without a measured width", () => {
  const withUnknown = [...groups, { id: "mystery", priority: 0, width: 0 }];
  assert.equal(pickNextToCollapse(withUnknown, new Set()).id, "typography");
});

test("expands the highest-priority collapsed group that fits", () => {
  const collapsed = new Set(["typography", "tasks"]);
  // tasks is higher priority than typography; 140 fits in 200 spare.
  assert.equal(pickNextToExpand(groups, collapsed, 200).id, "tasks");
  // Not enough room for tasks (140 > 100 - margin), so no expansion.
  assert.equal(pickNextToExpand(groups, collapsed, 100), null);
  // Enough room for both; the higher priority (tasks) wins.
  assert.equal(pickNextToExpand(groups, collapsed, 400).id, "tasks");
});

test("expand margin is respected", () => {
  const one = [{ id: "a", priority: 1, width: 100 }];
  assert.equal(pickNextToExpand(one, new Set(["a"]), 100 + EXPAND_MARGIN), one[0]);
  assert.equal(pickNextToExpand(one, new Set(["a"]), 100 + EXPAND_MARGIN - 1), null);
});

test("empty ribbon is a no-op", () => {
  assert.equal(pickNextToCollapse([], new Set()), null);
  assert.equal(pickNextToExpand([], new Set(), 500), null);
  assert.equal(allFit([], 0), true);
});

console.log(`\n${passed} ribbon-collapse tests passed`);
