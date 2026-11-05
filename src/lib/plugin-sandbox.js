import { readPref, writePref } from "./preferences";

/**
 * The sandbox boundary.
 *
 * A plugin is a manifest, never a script: it declares the capabilities it
 * needs plus the hook and event names it binds to, and the host validates
 * every one of them before anything runs. Handlers receive a frozen `api`
 * instead of the window, a throwing handler is isolated to itself, and each
 * run lands in a ring buffer so the Extensions tab can show what fired.
 */

export const PERMISSIONS = ["theme", "panel", "banner", "hook", "events", "inspect"];

export const HOOK_CONTRACTS = {
  "note:before-save": {
    summary: "Pipes the note about to be written. Return a changed shape to alter the save; return nothing to leave it alone.",
    payload: "{ title, body, tags }",
  },
};

export const EVENT_CONTRACTS = {
  "space:entered": {
    summary: "Fires once on every tab change, after the route settles.",
    detail: "{ space, path }",
  },
  "note:opened": {
    summary: "Fires after a note finishes loading from the vault.",
    detail: "{ id }",
  },
  "note:saved": {
    summary: "Fires after a debounced save is written back.",
    detail: "{ id }",
  },
};

const LOG_LIMIT = 80;
const RECURSION_LIMIT = 4;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;
const TOKEN_PATTERN = /^--[a-z0-9-]+$/;
const HSL_PATTERN = /^[0-9.]+ [0-9.]+% [0-9.]+%$/;

const log = [];
const logWatchers = new Set();
const apis = new Map();
const scratch = new Map();
let sequence = 0;
let dispatchDepth = 0;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const messageOf = (error) => String((error && error.message) || error).slice(0, 160);

export function pluginLog() {
  return log.slice();
}

export function subscribePluginLog(listener) {
  logWatchers.add(listener);
  return () => logWatchers.delete(listener);
}

function record(entry) {
  const next = { id: ++sequence, at: Date.now(), ...entry };
  log.unshift(next);
  if (log.length > LOG_LIMIT) log.length = LOG_LIMIT;
  logWatchers.forEach((listener) => {
    try {
      listener(next);
    } catch {
      /* a broken watcher must not stop the runtime */
    }
  });
}

function summarise(detail = {}) {
  return Object.entries(detail)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .slice(0, 2)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
}

/** The only object a handler ever receives. Frozen, per plugin, no globals. */
export function pluginApi(plugin) {
  if (apis.has(plugin.id)) return apis.get(plugin.id);
  const api = Object.freeze({
    pluginId: plugin.id,
    pref: (key, fallback) => readPref(`plugin:${plugin.id}:${key}`, fallback),
    setPref: (key, value) => writePref(`plugin:${plugin.id}:${key}`, value),
    state: () => {
      if (!scratch.has(plugin.id)) scratch.set(plugin.id, {});
      return scratch.get(plugin.id);
    },
    report: (message) =>
      record({ type: "log", name: plugin.id, pluginId: plugin.id, ok: true, detail: String(message).slice(0, 160) }),
  });
  apis.set(plugin.id, api);
  return api;
}

function normaliseTheme(raw, problems) {
  if (!raw || typeof raw !== "object") return null;
  const modes = raw.light || raw.dark ? { light: raw.light || {}, dark: raw.dark || {} } : { light: raw, dark: raw };
  const resolved = { light: {}, dark: {} };
  ["light", "dark"].forEach((mode) => {
    Object.entries(modes[mode] || {}).forEach(([name, value]) => {
      if (!TOKEN_PATTERN.test(name) || !HSL_PATTERN.test(String(value).trim())) {
        problems.push(`${mode}: skipped token ${name}`);
        return;
      }
      resolved[mode][name] = String(value).trim();
    });
  });
  return Object.keys(resolved.light).length || Object.keys(resolved.dark).length ? resolved : null;
}

/**
 * Validate a manifest and return the normalized plugin. Anything a manifest
 * was not granted is dropped rather than trusted, and the reason is kept so
 * the Extensions tab can show it.
 */
export function normalizeManifest(raw = {}, spaceIds = []) {
  const problems = [];
  const id = String(raw.id || "");
  if (!ID_PATTERN.test(id)) problems.push("id must be lowercase words separated by dashes");

  const permissions = (Array.isArray(raw.permissions) ? raw.permissions : []).filter((permission) => {
    if (PERMISSIONS.includes(permission)) return true;
    problems.push(`unknown capability ${permission}`);
    return false;
  });

  const hooks = {};
  Object.entries(raw.hooks || {}).forEach(([name, value]) => {
    const spec = typeof value === "function" ? { run: value } : value || {};
    if (!HOOK_CONTRACTS[name]) return problems.push(`unknown hook ${name}`);
    if (!permissions.includes("hook")) return problems.push(`hook ${name} without the hook capability`);
    if (typeof spec.run !== "function") return problems.push(`hook ${name} has no handler`);
    hooks[name] = { run: spec.run, priority: Number(spec.priority) || 0 };
  });

  const subscribes = {};
  Object.entries(raw.subscribes || {}).forEach(([name, handler]) => {
    if (!EVENT_CONTRACTS[name]) return problems.push(`unknown event ${name}`);
    if (!permissions.includes("events")) return problems.push(`event ${name} without the events capability`);
    if (typeof handler !== "function") return problems.push(`event ${name} has no handler`);
    subscribes[name] = handler;
  });

  const allowsTheme = permissions.includes("theme");
  const theme = raw.theme && allowsTheme ? normaliseTheme(raw.theme, problems) : null;
  if (raw.theme && !allowsTheme) problems.push("theme overrides need the theme capability");

  const canPanel = Boolean(raw.panel) && permissions.includes("panel");
  if (raw.panel && !permissions.includes("panel")) problems.push("a panel needs the panel capability");

  const canBanner = Boolean(raw.banner) && permissions.includes("banner");
  if (raw.banner && !permissions.includes("banner")) problems.push("a banner needs the banner capability");

  const spaces = Array.isArray(raw.spaces) ? raw.spaces.filter((space) => spaceIds.includes(space) || space === "*") : [];
  if (canPanel && !spaces.length) problems.push("a panel needs at least one space");
  if (canBanner && !spaces.length) problems.push("a banner needs at least one space");

  const inspect = typeof raw.inspect === "function" && permissions.includes("inspect") ? raw.inspect : null;
  if (typeof raw.inspect === "function" && !permissions.includes("inspect")) {
    problems.push("inspect needs the inspect capability");
  }

  return {
    ...raw,
    id,
    permissions,
    hooks,
    subscribes,
    theme,
    panel: canPanel ? raw.panel : null,
    banner: canBanner ? raw.banner : null,
    inspect,
    spaces,
    problems,
  };
}

export function createRegistry(manifests = [], spaceIds = []) {
  return { plugins: manifests.map((raw) => normalizeManifest(raw, spaceIds)) };
}

/** Index only what is enabled, ordered handlers first. */
export function indexRuntime(plugins, isEnabled) {
  const hooks = new Map();
  const events = new Map();
  plugins.forEach((plugin) => {
    if (!isEnabled(plugin.id)) return;
    Object.entries(plugin.hooks).forEach(([name, spec]) => {
      if (!hooks.has(name)) hooks.set(name, []);
      hooks.get(name).push({ plugin, run: spec.run, priority: spec.priority });
    });
    Object.entries(plugin.subscribes).forEach(([name, run]) => {
      if (!events.has(name)) events.set(name, []);
      events.get(name).push({ plugin, run });
    });
  });
  hooks.forEach((handlers) => handlers.sort((a, b) => a.priority - b.priority));
  return { hooks, events };
}

export function runIndexedHook(runtime, name, payload) {
  const handlers = runtime.hooks.get(name) || [];
  return handlers.reduce((value, handler) => {
    const started = now();
    try {
      const next = handler.run(value, pluginApi(handler.plugin));
      record({
        type: "hook",
        name,
        pluginId: handler.plugin.id,
        ok: true,
        ms: Math.round(now() - started),
      });
      return next === undefined ? value : next;
    } catch (error) {
      record({
        type: "hook",
        name,
        pluginId: handler.plugin.id,
        ok: false,
        error: messageOf(error),
        ms: Math.round(now() - started),
      });
      return value;
    }
  }, payload);
}

export function dispatchIndexedEvent(runtime, name, detail = {}) {
  if (!EVENT_CONTRACTS[name]) {
    record({ type: "event", name, ok: false, error: "not in the event contract" });
    return 0;
  }
  if (dispatchDepth >= RECURSION_LIMIT) {
    record({ type: "event", name, ok: false, error: "recursion guard" });
    return 0;
  }
  const subscribers = runtime.events.get(name) || [];
  dispatchDepth += 1;
  try {
    subscribers.forEach((subscriber) => {
      const started = now();
      try {
        subscriber.run(Object.freeze({ ...detail }), pluginApi(subscriber.plugin));
      } catch (error) {
        record({
          type: "event",
          name,
          pluginId: subscriber.plugin.id,
          ok: false,
          error: messageOf(error),
          ms: Math.round(now() - started),
        });
      }
    });
  } finally {
    dispatchDepth -= 1;
  }
  record({ type: "event", name, ok: true, detail: summarise(detail), handled: subscribers.length });
  return subscribers.length;
}