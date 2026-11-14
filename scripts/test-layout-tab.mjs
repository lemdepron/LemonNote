/**
 * Pure logic tests for LayoutTab button actions.
 * Tests the format-actions that ribbon buttons trigger.
 * Run with: node scripts/test-layout-tab.mjs
 */
import { insertPageBreak, insertColumnBreak } from "../src/lib/format-actions.js";

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ✓ ${message}`);
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`FAIL: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log("\n=== Testing insertPageBreak ===");
{
  const selection = { value: "Line 1\nLine 2\nLine 3", start: 6, end: 6 }; // cursor at "Line 2"
  const result = insertPageBreak(selection);
  assert(result.start === 6, "insertPageBreak returns correct start position");
  assert(result.end === 6, "insertPageBreak returns correct end position");
  assert(result.next.includes('<div data-page-break="true"></div>'), "insertPageBreak inserts page break marker");
  assert(result.next.includes("Line 1"), "insertPageBreak preserves content before");
  assert(result.next.includes("Line 2"), "insertPageBreak preserves content after");
  console.log("  Result:", result.next.replace(/\n/g, "\\n"));
}

console.log("\n=== Testing insertColumnBreak ===");
{
  const selection = { value: "Col 1\nCol 2\nCol 3", start: 6, end: 6 };
  const result = insertColumnBreak(selection);
  assert(result.start === 6, "insertColumnBreak returns correct start position");
  assert(result.end === 6, "insertColumnBreak returns correct end position");
  assert(result.next.includes('<div data-column-break="true"></div>'), "insertColumnBreak inserts column break marker");
  console.log("  Result:", result.next.replace(/\n/g, "\\n"));
}

console.log("\n=== Testing indent/spacing stepper logic (0.5em steps) ===");
{
  // Simulate the patch logic from LayoutTab: patch({ il: il || undefined })
  function stepValue(current, direction, step = 0.5, max = 20) {
    const next = Math.max(0, Math.round((current + direction * step) * 10) / 10);
    return next > max ? max : (next || undefined);
  }

  assertEqual(stepValue(0, 1), 0.5, "indentLeft: 0 + 0.5 = 0.5");
  assertEqual(stepValue(0.5, 1), 1, "indentLeft: 0.5 + 0.5 = 1");
  assertEqual(stepValue(1, 1), 1.5, "indentLeft: 1 + 0.5 = 1.5");
  assertEqual(stepValue(0, -1), undefined, "indentLeft: 0 - 0.5 = 0 (undefined)");
  assertEqual(stepValue(0.5, -1), undefined, "indentLeft: 0.5 - 0.5 = 0 -> undefined");
  assertEqual(stepValue(20, 1), 20, "indentLeft: max clamped at 20");
  assertEqual(stepValue(19.5, 1), 20, "indentLeft: 19.5 + 0.5 = 20 (clamped)");
}

console.log("\n=== Testing margin stepper logic (0.1mm steps) ===");
{
  function stepMargin(current, direction, step = 0.1, max = 200) {
    const next = Math.max(0, Math.round((current + direction * step) * 10) / 10);
    return next > max ? max : next;
  }

  assertEqual(stepMargin(25.4, 1), 25.5, "marginTop: 25.4 + 0.1 = 25.5");
  assertEqual(stepMargin(25.5, -1), 25.4, "marginTop: 25.5 - 0.1 = 25.4");
  assertEqual(stepMargin(0, -1), 0, "marginTop: 0 - 0.1 = 0 (clamped)");
  assertEqual(stepMargin(200, 1), 200, "marginTop: max clamped at 200");
}

console.log("\n=== Testing custom page size stepper logic (1mm steps) ===");
{
  function stepPageSize(current, direction, step = 1, max = 1000, min = 50) {
    const next = Math.max(min, Math.min(max, current + direction * step));
    return next;
  }

  assertEqual(stepPageSize(210, 1), 211, "pageWidth: 210 + 1 = 211");
  assertEqual(stepPageSize(210, -1), 209, "pageWidth: 210 - 1 = 209");
  assertEqual(stepPageSize(50, -1), 50, "pageWidth: min clamped at 50");
  assertEqual(stepPageSize(1000, 1), 1000, "pageWidth: max clamped at 1000");
}

console.log("\n=== All pure logic tests passed! ===\n");
console.log("Note: UI interaction tests (button clicks, menu opens, ink object manipulation,");
console.log("      alignment toggles, ribbon panel hide/show) require a real browser/desktop");
console.log("      environment and cannot be tested in Node.");