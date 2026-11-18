/**
 * Geometry helpers for the ink engine: Catmull-Rom spline resampling (so strokes
 * stay smooth however fast the pointer moves), polyline measurement, polygon
 * hit-testing and precise vector stroke splitting for the precision eraser.
 */

const EPSILON = 0.0001;

export function toPoints(stroke) {
  const raw = Array.isArray(stroke?.points) ? stroke.points : [];
  return raw.map((point, index) => ({
    x: Number(point?.[0]) || 0,
    y: Number(point?.[1]) || 0,
    p: Number(stroke?.pressures?.[index] ?? point?.[2] ?? 0.65),
  }));
}

export function fromPoints(points) {
  return {
    points: points.map((point) => [Number(point.x.toFixed(2)), Number(point.y.toFixed(2))]),
    pressures: points.map((point) => Number((point.p ?? 0.65).toFixed(3))),
  };
}

function catmullAt(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/**
 * Catmull-Rom spline through every sample, resampled at a constant world-space
 * step so ribbon brushes get even geometry regardless of input rate.
 */
export function spline(points, step = 2.5) {
  if (!points.length) return [];
  if (points.length === 1) return [{ ...points[0] }];
  const out = [{ ...points[0] }];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(2, Math.ceil(distance / Math.max(0.5, step)));
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      out.push({
        x: catmullAt(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullAt(p0.y, p1.y, p2.y, p3.y, t),
        p: p1.p + (p2.p - p1.p) * t,
      });
    }
  }
  return out;
}

/** Draws the smooth centreline for pen-like brushes. */
export function traceSpline(ctx, points) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 1) {
    ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01);
    return;
  }
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

export function distToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < EPSILON) return Math.hypot(point.x - a.x, point.y - a.y);
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

export function distToPolyline(point, points) {
  if (!points.length) return Infinity;
  if (points.length === 1) return Math.hypot(point.x - points[0].x, point.y - points[0].y);
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i += 1) {
    best = Math.min(best, distToSegment(point, points[i], points[i + 1]));
    if (best < 0.5) break;
  }
  return best;
}

export function distToStroke(point, stroke) {
  if (stroke?.kind === "text") {
    const box = strokeBounds(stroke);
    if (!box) return Infinity;
    const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.w));
    const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.h));
    return Math.hypot(dx, dy);
  }
  return distToPolyline(point, toPoints(stroke));
}

export function pointInPolygon(point, polygon) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function boundsOf(points) {
  if (!points?.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function strokeBounds(stroke) {
  if (stroke?.kind === "text") {
    const size = stroke.fontSize || 22;
    const lines = String(stroke.text || "").split("\n");
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
    return {
      x: stroke.x || 0,
      y: stroke.y || 0,
      w: longest * size * 0.56,
      h: lines.length * size * 1.35,
    };
  }
  const box = boundsOf(toPoints(stroke));
  if (!box) return null;
  const pad = (stroke?.width || 3) * 2;
  return { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 };
}

export function unionBounds(strokes) {
  const boxes = strokes.map(strokeBounds).filter(Boolean);
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Douglas-Peucker, used before shape recognition so jitter doesn't fake corners. */
export function simplify(points, tolerance = 2.4) {
  if (points.length <= 2) return points.slice();
  const first = points[0];
  const last = points[points.length - 1];
  let index = -1;
  let maxDist = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distToSegment(points[i], first, last);
    if (distance > maxDist) {
      maxDist = distance;
      index = i;
    }
  }
  if (maxDist > tolerance && index > 0) {
    const left = simplify(points.slice(0, index + 1), tolerance);
    const right = simplify(points.slice(index), tolerance);
    return left.concat(right.slice(1));
  }
  return [first, last];
}

/**
 * Douglas-Peucker on raw [x, y] samples. Keeps the pressure list aligned so a
 * stored stroke keeps its taper while holding far fewer points.
 */
export function simplifyStroke(points, pressures = [], tolerance = 0.5) {
  if (!Array.isArray(points) || points.length <= 2) {
    return { points: points || [], pressures: pressures || [] };
  }
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const limit = tolerance * tolerance;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const ax = points[first][0];
    const ay = points[first][1];
    const dx = points[last][0] - ax;
    const dy = points[last][1] - ay;
    const length = dx * dx + dy * dy;
    let best = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const px = points[i][0];
      const py = points[i][1];
      let ex = ax;
      let ey = ay;
      if (length > 0) {
        let t = ((px - ax) * dx + (py - ay) * dy) / length;
        t = t > 1 ? 1 : t < 0 ? 0 : t;
        ex = ax + dx * t;
        ey = ay + dy * t;
      }
      const distance = (px - ex) * (px - ex) + (py - ey) * (py - ey);
      if (distance > best) {
        best = distance;
        index = i;
      }
    }
    if (index > 0 && best > limit) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return {
    points: points.filter((_, i) => keep[i]),
    pressures: pressures?.length === points.length ? pressures.filter((_, i) => keep[i]) : pressures || [],
  };
}

/**
 * Precision eraser: removes the points inside the eraser radius and returns the
 * surviving vector fragments, so a stroke can be cut in the middle.
 */
export function splitStroke(stroke, center, radius) {
  const points = toPoints(stroke);
  if (!points.length) return [stroke];
  if (points.length === 1) {
    return Math.hypot(points[0].x - center.x, points[0].y - center.y) <= radius ? [] : [stroke];
  }
  const dense = spline(points, 3);
  const runs = [];
  let current = null;
  dense.forEach((point) => {
    const inside = Math.hypot(point.x - center.x, point.y - center.y) <= radius;
    if (inside) {
      current = null;
      return;
    }
    if (!current) {
      current = [];
      runs.push(current);
    }
    current.push(point);
  });
  const survivors = runs.filter((run) => run.length > 1);
  if (survivors.length === 1 && survivors[0].length === dense.length) return [stroke];
  return survivors.map((run, index) => ({
    ...stroke,
    ...fromPoints(run),
    id: `${stroke.id || "s"}-cut${index}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}