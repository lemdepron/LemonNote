import { readPref, writePref, removePref, listPrefKeys, subscribePrefs } from "./preferences";
import { activePreset, presetVars } from "./theme-presets";
import NoteStatsPanel from "@/components/extensions/panels/NoteStatsPanel";
import NoteOutlinePanel from "@/components/extensions/panels/NoteOutlinePanel";
import SpacePulsePanel from "@/components/extensions/panels/SpacePulsePanel";
import WordGoalBar from "@/components/extensions/panels/WordGoalBar";
import VersionHistoryPanel from "@/components/extensions/panels/VersionHistoryPanel";
import PomodoroPanel from "@/components/extensions/panels/PomodoroPanel";
import VaultReplacePanel from "@/components/extensions/panels/VaultReplacePanel";
import NoteExportPanel from "@/components/extensions/panels/NoteExportPanel";
import LinkSuggesterPanel from "@/components/extensions/panels/LinkSuggesterPanel";
import { SPACE_IDS } from "./spaces";
import {
  createRegistry,
  dispatchIndexedEvent,
  indexRuntime,
  pluginApi,
  pluginLog,
  runIndexedHook,
  subscribePluginLog,
} from "./plugin-sandbox";

export { pluginLog, subscribePluginLog };

/**
 * Extension runtime.
 *
 * Extensions are capability-scoped manifests: a theme (CSS variable overrides,
 * per mode), a UI panel or title banner, a filter bound to a named hook, or a
 * subscriber to a named event. They never receive raw DOM or eval access, and
 * they cannot mutate vault data directly — a hook returns the value it wants
 * the host to use, and an event is only ever a notification.
 */

const ENABLED_KEY = "extensions:enabled";
const CUSTOM_THEME_KEY = "extensions:custom-theme";

const DEFAULT_ENABLED = ["document-stats", "note-outline", "space-pulse"];

/** Retired extensions: their switches and stored state are cleared on load. */
const REMOVED_EXTENSIONS = ["ember-palette", "moss-palette"];

const tidyWhitespace = (body = "") =>
  String(body)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n");

export const BUILTIN_EXTENSIONS = [
  {
    id: "document-stats",
    name: "Document stats",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Words, characters, reading time, link and tag counts for the open note.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: NoteStatsPanel,
  },
  {
    id: "note-outline",
    name: "Outline",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Indexes the open note's headings into a jump list.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: NoteOutlinePanel,
  },
  {
    id: "tidy-whitespace",
    name: "Tidy whitespace",
    author: "LemonNote",
    version: "1.0",
    kind: "hook",
    description: "Strips trailing spaces and collapses runs of blank lines on every save.",
    permissions: ["hook", "inspect"],
    hooks: {
      "note:before-save": {
        priority: 10,
        run: (payload, api) => {
          const body = payload.body || "";
          const next = tidyWhitespace(body);
          const removed = body.length - next.length;
          if (removed > 0) {
            api.setPref("tidies", (Number(api.pref("tidies", 0)) || 0) + 1);
            api.state().removed = removed;
          }
          return { ...payload, body: next };
        },
      },
    },
    inspect: (api) => {
      const tidies = Number(api.pref("tidies", 0)) || 0;
      if (!tidies) return null;
      return { tidied: tidies, last: `${api.state().removed ?? 0}ch` };
    },
  },
  {
    id: "space-pulse",
    name: "Space pulse",
    author: "LemonNote",
    version: "1.0",
    kind: "event",
    description: "Counts how often each tab is entered and shows the tally in a panel on the note page.",
    permissions: ["events", "inspect", "panel"],
    spaces: ["vault"],
    panel: SpacePulsePanel,
    subscribes: {
      "space:entered": (detail, api) => {
        const visits = api.pref("visits", {});
        const key = detail.space || "none";
        visits[key] = (visits[key] || 0) + 1;
        api.setPref("visits", visits);
        api.setPref("last", key);
        api.state().last = key;
      },
    },
    inspect: (api) => {
      const visits = api.pref("visits", {});
      const [top] = Object.entries(visits).sort((a, b) => b[1] - a[1]);
      return {
        last: api.pref("last", null) || null,
        tabs: Object.keys(visits).length,
        top: top ? `${top[0]} ${top[1]}` : null,
      };
    },
  },
  {
    id: "word-goal",
    name: "Word goal",
    author: "LemonNote",
    version: "1.0",
    kind: "banner",
    description: "Sets a word target per note and tracks progress in a bar under the title.",
    permissions: ["banner"],
    spaces: ["vault"],
    banner: WordGoalBar,
  },
  {
    id: "version-history",
    name: "Version history",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Snapshots the open note every 5 minutes of editing; any snapshot can be restored.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: VersionHistoryPanel,
  },
  {
    id: "pomodoro",
    name: "Pomodoro timer",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "A 25/5 focus timer with start, pause and a chime when a session finishes.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: PomodoroPanel,
  },
  {
    id: "vault-replace",
    name: "Vault find & replace",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Searches every note with a preview, then replaces the text across the whole vault.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: VaultReplacePanel,
  },
  {
    id: "note-export",
    name: "Export",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Downloads the open note as Markdown, a standalone HTML page or a PDF.",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: NoteExportPanel,
  },
  {
    id: "link-suggester",
    name: "Link suggester",
    author: "LemonNote",
    version: "1.0",
    kind: "panel",
    description: "Highlights words that match another note's title and turns them into [[links]].",
    permissions: ["panel"],
    spaces: ["vault"],
    panel: LinkSuggesterPanel,
  },
];

let registry = { plugins: [] };
let runtime = { hooks: new Map(), events: new Map() };

const enabledIds = () => new Set(readPref(ENABLED_KEY, DEFAULT_ENABLED));

function rebuild() {
  registry = createRegistry(BUILTIN_EXTENSIONS, SPACE_IDS);
  runtime = indexRuntime(registry.plugins, (id) => enabledIds().has(id));
}

/** Drop the switches and stored state a retired extension left behind. */
function pruneRemovedExtensions() {
  const stored = readPref(ENABLED_KEY, null);
  if (Array.isArray(stored)) {
    const kept = stored.filter((id) => !REMOVED_EXTENSIONS.includes(id));
    if (kept.length !== stored.length) writePref(ENABLED_KEY, kept);
  }
  listPrefKeys()
    .filter((key) => REMOVED_EXTENSIONS.some((id) => key.startsWith(`plugin:${id}:`)))
    .forEach(removePref);
}

export function listExtensions() {
  const enabled = enabledIds();
  return registry.plugins.map((plugin) => ({ ...plugin, enabled: enabled.has(plugin.id) }));
}

export function isExtensionEnabled(id) {
  return enabledIds().has(id);
}

export function setExtensionEnabled(id, value) {
  const enabled = enabledIds();
  if (value) enabled.add(id);
  else enabled.delete(id);
  writePref(ENABLED_KEY, [...enabled]);
  refreshRuntime();
}

export function subscribeExtensions(listener) {
  return subscribePrefs(listener);
}

/** Panels a space may render, in manifest order. */
export function panelsFor(space) {
  const enabled = enabledIds();
  return registry.plugins.filter(
    (plugin) =>
      plugin.panel && enabled.has(plugin.id) && (plugin.spaces.includes(space) || plugin.spaces.includes("*"))
  );
}

/** Title banners a space may render, in manifest order. */
export function bannersFor(space) {
  const enabled = enabledIds();
  return registry.plugins.filter(
    (plugin) =>
      plugin.banner && enabled.has(plugin.id) && (plugin.spaces.includes(space) || plugin.spaces.includes("*"))
  );
}

/** Read a plugin's self-reported state without handing the caller its api. */
export function inspectExtension(id) {
  const plugin = registry.plugins.find((entry) => entry.id === id);
  if (!plugin || !plugin.inspect) return null;
  const facts = plugin.inspect(pluginApi(plugin));
  return facts && typeof facts === "object" ? facts : null;
}

/* ---------- hooks and events ---------- */

export function runHook(name, payload) {
  return runIndexedHook(runtime, name, payload);
}

export function emitEvent(name, detail) {
  return dispatchIndexedEvent(runtime, name, detail);
}

/* ---------- themes ---------- */

const appliedVars = new Set();

export function parseCustomTheme(text = "") {
  const vars = {};
  String(text)
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return;
      const match = /^(--[a-z0-9-]+)\s*:\s*(.+)$/i.exec(trimmed);
      if (!match) return;
      const value = match[2].replace(/;+\s*$/, "").trim();
      if (!value || /[;{}<>]/.test(value)) return;
      vars[match[1]] = value;
    });
  return vars;
}

export function readCustomTheme() {
  return readPref(CUSTOM_THEME_KEY, "");
}

export function setCustomTheme(text) {
  writePref(CUSTOM_THEME_KEY, text || "");
  refreshRuntime();
}

export function activeThemeVars(mode = "dark") {
  const enabled = enabledIds();
  // The chosen preset paints first; an extension or the custom block layers on top.
  const vars = { ...presetVars(activePreset(), mode) };
  registry.plugins.forEach((plugin) => {
    if (!plugin.theme || !enabled.has(plugin.id)) return;
    Object.assign(vars, plugin.theme[mode] || {});
  });
  return { ...vars, ...parseCustomTheme(readCustomTheme()) };
}

export function applyTheme() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mode = root.classList.contains("dark") ? "dark" : "light";
  root.dataset.surface = activePreset()?.surface || "plain";
  const next = activeThemeVars(mode);
  appliedVars.forEach((name) => {
    if (!(name in next)) {
      root.style.removeProperty(name);
      appliedVars.delete(name);
    }
  });
  Object.entries(next).forEach(([name, value]) => {
    root.style.setProperty(name, value);
    appliedVars.add(name);
  });
}

export function refreshRuntime() {
  rebuild();
  applyTheme();
}

pruneRemovedExtensions();
rebuild();