import { extractWikiLinks, titleKey } from "@/lib/vault";

export function buildGraph(notes = []) {
  const index = new Map(notes.filter((note) => note?.title).map((note) => [titleKey(note.title), note]));
  const nodes = notes.map((note, i) => ({
    id: note.id,
    note,
    title: note.title || "Untitled",
    x: Math.cos((i / Math.max(1, notes.length)) * Math.PI * 2) * 180,
    y: Math.sin((i / Math.max(1, notes.length)) * Math.PI * 2) * 150,
    vx: 0,
    vy: 0,
    degree: 0,
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set();
  const edges = [];

  notes.forEach((note) => {
    extractWikiLinks(note.body || "").forEach((title) => {
      const target = index.get(titleKey(title));
      if (!target || target.id === note.id) return;
      const key = [note.id, target.id].sort().join(":");
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ id: key, a: note.id, b: target.id });
      const from = byId.get(note.id);
      const to = byId.get(target.id);
      if (from) from.degree += 1;
      if (to) to.degree += 1;
    });
  });

  return { nodes, edges, byId };
}

export function tick(nodes, edges, byId, width, height) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < nodes.length; i += 1) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j += 1) {
      const b = nodes[j];
      const dx = b.x - a.x || 0.4;
      const dy = b.y - a.y || 0.4;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2) || 1;
      const push = Math.min(14, 9000 / d2);
      const ux = dx / d;
      const uy = dy / d;
      a.vx -= ux * push;
      a.vy -= uy * push;
      b.vx += ux * push;
      b.vy += uy * push;
    }
    a.vx += (cx - a.x) * 0.0018;
    a.vy += (cy - a.y) * 0.0018;
  }

  edges.forEach((edge) => {
    const a = byId.get(edge.a);
    const b = byId.get(edge.b);
    if (!a || !b) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const pull = (d - 165) * 0.011;
    const ux = dx / d;
    const uy = dy / d;
    a.vx += ux * pull;
    a.vy += uy * pull;
    b.vx -= ux * pull;
    b.vy -= uy * pull;
  });

  nodes.forEach((node) => {
    node.vx *= 0.86;
    node.vy *= 0.86;
    node.x = Math.max(30, Math.min(width - 30, node.x + node.vx));
    node.y = Math.max(30, Math.min(height - 30, node.y + node.vy));
  });
}