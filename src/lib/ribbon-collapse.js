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

/**
 * Compute the ideal state for each group given available width.
 * Returns a Map<groupId, state> with the new states.
 */
export function computeIdealStates(groups, available) {
  const state = new Map();
  // Start with all FULL
  for (const group of groups) {
    state.set(group.id, GROUP_STATE.FULL);
  }

  const sorted = [...groups].sort((a, b) => a.priority - b.priority); // lowest priority first

  // Collapse to ICON until fits or all are ICON
  let totalWidth = calculateTotalWidth(groups, state);
  for (const group of sorted) {
    if (totalWidth <= available) break;
    if (!group.width) continue;
    state.set(group.id, GROUP_STATE.ICON);
    totalWidth = calculateTotalWidth(groups, state);
  }

  // If still doesn't fit, move lowest priority to OVERFLOW
  if (totalWidth > available) {
    for (const group of sorted) {
      if (totalWidth <= available) break;
      const groupState = state.get(group.id);
      if (groupState === GROUP_STATE.OVERFLOW) continue;
      state.set(group.id, GROUP_STATE.OVERFLOW);
      totalWidth = calculateTotalWidth(groups, state);
    }
  }

  return state;
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