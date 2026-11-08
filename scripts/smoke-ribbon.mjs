/**
 * Smoke test for all ribbon tabs.
 * Renders every tab with Vite's ssrLoadModule and react-dom/client inside act().
 * Fails if any tab throws during render.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Setup JSDOM with all required browser APIs
const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:5173",
  pretendToBeVisual: true,
  resources: "usable",
  runScripts: "outside-only",
});

// Copy browser globals to globalThis BEFORE loading any app module
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, writable: true, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: dom.window.localStorage, writable: true, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.matchMedia = dom.window.matchMedia;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Load Vite and create server for SSR
const { createServer } = await import("vite");

const server = await createServer({
  root: projectRoot,
  server: { middlewareMode: true },
  appType: "custom",
});

const { ssrLoadModule } = server;

// Load React and ReactDOM/client for act()
const React = await import("react");
const ReactDOM = await import("react-dom/client");
const { act } = await import("react");
const { MemoryRouter } = await import("react-router-dom");

// Test contexts
const markdownContext = {
  selection: { value: "# Test\n\nSome text", start: 10, end: 10 },
  value: "# Test\n\nSome text",
  body: "# Test\n\nSome text",
  onChange: () => {},
  run: (edit) => edit,
  markdown: true,
  offReason: "",
  noteId: "test-note-1",
  noteTitle: "Test Note",
  typography: {},
  setTypography: () => {},
  format: "markdown",
  onFormat: () => {},
  images: { busy: false, error: null, insert: () => {} },
  noteInk: { hasPage: false, starting: false, onStart: () => {}, listAttachable: () => Promise.resolve([]) },
};

const pythonContext = {
  selection: { value: "def hello():\n    pass", start: 10, end: 10 },
  value: "def hello():\n    pass",
  body: "def hello():\n    pass",
  onChange: () => {},
  run: (edit) => edit,
  markdown: false,
  offReason: "Only Markdown notes offer this — this note is Python.",
  noteId: "test-note-2",
  noteTitle: "Python Note",
  typography: {},
  setTypography: () => {},
  format: "python",
  onFormat: () => {},
  images: { busy: false, error: null, insert: () => {} },
  noteInk: { hasPage: false, starting: false, onStart: () => {}, listAttachable: () => Promise.resolve([]) },
};

// Test signals
const signals = { card: 0, table: 0, code: 0 };

// Global shortcuts for testing
const GLOBAL_SHORTCUTS = {
  daily: { mod: true, alt: true, key: "d" },
  date: { mod: true, alt: true, key: "t" },
  TODO: { mod: true, alt: true, key: "1" },
  DOING: { mod: true, alt: true, key: "2" },
  DONE: { mod: true, alt: true, key: "3" },
  card: { mod: true, alt: true, key: "k" },
  table: { mod: true, alt: true, key: "m" },
  code: { mod: true, alt: true, key: "c" },
  image: { mod: true, alt: true, key: "i" },
};

// Tab definitions to test - main tabs
const mainTabs = [
  { id: "home", path: "@/components/ribbon/tabs/HomeTab", name: "HomeTab", props: { format: "markdown", onFormat: () => {}, body: "", noteId: "test", noteTitle: "Test" } },
  { id: "ink", path: "@/components/ribbon/tabs/InkTabs", name: "InkTab", props: { noteInk: markdownContext.noteInk } },
  { id: "insert", path: "@/components/ribbon/tabs/InsertTab", name: "InsertTab", props: { onPickImage: () => {}, signals, shortcuts: GLOBAL_SHORTCUTS, body: "", noteId: "test", noteTitle: "Test" } },
  { id: "design", path: "@/components/ribbon/tabs/DesignTab", name: "DesignTab", props: {} },
  { id: "layout", path: "@/components/ribbon/tabs/LayoutTab", name: "LayoutTab", props: {} },
  { id: "view", path: "@/components/ribbon/tabs/ViewTab", name: "ViewTab", props: {} },
  { id: "share", path: "@/components/ribbon/tabs/ShareTab", name: "ShareTab", props: {} },
];

// Contextual tabs
const contextualTabs = [
  { id: "table", path: "@/components/ribbon/tabs/TableContextTab", name: "TableContextTab", props: { signals, shortcuts: GLOBAL_SHORTCUTS } },
  { id: "code", path: "@/components/ribbon/tabs/CodeContextTab", name: "CodeContextTab", props: {} },
];

// Load RibbonContext from the kit
const { RibbonContext } = await ssrLoadModule("@/components/ribbon/RibbonKit");

// Helper to render a tab
async function renderTab(tab, context) {
  try {
    // Load the tab module
    const mod = await ssrLoadModule(tab.path);
    const TabComponent = mod[tab.name];
    
    if (!TabComponent) {
      throw new Error(`Export ${tab.name} not found in ${tab.path}`);
    }
    
    // Create element with context - wrap in RibbonContext.Provider and MemoryRouter
    const element = React.createElement(
      MemoryRouter,
      { initialEntries: ["/note/test"] },
      React.createElement(
        RibbonContext.Provider,
        { value: context },
        React.createElement(TabComponent, { ...tab.props }, null)
      )
    );
    
    // Render using react-dom/client inside act()
    const container = document.createElement("div");
    document.body.appendChild(container);
    
    let error = null;
    await act(async () => {
      const root = ReactDOM.createRoot(container);
      root.render(element);
    });
    
    document.body.removeChild(container);
    
    return { success: true, tab: tab.id };
  } catch (err) {
    return { success: false, tab: tab.id, error: err.message };
  }
}

async function runTests() {
  console.log("Starting ribbon smoke tests...\n");
  
  let allPassed = true;
  
  // Test each main tab in both contexts
  for (const context of [markdownContext, pythonContext]) {
    const contextName = context.markdown ? "Markdown" : "Python";
    console.log(`=== Testing ${contextName} note context ===`);
    
    for (const tab of mainTabs) {
      const result = await renderTab(tab, context);
      if (result.success) {
        console.log(`  ✓ ${tab.id} (${tab.name}) - OK`);
      } else {
        console.log(`  ✗ ${tab.id} (${tab.name}) - FAILED: ${result.error}`);
        allPassed = false;
      }
    }
    
    // Test contextual tabs
    for (const tab of contextualTabs) {
      // Table tab only in markdown
      if (tab.id === "table" && !context.markdown) {
        console.log(`  ⊘ ${tab.id} (${tab.name}) - SKIPPED (not markdown)`);
        continue;
      }
      // Code tab only in markdown with code block
      if (tab.id === "code" && !context.markdown) {
        console.log(`  ⊘ ${tab.id} (${tab.name}) - SKIPPED (not markdown)`);
        continue;
      }
      
      // For code tab, we need a code block in the selection
      const testContext = tab.id === "code" 
        ? { ...context, selection: { value: "```python\nprint('hi')\n```", start: 4, end: 4 }, value: "```python\nprint('hi')\n```" }
        : context;
      
      const result = await renderTab(tab, testContext);
      if (result.success) {
        console.log(`  ✓ ${tab.id} (${tab.name}) - OK`);
      } else {
        console.log(`  ✗ ${tab.id} (${tab.name}) - FAILED: ${result.error}`);
        allPassed = false;
      }
    }
  }
  
  console.log("\n=== Summary ===");
  if (allPassed) {
    console.log("✓ All tabs rendered successfully!");
    process.exit(0);
  } else {
    console.log("✗ Some tabs failed to render.");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});