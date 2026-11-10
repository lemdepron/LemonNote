/** Simple utilities for the ink suite. */

let counter = 0;
export const nextId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;