/**
 * Pure helpers for the ribbon's responsive group collapse.
 *
 * The ribbon panel measures itself with a ResizeObserver. When the groups do
 * not fit, groups collapse through three states:
 *   FULL  ->  ICON  ->  OVERFLOW
 * Lowest priority first. A lower `priority` number collapses first (1 = first, larger = later).
 *
 * This file has no React or DOM imports so a Node script can test it.
 */

export const EXPAND_MARGIN = 8;

/**
 * Group states
 * - 'full': Shows all buttons in 2-row grid with label below
 * - 'icon': Shows single 32px button with icon + chevron, opens popover with full content
 * - 'overflow': Not shown in main ribbon, appears in "More" popover
 */
export const GROUP_STATE = {
  FULL: 'full',
  ICON: 'icon',
  OVERFLOW: 'overflow',
};

/**
 * The expanded group that should collapse next: the one with the lowest
 * priority. Groups without a measured width yet are skipped.
 * @returns {object|null} the group, or null when nothing can collapse.
 */
export function pickNextToCollapse(groups, state) {
  let best = null;
  for (const group of groups) {
    const groupState = state.get(group.id) || GROUP_STATE.FULL;
    if (groupState === GROUP_STATE.OVERFLOW || !group.width) continue;
    if (!best || group.priority < best.priority) best = group;
  }
  return best;
}

/**
 * The collapsed group that should expand next: the highest-priority one whose
 * measured width fits in the spare room. Returns null when none fits.
 * @returns {object|null} the group, or null when nothing can expand.
 */
export function pickNextToExpand(groups, state, spare) {
  let best = null;
  for (const group of groups) {
    const groupState = state.get(group.id) || GROUP_STATE.FULL;
    if (groupState === GROUP_STATE.FULL) continue;
    // Can expand from OVERFLOW -> ICON, or ICON -> FULL
    const nextState = groupState === GROUP_STATE.OVERFLOW ? GROUP_STATE.ICON : GROUP_STATE.FULL;
    const neededWidth = nextState === GROUP_STATE.FULL ? group.width : 36; // 32px + gap
    if (neededWidth > spare - EXPAND_MARGIN) continue;
    if (!best || group.priority > best.priority) best = group;
  }
  return best;
}

/**
 * Calculate the total width needed for all groups in their current states.
 * @returns {number} total width in pixels
 */
export function calculateTotalWidth(groups, state) {
  let total = 0;
  for (const group of groups) {
    const groupState = state.get(group.id) || GROUP_STATE.FULL;
    if (groupState === GROUP_STATE.OVERFLOW) continue;
    if (groupState === GROUP_STATE.FULL) {
      total += group.width || 0;
    } else if (groupState === GROUP_STATE.ICON) {
      total += 36; // 32px button + 4px gap
    }
  }
  return total;
}

/**
 * True when all groups fit in FULL state and nothing is collapsed.
 */
export function allFit(groups, available) {
  const total = groups.reduce((sum, group) => sum + (group.width || 0), 0);
  return total <= available;
}

/** Width of a collapsed (ICON) group button and of the "More" button, in px. */
export const ICON_WIDTH = 44;
export const MORE_WIDTH = 44;

/**
 * Decide the state of every group for a given available width. Pure and
 * deterministic: the same widths always give the same result, so the ribbon
 * never flickers or ends up in a different state after a resize.
 *   1. Collapse groups to ICON, lowest priority first, until everything fits.
 *   2. If it still does not fit, move ICON groups to OVERFLOW ("More"), lowest
 *      priority first, reserving room for the More button.
 * @param {{id:string, priority:number, width:number, iconWidth?:number}[]} groups
 * @returns {Map<string,string>} id -> GROUP_STATE
 */
export function computeIdealStates(groups, availableWidth) {
  const states = new Map(groups.map((g) => [g.id, GROUP_STATE.FULL]));
  if (!availableWidth || groups.length === 0) return states;
  const sorted = [...groups].sort((a, b) => a.priority - b.priority);
  const iconW = (g) => g.iconWidth || ICON_WIDTH;
  let total = groups.reduce((sum, g) => sum + (g.width || 0), 0) + groups.length;
  for (const g of sorted) {
    if (total <= availableWidth) break;
    if (!g.width || iconW(g) >= g.width) continue;
    states.set(g.id, GROUP_STATE.ICON);
    total -= g.width - iconW(g);
  }
  if (total > availableWidth) {
    total += MORE_WIDTH;
    for (const g of sorted) {
      if (total <= availableWidth) break;
      if (states.get(g.id) !== GROUP_STATE.ICON) continue;
      states.set(g.id, GROUP_STATE.OVERFLOW);
      total -= iconW(g);
    }
  }
  // Re-expand pass: the greedy collapse can free more room than needed. Give the space back to
  // the highest-priority collapsed groups that now fit.
  for (const g of [...sorted].reverse()) {
    if (states.get(g.id) !== GROUP_STATE.ICON || !g.width) continue;
    const delta = g.width - iconW(g);
    if (total + delta <= availableWidth) {
      states.set(g.id, GROUP_STATE.FULL);
      total += delta;
    }
  }
  return states;
}

/**
 * Given current state and available width, compute the next state change.
 * Returns { groupId, fromState, toState } or null if no change needed.
 */
export function computeNextChange(groups, state, available) {
  const totalWidth = calculateTotalWidth(groups, state);

  if (totalWidth > available + 1) {
    // Need to collapse
    const next = pickNextToCollapse(groups, state);
    if (next) {
      const currentState = state.get(next.id) || GROUP_STATE.FULL;
      const toState = currentState === GROUP_STATE.FULL ? GROUP_STATE.ICON : GROUP_STATE.OVERFLOW;
      return { groupId: next.id, fromState: currentState, toState };
    }
  } else if (totalWidth < available - EXPAND_MARGIN) {
    // Can expand
    const next = pickNextToExpand(groups, state, available - totalWidth);
    if (next) {
      const currentState = state.get(next.id) || GROUP_STATE.FULL;
      const toState = currentState === GROUP_STATE.OVERFLOW ? GROUP_STATE.ICON : GROUP_STATE.FULL;
      return { groupId: next.id, fromState: currentState, toState };
    }
  }
  return null;
}