/** One-off check: every id used in the ribbon files exists in the registry. */
import { readFileSync } from "fs";
import { createServer } from "vite";

const server = await createServer({ root: ".", server: { middlewareMode: true }, appType: "custom" });
const reg = await server.ssrLoadModule("@/lib/ribbon-registry");

const files = [
  "src/components/ribbon/tabs/HomeTab.jsx",
  "src/components/ribbon/tabs/InsertTab.jsx",
  "src/components/ribbon/tabs/DesignTab.jsx",
  "src/components/ribbon/tabs/LayoutTab.jsx",
  "src/components/ribbon/tabs/ViewTab.jsx",
  "src/components/ribbon/tabs/ShareTab.jsx",
  "src/components/ribbon/tabs/TableContextTab.jsx",
  "src/components/ribbon/tabs/CodeContextTab.jsx",
  "src/components/ribbon/TableTools.jsx",
  "src/components/ribbon/TablePicker.jsx",
  "src/components/ribbon/CardComposer.jsx",
];

const used = new Set();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/(?:id|pin):\s*`?"?([a-z]+\.[a-zA-Z0-9.]+)"?|(?:\bid)=?=?\"([a-z]+\.[a-zA-Z0-9.]+)\"|id=\{\`insert\.fence\./g)) {
    if (m[1]) used.add(m[1]);
    if (m[2]) used.add(m[2]);
  }
  // Broad scan: every quoted id-like string with a known tab prefix (covers ids in arrays and template literals).
  for (const m of src.matchAll(/["'`]([a-z]+\.[a-zA-Z0-9.]+)["'`]/g)) {
    if (/^(home|insert|design|view|layout|share|table|code)\./.test(m[1])) used.add(m[1]);
  }
  if (/id=\{\`insert\.fence\./.test(src)) used.add("insert.fence.javascript");
}

const missing = [...used].filter((id) => !reg.RIBBON_ACTIONS[id]);
console.log("used ids checked:", used.size);
console.log("missing from registry:", missing.length ? missing.join(", ") : "none");
const quickOk = ["javascript", "typescript", "python", "rust", "bash", "sql", "json", "html", "css", "yaml"].every(
  (id) => Boolean(reg.RIBBON_ACTIONS[`insert.fence.${id}`])
);
console.log("quick language entries:", quickOk ? "ok" : "MISSING");
await server.close();
