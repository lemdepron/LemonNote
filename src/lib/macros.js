/**
 * Macro engine: records text edits as minimal diff steps and replays them
 * as a batch transformation. Steps are plain data (no eval), so a macro can
 * never execute arbitrary code — only text substitutions.
 */

const CONTEXT = 40;
const STEP_LIMIT = 400;

const newId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Diff two snapshots of a body into a single replayable step. */
export function captureStep(before = "", after = "") {
  if (before === after) return null;
  const max = Math.min(before.length, after.length);
  let start = 0;
  while (start < max && before[start] === after[start]) start += 1;
  let tail = 0;
  while (tail < max - start && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail += 1;

  const removed = before.slice(start, before.length - tail);
  const inserted = after.slice(start, after.length - tail);
  const anchor = before.slice(Math.max(0, start - CONTEXT), start);

  if (removed) return { kind: "replace", anchor, find: removed, replace: inserted };
  if (inserted) return { kind: "insert", anchor, text: inserted };
  return null;
}

/** Append a step, merging consecutive typing into one insertion step. */
export function appendStep(steps = [], step) {
  if (!step) return steps;
  const last = steps[steps.length - 1];
  if (last && last.kind === "insert" && step.kind === "insert" && step.anchor === `${last.anchor}${last.text}`) {
    const merged = [...steps];
    merged[merged.length - 1] = { ...last, text: last.text + step.text };
    return merged;
  }
  const next = [...steps, step];
  return next.length > STEP_LIMIT ? next.slice(-STEP_LIMIT) : next;
}

/** Replay a macro over a body, honouring recorded anchors where possible. */
export function applyMacro(body = "", steps = []) {
  let out = body;
  steps.forEach((step) => {
    if (step.kind === "insert") {
      const at = step.anchor ? out.indexOf(step.anchor) : -1;
      const position = at >= 0 ? at + step.anchor.length : 0;
      out = `${out.slice(0, position)}${step.text}${out.slice(position)}`;
      return;
    }
    if (!step.find) return;
    const index = out.indexOf(step.find);
    if (index === -1) return;
    out = `${out.slice(0, index)}${step.replace || ""}${out.slice(index + step.find.length)}`;
  });
  return out;
}

export function createMacro(name, steps = []) {
  return {
    id: newId(),
    name: (name || "").trim() || "Untitled macro",
    steps,
    created_date: new Date().toISOString(),
  };
}

export function describeMacro(macro) {
  const count = macro?.steps?.length || 0;
  return `${count} step${count === 1 ? "" : "s"}`;
}