const TASK_LINE = /^(\s*(?:[-*+]\s+|\d+\.\s+)?)(?:\[( |x|X)\]|(TODO|DOING|DONE))\s+(.+)$/;

const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };

export const TASK_STATES = [
  { id: "TODO", label: "To do" },
  { id: "DOING", label: "Doing" },
  { id: "DONE", label: "Done" },
];

export function parseTasks(note) {
  const lines = String(note?.body || "").split("\n");
  const found = [];
  lines.forEach((line, index) => {
    const match = line.match(TASK_LINE);
    if (!match) return;
    const text = match[4].trim();
    if (!text) return;
    const state = match[3] || (match[2] === " " ? "TODO" : "DONE");
    found.push({
      noteId: note.id,
      noteTitle: note.title || "Untitled note",
      line: index,
      state,
      text,
    });
  });
  return found;
}

export function collectTasks(notes) {
  return notes.flatMap((note) => parseTasks(note));
}

export function nextState(state) {
  return CYCLE[state] || "TODO";
}

export function setTaskState(body, lineIndex, state) {
  const lines = String(body || "").split("\n");
  const match = lines[lineIndex]?.match(TASK_LINE);
  if (!match) return body;
  lines[lineIndex] = `${match[1]}${state} ${match[4]}`;
  return lines.join("\n");
}