/**
 * One word-count implementation for the whole note text.
 *
 * Everything in the note counts — headings, list markers' words and the
 * contents of fenced code blocks — so the vault and every panel agree.
 */
export function countWords(text = "") {
  const matched = String(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu);
  return matched ? matched.length : 0;
}