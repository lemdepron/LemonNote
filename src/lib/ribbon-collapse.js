/**
 * Pure helpers for the ribbon's responsive group collapse.
 *
 * The ribbon panel measures itself with a ResizeObserver. When the groups do
 * not fit, groups are collapsed into a dropdown button, lowest priority first.
 * A lower `priority` number collapses first (1 = first, larger = later).
 *
 * This file has no React or DOM imports so a Node script can test it.
 */

/** Extra room demanded before a collapsed group is allowed to expand again. */
export const EXPAND_MARGIN = 8;

/**
 * The expanded group that should collapse next: the one with the lowest
 * priority. Groups without a measured width yet are skipped.
 * @returns {object|null} the group, or null when nothing can collapse.
 */
export function pickNextToCollapse(groups, collapsed) {
  let best = null;
  for (const group of groups) {
    if (collapsed.has(group.id) || !group.width) continue;
    if (!best || group.priority < best.priority) best = group;
  }
  return best;
}

/**
 * The collapsed group that should expand next: the highest-priority one whose
 * measured width fits in the spare room. Returns null when none fits.
 * @returns {object|null} the group, or null when nothing can expand.
 */
export function pickNextToExpand(groups, collapsed, spare) {
  let best = null;
  for (const group of groups) {
    if (!collapsed.has(group.id)) continue;
    if (group.width > spare - EXPAND_MARGIN) continue;
    if (!best || group.priority > best.priority) best = group;
  }
  return best;
}

/**
 * True when a group needs no collapse: every group fits and nothing is
 * collapsed. Used by tests and by the component as a sanity check.
 */
export function allFit(groups, available) {
  const total = groups.reduce((sum, group) => sum + (group.width || 0), 0);
  return total <= available;
}
