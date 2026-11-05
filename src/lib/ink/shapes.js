import { boundsOf, distToSegment, simplify } from "@/lib/ink/smoothing";

const TAU = Math.PI * 2;

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