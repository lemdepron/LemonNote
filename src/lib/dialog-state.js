/**
 * Dialog state module - replaces window.__globals for passing data between components
 * without using global variables.
 */

// Figure caption state for the Figure button in InsertTab
let pendingFigureCaption = undefined;

export function setPendingFigureCaption(caption) {
  pendingFigureCaption = caption;
}

export function getPendingFigureCaption() {
  const caption = pendingFigureCaption;
  pendingFigureCaption = undefined; // Consume it
  return caption;
}

export function hasPendingFigureCaption() {
  return pendingFigureCaption !== undefined;
}

// Template application state (if needed in future)
// let pendingTemplate = undefined;

// export function setPendingTemplate(template) {
//   pendingTemplate = template;
// }

// export function getPendingTemplate() {
//   const template = pendingTemplate;
//   pendingTemplate = undefined;
//   return template;
// }

// export function hasPendingTemplate() {
//   return pendingTemplate !== undefined;
// }