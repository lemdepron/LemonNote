/**
 * Smoke test for the Quick Access feature.
 * 1. Registry integrity: every entry is well-formed, every id unique and well-shaped.
 * 2. Registry predicates: `enabled` / `active` and every menu action run against a fake context.
 * 3. Pin storage: add, remove, toggle, reorder, and dropping unknown ids keeps old saves safe.
 * 4. Render: the QuickAccess component (star + popup + inline pins) renders without throwing,
 *    and the pinned default pb set renders as real buttons.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:5173",
  pretendToBeVisual: true,
  resources: "usable",
  runScripts: "outside-only",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, writable: true, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage, writable: true, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { createServer } = await import("vite");
const server = await createServer({ root: projectRoot, server: { middlewareMode: true }, appType: "custom" });
const { ssrLoadModule } = server;

const React = await import("react");
const ReactDOM = await import("react-dom/client");
const { act } = await import("react");
const { MemoryRouter } = await import("react-router-dom");

/* Fake ribbon context, same shape NoteRibbon provides. */
const fakeCtx = {
  selection: { value: "# Test\n\nSome **text**", start: 12, end: 16 },
  value: "# Test\n\nSome **text**",
  body: "# Test\n\nSome **text**",
  onChange: () => {},
  run: () => true,
  markdown: true,
  offReason: "",
  noteId: "note-1",
  noteTitle: "2026-11-08",
  typography: {},
  setTypography: () => {},
  pickImage: () => {},
};

let failures = 0;
const check = (label, ok) => {
  if (!ok) {
    console.error(`  ✗ ${label}`);
    failures += 1;
  }
};

/* 1 — registry integrity --------------------------------------------------------------- */

const registry = await ssrLoadModule("@/lib/ribbon-registry");
const { RIBBON_ACTIONS, DEFAULT_PINS } = registry;

console.log("=== Registry integrity ===");
const ids = Object.keys(RIBBON_ACTIONS);
check(`registry has entries (${ids.length})`, ids.length > 80);
check("ids are unique-ish and well-shaped", ids.every((id) => /^[a-z]+\.[a-zA-Z0-9.]+$/.test(id)));

const KINDS = new Set(["edit", "call", "menu", "widget", "navigate"]);
for (const [id, entry] of Object.entries(RIBBON_ACTIONS)) {
  check(`${id}: kind known`, KINDS.has(entry.kind));
  check(`${id}: label string`, typeof entry.label === "string" && entry.label.length > 0);
  check(`${id}: has icon or text label`, Boolean(entry.icon || entry.label));
  if (entry.kind === "edit") check(`${id}: make() function`, typeof entry.make === "function");
  if (entry.kind === "call") check(`${id}: fn() function`, typeof entry.fn === "function");
  if (entry.kind === "navigate") check(`${id}: target string`, typeof entry.target === "string");
  if (entry.kind === "widget")
    check(`${id}: widget known`, ["tablePicker", "cardComposer"].includes(entry.widget));
  if (entry.kind === "menu") {
    check(`${id}: menu type known`, ["input", "items", "symbols", "languages", "setLanguage"].includes(entry.menu?.type));
    for (const item of entry.menu?.items ?? []) {
      check(`${id}: item '${item.label}' has make()`, typeof item.make === "function");
    }
  }
}

check("DEFAULT_PINS has 6 entries", DEFAULT_PINS.length === 6);
const expectedOrder = ["home.bold", "home.italic", "home.underline", "home.undo", "home.redo", "home.highlight"];
check("DEFAULT_PINS = Bold, Italic, Underline, Undo, Redo, Highlight", JSON.stringify(DEFAULT_PINS) === JSON.stringify(expectedOrder));
check("DEFAULT_PINS all in registry", DEFAULT_PINS.every((id) => Boolean(RIBBON_ACTIONS[id])));

/* 2 — run every predicate and menu action with the fake context ------------------------ */

console.log("=== Predicates and menu actions ===");
for (const [id, entry] of Object.entries(RIBBON_ACTIONS)) {
  try {
    if (entry.enabled) entry.enabled(fakeCtx);
    if (entry.active) entry.active(fakeCtx);
    if (entry.kind === "edit") {
      const result = entry.make(fakeCtx.selection, fakeCtx);
      // `null` is legal: same as the tabs, a no-op edit commits nothing (commit(null) => false).
      check(`${id}: make() returns an edit or no-op null`, result === null || result === undefined || (typeof result === "object" && result !== null && "text" in result));
    }
    if (entry.kind === "menu" && entry.menu?.items) {
      for (const item of entry.menu.items) {
        const result = item.make(fakeCtx.selection);
        check(`${id}: item '${item.label}' builds an edit`, result == null || (typeof result === "object" && result !== null && "text" in result));
      }
      if (entry.menu?.build) {
        const result = entry.menu.build(fakeCtx.selection, "hello");
        check(`${id}: build() makes an edit`, result == null || (typeof result === "object" && result !== null && "text" in result));
      }
    }
  } catch (err) {
    check(`${id}: throws — ${err.message}`, false);
  }
}

/* 3 — pin storage --------------------------------------------------------------------- */

console.log("=== Pin storage ===");
const qa = await ssrLoadModule("@/lib/quick-access");
window.localStorage.clear();

check("defaults used when nothing saved", JSON.stringify(qa.readPins()) === JSON.stringify(DEFAULT_PINS));

qa.addPin("home.checklist");
check("addPin() adds at the end", qa.readPins().at(-1) === "home.checklist");
qa.addPin("home.checklist");
check("addPin() does not duplicate", qa.readPins().filter((id) => id === "home.checklist").length === 1);
check("isPinned() true after add", qa.isPinned("home.checklist") === true);

qa.removePin("home.checklist");
check("removePin() drops the pin", qa.isPinned("home.checklist") === false);
check("removePin() keeps the rest", qa.isPinned("home.bold") === true);

qa.reorderPin("home.highlight", 0);
check("reorderPin() moves to front", qa.readPins()[0] === "home.highlight");
qa.reorderPin("home.highlight", 99);
check("reorderPin() clamps past the end", qa.readPins().at(-1) === "home.highlight");

qa.writePins(["home.bold", "not.a.button", "home.bold", 42, null, "home.italic"]);
check("normalizePins() drops unknown ids and dupes", JSON.stringify(qa.readPins()) === JSON.stringify(["home.bold", "home.italic"]));

const saved = JSON.parse(window.localStorage.getItem("notecraft:prefs") || "{}");
check("saved under notecraft:prefs as quickAccessPins", Array.isArray(saved.quickAccessPins));

/* 4 — render QuickAccess --------------------------------------------------------------- */

console.log("=== Render QuickAccess ===");
const { RibbonContext } = await ssrLoadModule("@/components/ribbon/RibbonKit");
const qaMod = await ssrLoadModule("@/components/ribbon/QuickAccess");
const QuickAccess = qaMod.default;

window.localStorage.clear();
const container = document.createElement("div");
document.body.appendChild(container);
await act(async () => {
  const root = ReactDOM.createRoot(container);
  root.render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/note/note-1"] },
      React.createElement(
        RibbonContext.Provider,
        { value: fakeCtx },
        React.createElement(QuickAccess, null)
      )
    )
  );
});
const buttons = [...container.querySelectorAll("button")];
const labels = buttons.map((b) => b.getAttribute("aria-label") || b.getAttribute("title") || "");
check("star button renders", labels.some((t) => t === "Quick Access — your pinned ribbon buttons"));
const hasLabel = (text) => labels.some((t) => t !== null && (t === text || t.split(" ")[0] === text));
check("default pins render inline as working buttons",
  hasLabel("Bold") && hasLabel("Italic") && hasLabel("Underline") && hasLabel("Undo") && hasLabel("Redo") && hasLabel("Highlight") ||
  (console.log("    rendered labels:", JSON.stringify(labels)), false));
container.remove();

console.log("\n=== Summary ===");
if (failures === 0) {
  console.log("✓ Quick Access smoke tests all passed!");
  process.exit(0);
} else {
  console.error(`✗ ${failures} check(s) failed.`);
  process.exit(1);
}
