/**
 * Pure scroll direction logic for the top-area auto-hide behavior.
 * No React dependencies - fully testable in Node.
 * 
 * Rules:
 * - Scroll DOWN: hide the top area (note tabs row, breadcrumb row, panel)
 *   Only the ribbon tab line (sticky) stays at top.
 * - Scroll UP, even by ~8px: show ALL of it at once
 * - At very top of page (scrollY <= 8): always show
 * - Dead zone: ignore tiny movements (< 8px) for direction detection
 * - Hide threshold: 40px down since last direction change
 * - Show threshold: 16px up since last direction change
 * - Grace mode (after tab click/focus in top area): hide only after 80px down
 * - Popover open: keeps visible
 * 
 * State shape:
 * {
 *   visible: boolean,        // whether top area is visible
 *   direction: number,       // 1 = down, -1 = up, 0 = none
 *   accumulated: number,     // accumulated delta since last direction change
 *   graceMode: boolean,      // in grace period after tab click/focus
 *   atTop: boolean           // at very top of page (scrollY <= deadZone)
 * }
 * 
 * Config:
 * {
 *   deadZone: 8,             // ignore movements smaller than this for direction
 *   hideThreshold: 40,       // px down to hide
 *   showThreshold: 16,       // px up to show
 *   graceThreshold: 80,      // px down to hide in grace mode
 *   popoverOpen: false       // whether a popover is open
 * }
 */

export function calculateScrollState(prevScrollY, newScrollY, currentState, config = {}) {
  const {
    deadZone = 8,
    hideThreshold = 40,
    showThreshold = 16,
    graceThreshold = 80,
    popoverOpen = false
  } = config;

  // Clone current state to avoid mutation
  const state = { ...currentState };
  
  const scrollY = newScrollY;
  const atTop = scrollY <= deadZone;

  // If popover is open, keep visible but don't update accumulated/direction
  // (wait for popover to close to resume tracking)
  if (popoverOpen) {
    return {
      ...state,
      visible: true,
      atTop
    };
  }

  // Always show at very top of page
  // But only reset graceMode if we're STAYING at top (not leaving it)
  if (atTop) {
    const wasAtTop = state.atTop;
    return {
      visible: true,
      direction: -1,
      accumulated: wasAtTop ? state.accumulated : -showThreshold,
      graceMode: wasAtTop ? state.graceMode : false,
      atTop: true
    };
  }

  const delta = scrollY - prevScrollY;
  const absDelta = Math.abs(delta);

  // Determine if this movement is significant enough to register as a direction
  const isSignificant = absDelta >= deadZone;
  const currentDirection = delta > 0 ? 1 : -1;

  // Always accumulate the raw delta for threshold checking
  // But only update direction when movement is significant
  if (isSignificant) {
    // Direction changed
    if (currentDirection !== state.direction && state.direction !== 0) {
      state.accumulated = delta;
    } else {
      state.accumulated += delta;
    }
    state.direction = currentDirection;
  } else {
    // Tiny movement: still accumulate but don't change direction
    state.accumulated += delta;
  }

  const threshold = state.graceMode ? graceThreshold : (state.direction > 0 ? hideThreshold : showThreshold);

  // Exit grace mode on scroll up (showing panel ends grace period)
  // Or on scroll down past graceThreshold
  if (state.graceMode) {
    if (state.direction === -1) {
      state.graceMode = false;
    } else if (state.direction === 1 && state.accumulated >= graceThreshold) {
      state.graceMode = false;
    }
  }

  // Hide logic (scroll down)
  if (state.direction === 1 && state.accumulated >= threshold) {
    state.visible = false;
    state.accumulated = threshold;
  }
  // Show logic (scroll up)
  else if (state.direction === -1 && state.accumulated <= -threshold) {
    state.visible = true;
    state.accumulated = -threshold;
  }

  state.atTop = false;

  return state;
}

/**
 * Initial state for the scroll tracker
 */
export const initialScrollState = {
  visible: true,
  direction: 0,
  accumulated: 0,
  graceMode: false,
  atTop: true
};

/**
 * Enters grace mode (e.g., after tab click or focus in top area)
 * Resets accumulated to -graceThreshold so hide requires more scroll down
 */
export function enterGraceMode(state, graceThreshold = 80) {
  return {
    ...state,
    visible: true,
    graceMode: true,
    accumulated: -graceThreshold,
    direction: -1
  };
}