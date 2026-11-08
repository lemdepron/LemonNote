import { boundsOf, distToSegment, simplify } from "@/lib/ink/smoothing";

const TAU = Math.PI * 2;

/**
 * Creates a coordinate graph (axes with tick marks and grid) as a set of stroke paths.
 * The graph is drawn centered at the given position with the specified size.
 * Each line is a separate stroke so it can be selected and erased individually.
 */
export function createCoordinateGraph(centerX, centerY, width = 400, height = 300, gridStep = 50) {
  const halfW = width / 2;
  const halfH = height / 2;
  const left = centerX - halfW;
  const right = centerX + halfW;
  const top = centerY - halfH;
  const bottom = centerY + halfH;
  const strokes = [];

  // X-axis
  strokes.push({
    id: `graph-x-${Date.now()}`,
    kind: "stroke",
    tool: "pen",
    brush: "ballpoint",
    color: "#888888",
    alpha: 0.8,
    width: 1.5,
    points: [
      [left, centerY],
      [right, centerY],
    ],
    pressures: [0.75, 0.75],
    shape: "line",
  });

  // Y-axis
  strokes.push({
    id: `graph-y-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind: "stroke",
    tool: "pen",
    brush: "ballpoint",
    color: "#888888",
    alpha: 0.8,
    width: 1.5,
    points: [
      [centerX, top],
      [centerX, bottom],
    ],
    pressures: [0.75, 0.75],
    shape: "line",
  });

  // Grid lines (vertical)
  for (let x = left + gridStep; x < right; x += gridStep) {
    strokes.push({
      id: `grid-v-${x}-${Date.now()}`,
      kind: "stroke",
      tool: "pen",
      brush: "ballpoint",
      color: "#888888",
      alpha: 0.3,
      width: 0.8,
      points: [
        [x, top],
        [x, bottom],
      ],
      pressures: [0.5, 0.5],
      shape: "line",
    });
  }

  // Grid lines (horizontal)
  for (let y = top + gridStep; y < bottom; y += gridStep) {
    strokes.push({
      id: `grid-h-${y}-${Date.now()}`,
      kind: "stroke",
      tool: "pen",
      brush: "ballpoint",
      color: "#888888",
      alpha: 0.3,
      width: 0.8,
      points: [
        [left, y],
        [right, y],
      ],
      pressures: [0.5, 0.5],
      shape: "line",
    });
  }

  // X-axis tick marks
  for (let x = left; x <= right; x += gridStep) {
    const tickLen = (x === centerX || x === left || x === right) ? 8 : 4;
    strokes.push({
      id: `tick-x-${x}-${Date.now()}`,
      kind: "stroke",
      tool: "pen",
      brush: "ballpoint",
      color: "#888888",
      alpha: 0.6,
      width: 1,
      points: [
        [x, centerY - tickLen / 2],
        [x, centerY + tickLen / 2],
      ],
      pressures: [0.75, 0.75],
      shape: "line",
    });
  }

  // Y-axis tick marks
  for (let y = top; y <= bottom; y += gridStep) {
    const tickLen = (y === centerY || y === top || y === bottom) ? 8 : 4;
    strokes.push({
      id: `tick-y-${y}-${Date.now()}`,
      kind: "stroke",
      tool: "pen",
      brush: "ballpoint",
      color: "#888888",
      alpha: 0.6,
      width: 1,
      points: [
        [centerX - tickLen / 2, y],
        [centerX + tickLen / 2, y],
      ],
      pressures: [0.75, 0.75],
      shape: "line",
    });
  }

  return strokes;
}

function ellipsePath(cx, cy, rx, ry, steps = 72) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index / steps) * TAU;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry, p: 0.75 };
  });
}

function polygonPath(vertices) {
  const path = vertices.map((vertex) => ({ x: vertex.x, y: vertex.y, p: 0.75 }));
  path.push({ ...path[0] });
  return path;
}

function rectPath(box) {
  return polygonPath([
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ]);
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function deviation(values) {
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2))) / (mean || 1);
}

function angleBetween(a, b) {
  const dot = a.x * b.x + a.y * b.y;
  const lengths = (Math.hypot(a.x, a.y) || 1) * (Math.hypot(b.x, b.y) || 1);
  return Math.acos(Math.max(-1, Math.min(1, dot / lengths)));
}

function arrowPaths(points, start, end, diag) {
  const tail = points[Math.max(0, points.length - 4)];
  const shaft = { x: end.x - start.x, y: end.y - start.y };
  const back = { x: tail.x - end.x, y: tail.y - end.y };
  if (angleBetween(shaft, back) < (Math.PI * 2) / 3) return null;
  const size = Math.min(diag * 0.22, Math.hypot(shaft.x, shaft.y) * 0.4);
  const main = Math.atan2(-shaft.y, -shaft.x);
  const head = (offset) => [
    { x: end.x, y: end.y, p: 0.75 },
    { x: end.x + Math.cos(main + offset) * size, y: end.y + Math.sin(main + offset) * size, p: 0.75 },
  ];
  return [
    [{ x: start.x, y: start.y, p: 0.75 }, { x: end.x, y: end.y, p: 0.75 }],
    head(0.5),
    head(-0.5),
  ];
}

/**
 * Turns a freehand stroke into a snapped geometric path when the drawing is
 * recognisably a line, arrow, circle, ellipse, rectangle or polygon.
 */
export function recognizeShape(points) {
  if (!Array.isArray(points) || points.length < 5) return null;
  const box = boundsOf(points);
  if (!box) return null;
  const diag = Math.hypot(box.w, box.h);
  if (diag < 26) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const closed = Math.hypot(end.x - start.x, end.y - start.y) < diag * 0.26;
  const maxDeviation = Math.max(...points.map((point) => distToSegment(point, start, end)));

  if (!closed && maxDeviation < diag * 0.08) {
    const arrow = arrowPaths(points, start, end, diag);
    if (arrow) return { type: "arrow", paths: arrow };
    return {
      type: "line",
      paths: [
        [
          { x: start.x, y: start.y, p: 0.75 },
          { x: end.x, y: end.y, p: 0.75 },
        ],
      ],
    };
  }

  if (!closed) return null;

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const rx = Math.max(4, box.w / 2);
  const ry = Math.max(4, box.h / 2);
  const radial = points.map((point) => Math.hypot((point.x - cx) / rx, (point.y - cy) / ry));
  if (deviation(radial) < 0.17) {
    return {
      type: Math.abs(box.w - box.h) < diag * 0.14 ? "circle" : "ellipse",
      paths: [ellipsePath(cx, cy, rx, ry)],
    };
  }

  const simplified = simplify(points, Math.max(2, diag * 0.03));
  const corners = simplified.filter(
    (point, index, list) => index === 0 || Math.hypot(point.x - list[index - 1].x, point.y - list[index - 1].y) > diag * 0.08
  );
  const vertices = corners.slice(0, -1);

  if (vertices.length === 4) {
    const nearBox = vertices.every((vertex) => {
      const cornerX = vertex.x < cx ? box.x : box.x + box.w;
      const cornerY = vertex.y < cy ? box.y : box.y + box.h;
      return Math.hypot(vertex.x - cornerX, vertex.y - cornerY) < diag * 0.16;
    });
    if (nearBox) return { type: "rect", paths: [rectPath(box)] };
    return { type: "polygon", paths: [polygonPath(vertices)] };
  }
  if (vertices.length === 3) return { type: "triangle", paths: [polygonPath(vertices)] };
  if (vertices.length > 4 && vertices.length <= 8) {
    return { type: "polygon", paths: [polygonPath(vertices)] };
  }
  return null;
}