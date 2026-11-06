import {
  BookOpen,
  CalendarDays,
  Code2,
  Layers,
  LayoutGrid,
  ListChecks,
  PenLine,
  Puzzle,
  Share2,
  Table2,
  Wand2,
} from "lucide-react";

/**
 * The tab manifest.
 *
 * One entry per tab: where it lives, what it stores, and the only surfaces a
 * plugin may attach to. Navigation, the runtime's space contract and the
 * manifest page all read from here, so they cannot drift apart.
 */
export const SPACES = [
  {
    id: "vault",
    label: "Vault",
    path: "/",
    match: ["/", "/note", "/trash"],
    icon: BookOpen,
    purpose: "Markdown notes with [[wiki-links]], tags, backlinks and full-text search.",
    routes: ["/", "/note/:id", "/trash"],
    entities: ["Note"],
    hooks: ["note:before-save"],
    events: ["note:opened", "note:saved"],
    panel: true,
    shortcuts: ["/ search", "⌘K palette"],
  },
  {
    id: "journal",
    label: "Journal",
    path: "/journal",
    match: ["/journal"],
    icon: CalendarDays,
    purpose: "One note per day, opened or created from the current date.",
    routes: ["/journal"],
    entities: ["Note"],
    hooks: [],
    events: [],
    panel: false,
    rail: false,
    shortcuts: [],
  },
  {
    id: "tasks",
    label: "Tasks",
    path: "/tasks",
    match: ["/tasks"],
    icon: ListChecks,
    purpose: "Task lines parsed out of note bodies and cycled between states.",
    routes: ["/tasks"],
    entities: ["Note"],
    hooks: [],
    events: [],
    panel: false,
    rail: false,
    shortcuts: [],
  },
  {
    id: "cards",
    label: "Cards",
    path: "/cards",
    match: ["/cards"],
    icon: Layers,
    purpose: "Spaced-repetition flashcards with review scheduling.",
    routes: ["/cards"],
    entities: ["Flashcard"],
    hooks: [],
    events: [],
    panel: false,
    rail: false,
    shortcuts: [],
  },
  {
    id: "graph",
    label: "Graph",
    path: "/graph",
    match: ["/graph"],
    icon: Share2,
    purpose: "Force-directed map of notes and the wiki-links between them.",
    routes: ["/graph"],
    entities: ["Note"],
    hooks: [],
    events: [],
    panel: false,
    shortcuts: [],
  },
  {
    id: "canvas",
    label: "Canvas",
    path: "/canvas",
    match: ["/canvas"],
    icon: LayoutGrid,
    purpose: "Infinite boards of cards connected by edges.",
    routes: ["/canvas", "/canvas/:id"],
    entities: ["Canvas"],
    hooks: [],
    events: [],
    panel: false,
    shortcuts: [],
  },
  {
    id: "tables",
    label: "Tables",
    path: "/tables",
    match: ["/tables"],
    icon: Table2,
    purpose: "Relational tables with grid, board and gallery views.",
    routes: ["/tables", "/tables/:id"],
    entities: ["DataTable"],
    hooks: [],
    events: [],
    panel: false,
    rail: false,
    shortcuts: [],
  },
  {
    id: "code",
    label: "Code",
    path: "/code",
    match: ["/code"],
    icon: Code2,
    purpose: "Source files with find and replace over a syntax-aware editor.",
    routes: ["/code", "/code/:id"],
    entities: ["CodeFile"],
    hooks: [],
    events: [],
    panel: false,
    rail: false,
    shortcuts: [],
  },
  {
    id: "queries",
    label: "Queries",
    path: "/queries",
    match: ["/queries"],
    icon: Wand2,
    purpose: "Saved Datalog-style queries over notes, tags and links.",
    routes: ["/queries"],
    entities: ["Note"],
    hooks: [],
    events: [],
    panel: false,
    shortcuts: [],
  },
  {
    id: "extensions",
    label: "Extensions",
    path: "/extensions",
    match: ["/extensions", "/spaces"],
    icon: Puzzle,
    purpose: "The plugin runtime: capabilities, palettes, panels and the live event log.",
    routes: ["/extensions", "/spaces"],
    entities: [],
    hooks: [],
    events: [],
    panel: false,
    shortcuts: [],
  },
];

export const SPACE_IDS = SPACES.map((space) => space.id);

/** Which tab a route belongs to — the manifest is the only source of that answer. */
export function spaceForPath(pathname = "/") {
  return (
    SPACES.find((space) =>
      space.match.some((rule) => (rule === "/" ? pathname === "/" : pathname === rule || pathname.startsWith(`${rule}/`)))
    ) || null
  );
}

export function spaceById(id) {
  return SPACES.find((space) => space.id === id) || null;
}