const TASK_LINE = /^(\s*(?:[-*+]\s+|\d+\.\s+)?)(?:\[( |x|X)\]|(TODO|DOING|DONE))\s+(.+)$/;
const DUE_REGEX = /due:(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?/i;

const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };

export const TASK_STATES = [
  { id: "TODO", label: "To do" },
  { id: "DOING", label: "Doing" },
  { id: "DONE", label: "Done" },
];

export const TASK_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "TODAY", label: "Today" },
  { id: "THIS_WEEK", label: "This week" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "NO_DATE", label: "No date" },
];

export function parseDueDate(text) {
  const match = String(text || "").match(DUE_REGEX);
  if (!match) return null;
  const dateStr = match[1];
  const timeStr = match[2] || "23:59";
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function formatDueDate(date) {
  if (!date) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dueDay.getTime() === today.getTime()) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dueDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);
  if (dueDay < weekLater) {
    return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) + 
           ` ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
         ` ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export function getDueDateStatus(date) {
  if (!date) return "no-date";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  if (date < now) return "overdue";
  if (dueDay.getTime() === today.getTime()) return "today";
  if (dueDay <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) return "this-week";
  return "future";
}

export function parseTasks(note) {
  const lines = String(note?.body || "").split("\n");
  const found = [];
  lines.forEach((line, index) => {
    const match = line.match(TASK_LINE);
    if (!match) return;
    const text = match[4].trim();
    if (!text) return;
    const state = match[3] || (match[2] === " " ? "TODO" : "DONE");
    const dueDate = parseDueDate(text);
    found.push({
      noteId: note.id,
      noteTitle: note.title || "Untitled note",
      line: index,
      state,
      text,
      dueDate,
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

export function filterTasks(tasks, filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  return tasks.filter((task) => {
    if (filter === "ALL") return true;
    if (filter === "NO_DATE") return !task.dueDate;
    if (!task.dueDate) return false;
    
    const dueDay = new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate(), 23, 59, 59);
    
    if (filter === "OVERDUE") return task.dueDate < now;
    if (filter === "TODAY") return dueDay.getTime() === today.getTime();
    if (filter === "THIS_WEEK") return dueDay > today && dueDay <= weekEnd;
    
    return true;
  });
}

export function sortTasks(tasks, sortBy = "dueDate") {
  return [...tasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    }
    if (sortBy === "state") {
      const stateOrder = { TODO: 0, DOING: 1, DONE: 2 };
      return (stateOrder[a.state] || 0) - (stateOrder[b.state] || 0);
    }
    if (sortBy === "noteTitle") {
      return (a.noteTitle || "").localeCompare(b.noteTitle || "");
    }
    return 0;
  });
}