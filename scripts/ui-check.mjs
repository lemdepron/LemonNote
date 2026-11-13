// LemonNote UI check: opens the running app in a real browser and MEASURES the layout.
// Usage (PowerShell inside the project folder, with `npm run dev` running in another window):
//   node scripts/ui-check.mjs                 -> layout + ribbon checks at 3 window sizes
//   node scripts/ui-check.mjs --themes        -> also screenshots every theme (light + dark)
//   node scripts/ui-check.mjs --url=http://localhost:5173
// First time only:  npm i -D playwright   and   npx playwright install chromium
// Output: ui-check-out/ (screenshots + themes.html). Exit code 1 if any check fails.
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true];
}));
const BASE = args.url || "http://127.0.0.1:5173";
const OUT = "ui-check-out";
fs.mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { try { ({ chromium } = await import("playwright-core")); }
catch { console.error("Missing playwright. Run: npm i -D playwright  then  npx playwright install chromium"); process.exit(2); } }

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ["--no-sandbox"] } : {}),
});

const fails = [];
const fail = (where, msg) => { fails.push(`${where}: ${msg}`); console.log(`  FAIL  ${where}: ${msg}`); };
const ok = (where, msg) => console.log(`  ok    ${where}: ${msg}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openNote(page, prefs = {}) {
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate((p) => {
    const cur = JSON.parse(localStorage.getItem("notecraft:prefs") || "{}");
    localStorage.setItem("notecraft:prefs", JSON.stringify({ ...cur, ...p }));
  }, prefs);
  await page.goto(BASE, { waitUntil: "load" });
  await wait(2500);
  // click the card of the seeded note "Tags and search" (falls back to the first note card)
  const clicked = await page.evaluate(() => {
    const leaf = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /Tags and search/.test(e.textContent || ""));
    const target = leaf || document.querySelector('a[href^="/note/"]');
    if (target) { target.click(); return true; } return false;
  });
  if (!clicked) throw new Error("Could not find a note to open. Open the Vault home first and make sure at least one note exists.");
  await page.waitForURL(/\/note\//, { timeout: 15000 });
  await page.waitForSelector('[role="tab"]', { timeout: 15000 }).catch(() => {});
  await wait(2000);
}

// the ribbon tab list is the one that contains a tab called "Home" (the note tab strip is another tablist)
const tagRibbon = () => {
  const list = [...document.querySelectorAll('[role="tablist"]')].find((l) => [...l.querySelectorAll('[role="tab"]')].some((t) => /^\s*home\s*$/i.test(t.textContent || "")));
  if (list) list.setAttribute("data-uichk", "ribbon");
  return !!list;
};

// ---- measuring helpers, run inside the page ----
const measureRibbon = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const panel = document.querySelector('[role="tabpanel"]');
  if (!panel) return { error: "no [role=tabpanel] found (ribbon panel)" };
  const pr = panel.getBoundingClientRect();
  const out = { clipped: [], noIcon: [], noName: [], big: [], overflowX: panel.scrollWidth - panel.clientWidth, panelH: Math.round(pr.height), buttons: 0 };
  for (const b of panel.querySelectorAll("button, [role=button], select, input")) {
    if (!vis(b)) continue;
    out.buttons++;
    const r = b.getBoundingClientRect();
    const name = (b.getAttribute("aria-label") || b.getAttribute("title") || b.innerText || "").trim();
    const label = (b.innerText || b.value || "").trim();
    if (r.right > pr.right + 1 || r.left < pr.left - 1) out.clipped.push(name || b.outerHTML.slice(0, 60));
    if (b.tagName === "BUTTON" && !b.querySelector("svg") && !label) out.noIcon.push(name || b.outerHTML.slice(0, 60));
    if (!name && b.tagName === "BUTTON") out.noName.push(b.outerHTML.slice(0, 60));
    if (r.height > 56) out.big.push(`${name || "?"} (${Math.round(r.width)}x${Math.round(r.height)})`);
    if (r.width > 260) out.big.push(`${name || "?"} (${Math.round(r.width)}px wide)`);
  }
  return out;
};

const measureLayout = () => {
  const rect = (el) => el && el.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  // the left rail: the tallest element touching the left edge
  let railRight = 0;
  for (const el of document.querySelectorAll("aside, nav, [data-rail]")) {
    const r = el.getBoundingClientRect();
    if (r.left <= 2 && r.height > innerHeight * 0.5 && r.width < 400) railRight = Math.max(railRight, r.right);
  }
  const tablist = rect(document.querySelector('[data-uichk="ribbon"]'));
  const ta = [...document.querySelectorAll("textarea")].map(rect).filter((r) => r && r.width > 100)[0];
  const bodyEls = [...document.querySelectorAll("textarea, .nb-markdown, .nb-reader, article")].map(rect).filter((r) => r && r.width > 100 && r.height > 50);
  const bodyLeft = bodyEls.length ? Math.min(...bodyEls.map((r) => r.left)) : null;
  const bodyRight = bodyEls.length ? Math.max(...bodyEls.map((r) => r.right)) : null;
  const logo = [...document.querySelectorAll("header img, header a")].map(rect).find((r) => r && r.width > 10);
  const scrollbar = innerWidth - vw;
  const goalBar = [...document.querySelectorAll("*")].filter((el) => el.children.length < 6 && /word goal/i.test(el.textContent || "") && el.getBoundingClientRect().width > 300);
  const goalBtn = [...document.querySelectorAll("button, [role=button]")].find((b) => /goal/i.test((b.getAttribute("aria-label") || "") + (b.title || "")) );
  const tabs = [...document.querySelectorAll('[data-uichk="ribbon"] [role="tab"]')].map(rect);
  const lastTab = tabs.length ? tabs[tabs.length - 1] : null;
  const gb = goalBtn ? rect(goalBtn) : null;
  return {
    vw, railRight: Math.round(railRight), scrollbar,
    tablist: tablist && { l: Math.round(tablist.left), r: Math.round(tablist.right) },
    body: bodyLeft != null ? { l: Math.round(bodyLeft), r: Math.round(bodyRight) } : null,
    logoLeft: logo ? Math.round(logo.left) : null,
    goalBarCount: goalBar.length,
    goalBtn: gb ? { l: Math.round(gb.left), cy: Math.round(gb.top + gb.height / 2) } : null,
    lastTab: lastTab ? { r: Math.round(lastTab.right), cy: Math.round(lastTab.top + lastTab.height / 2), h: Math.round(lastTab.height) } : null,
  };
};

async function checkViewport(w, h) {
  const where = `${w}x${h}`;
  console.log(`\n== Window ${where}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  await openNote(page);
  await page.screenshot({ path: path.join(OUT, `note-${where}.png`) });

  if (!(await page.evaluate(tagRibbon))) { fail(where, "ribbon tab list (with a Home tab) not found"); await ctx.close(); return; }
  // 1. layout
  const L = await page.evaluate(measureLayout);
  const availL = (L.tablist?.l ?? 0) - L.railRight;
  const availR = L.vw - (L.tablist?.r ?? L.vw);
  if (!L.tablist) fail(where, "no ribbon tab list found");
  else {
    const diff = Math.abs(availL - availR);
    if (diff > 40) fail(where, `empty space differs left ${availL}px vs right ${availR}px (max difference 40px)`);
    else ok(where, `left space ${availL}px, right space ${availR}px`);
    const usable = L.vw - L.railRight;
    const used = L.tablist.r - L.tablist.l;
    if (used < usable * 0.8) fail(where, `ribbon uses only ${Math.round((used / usable) * 100)}% of the width next to the rail (need at least 80%)`);
    else ok(where, `ribbon width ${used}px = ${Math.round((used / usable) * 100)}% of usable width`);
  }
  if (L.body && L.tablist) {
    if (Math.abs(L.body.l - L.tablist.l) > 3) fail(where, `note body left edge ${L.body.l}px but ribbon left edge ${L.tablist.l}px (must match within 3px)`);
    if (Math.abs(L.body.r - L.tablist.r) > 3) fail(where, `note body right edge ${L.body.r}px but ribbon right edge ${L.tablist.r}px (must match within 3px)`);
  } else fail(where, "could not find the note body to measure");
  if (L.goalBarCount > 0) fail(where, "the big WORD GOAL bar still exists");
  if (!L.goalBtn) fail(where, "no goal button found (needs aria-label or title containing 'goal')");
  else if (L.lastTab) {
    const inRow = Math.abs(L.goalBtn.cy - L.lastTab.cy) <= L.lastTab.h / 2;
    const afterShare = L.goalBtn.l >= L.lastTab.r - 4 && L.goalBtn.l - L.lastTab.r < 120;
    if (!inRow || !afterShare) fail(where, `goal button must sit right after the last tab (SHARE): button x=${L.goalBtn.l}, last tab ends x=${L.lastTab.r}`);
    else ok(where, "goal button is next to the SHARE tab");
  }

  // 2. every ribbon tab
  const ribbonTabs = page.locator('[data-uichk="ribbon"] [role="tab"]');
  const tabCount = await ribbonTabs.count();
  if (tabCount < 7) fail(where, `expected 7 ribbon tabs, found ${tabCount}`);
  const heights = [];
  for (let i = 0; i < tabCount; i++) {
    const tab = ribbonTabs.nth(i);
    const name = ((await tab.innerText()) || `tab${i}`).trim();
    await tab.click(); await wait(450);
    const R = await page.evaluate(measureRibbon);
    const tw = `${where} / ${name}`;
    if (R.error) { fail(tw, R.error); continue; }
    heights.push(R.panelH);
    if (R.overflowX > 1) fail(tw, `ribbon scrolls sideways by ${R.overflowX}px (must be 0)`);
    if (R.clipped.length) fail(tw, `${R.clipped.length} buttons cut off at the edge: ${R.clipped.slice(0, 4).join(", ")}`);
    if (R.noIcon.length) fail(tw, `${R.noIcon.length} buttons have no icon and no text: ${R.noIcon.slice(0, 4).join(" | ")}`);
    if (R.noName.length) fail(tw, `${R.noName.length} buttons have no name (aria-label/title)`);
    if (R.big.length) fail(tw, `oversized buttons: ${R.big.slice(0, 4).join(", ")}`);
    if (R.panelH > 140) fail(tw, `ribbon panel is ${R.panelH}px tall (max 140)`);
    if (!R.overflowX && !R.clipped.length && !R.noIcon.length && !R.big.length) ok(tw, `${R.buttons} controls, panel ${R.panelH}px tall`);
    await page.screenshot({ path: path.join(OUT, `ribbon-${where}-${name.replace(/\W+/g, "")}.png`), clip: { x: 0, y: 0, width: w, height: Math.min(h, 420) } });
  }
  if (heights.length && Math.max(...heights) - Math.min(...heights) > 8) fail(where, `ribbon height jumps between tabs: ${heights.join(", ")}px (all tabs must be the same height, within 8px)`);
  if (errors.length) fail(where, `page errors: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

async function themeSheet() {
  console.log("\n== Themes (1600x900)");
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "load" }); await wait(1500);
  const ids = await page.evaluate(async () => (await import("/src/lib/theme-presets.js")).THEME_PRESETS.map((p) => p.id));
  const cards = [];
  const seen = new Map();
  for (const id of ids) {
    for (const mode of ["light", "dark"]) {
      await openNote(page, { "theme:preset": id, theme: mode });
      const file = `theme-${id}-${mode}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      const info = await page.evaluate(() => {
        const cs = getComputedStyle(document.body);
        const card = document.querySelector(".nb-card, [class*=bg-card]");
        const prim = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
        return { bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 40), prim, radius: getComputedStyle(document.documentElement).getPropertyValue("--radius").trim() };
      });
      const key = `${mode}|${info.bg}|${info.prim}|${info.radius}`;
      if (seen.has(key)) fail(`theme ${id}/${mode}`, `looks the same as ${seen.get(key)} (same page colour, accent and radius)`);
      else seen.set(key, `${id}/${mode}`);
      cards.push({ id, mode, file });
    }
  }
  fs.writeFileSync(path.join(OUT, "themes.html"),
    `<!doctype html><meta charset=utf-8><title>LemonNote themes</title><body style="font:14px system-ui;background:#222;color:#eee;margin:16px"><h1>${ids.length} themes</h1><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:12px">` +
    cards.map((c) => `<figure style="margin:0"><img src="${c.file}" style="width:100%;border:1px solid #555"><figcaption>${c.id} (${c.mode})</figcaption></figure>`).join("") + "</div>");
  ok("themes", `${cards.length} screenshots, open ${OUT}/themes.html`);
  await ctx.close();
}

for (const [w, h] of [[800, 700], [1275, 720], [1920, 1080]]) await checkViewport(w, h);
if (args.themes) await themeSheet();
await browser.close();
console.log(`\n${fails.length ? `FAILED: ${fails.length} problems` : "ALL CHECKS PASSED"}  (screenshots in ${OUT}/)`);
process.exit(fails.length ? 1 : 0);
