import { parseColor, shade, toCss } from "@/lib/ink/color";
import { tokenColor } from "@/lib/theme";
import { spline, toPoints, traceSpline } from "@/lib/ink/smoothing";

export const BRUSHES = [
  { id: "fountain", label: "Fountain pen", hint: "pressure taper" },
  { id: "ballpoint", label: "Ballpoint", hint: "even and smooth" },
  { id: "calligraphy", label: "Calligraphy", hint: "angled nib" },
  { id: "marker", label: "Highlighter", hint: "multiply ink" },
  { id: "watercolor", label: "Watercolor", hint: "wet edges" },
  { id: "pencil", label: "Pencil", hint: "grain and tilt" },
];

export function resolveBrush(stroke) {
  if (stroke?.brush && BRUSHES.some((brush) => brush.id === stroke.brush)) return stroke.brush;
  if (stroke?.tool === "highlighter" || stroke?.tool === "marker") return "marker";
  return "ballpoint";
}

export function brushLabel(id) {
  return BRUSHES.find((brush) => brush.id === id)?.label || "Ballpoint";
}

const grainCache = new Map();

function grainPattern(ctx, color) {
  let tile = grainCache.get(color);
  if (!tile) {
    tile = document.createElement("canvas");
    tile.width = 64;
    tile.height = 64;
    const g = tile.getContext("2d");
    g.fillStyle = color;
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 560; i += 1) {
      g.globalAlpha = 0.2 + Math.random() * 0.6;
      g.beginPath();
      g.arc(Math.random() * 64, Math.random() * 64, 0.2 + Math.random() * 1.5, 0, Math.PI * 2);
      g.fill();
    }
    grainCache.set(color, tile);
    if (grainCache.size > 20) grainCache.delete(grainCache.keys().next().value);
  }
  return ctx.createPattern(tile, "repeat");
}

/**
 * Builds a variable-width ribbon polygon around the smoothed centreline — this is
 * what gives the fountain and calligraphy brushes their pressure/angle response.
 */
function ribbonFill(ctx, samples, widthAt, style, alpha, caps = true) {
  if (!samples.length) return;
  if (samples.length === 1) {
    const radius = Math.max(0.4, widthAt(samples[0], 0) / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(samples[0].x, samples[0].y, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const left = [];
  const right = [];
  for (let i = 0; i < samples.length; i += 1) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const half = Math.max(0.3, widthAt(samples[i], i) / 2);
    left.push([samples[i].x - dy * half, samples[i].y + dx * half]);
    right.push([samples[i].x + dy * half, samples[i].y - dx * half]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i += 1) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i -= 1) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = style;
  ctx.fill();
  if (!caps) return;
  ctx.beginPath();
  ctx.arc(samples[0].x, samples[0].y, Math.max(0.3, widthAt(samples[0], 0) / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  const end = samples.length - 1;
  ctx.arc(samples[end].x, samples[end].y, Math.max(0.3, widthAt(samples[end], end) / 2), 0, Math.PI * 2);
  ctx.fill();
}

export function paintStroke(ctx, stroke, { light = false } = {}) {
  const points = toPoints(stroke);
  if (!points.length) return;
  const brush = resolveBrush(stroke);
  const color = stroke.color || tokenColor("--ink-light") || "#e9e2d0";
  const alpha = stroke.alpha ?? 1;
  const width = Math.max(0.6, stroke.width || 3);
  const tilt = Math.max(0, Math.min(1, stroke.tilt || 0));

  ctx.save();
  ctx.lineJoin = "round";

  if (brush === "fountain") {
    ctx.lineCap = "round";
    const samples = spline(points, 2);
    ribbonFill(
      ctx,
      samples,
      (sample) => width * (0.32 + 0.95 * Math.min(1, Math.max(0.05, sample.p))),
      color,
      alpha
    );
  } else if (brush === "calligraphy") {
    ctx.lineCap = "butt";
    const nib = Number(stroke.nibAngle ?? -0.55);
    const samples = spline(points, 2);
    ribbonFill(
      ctx,
      samples,
      (sample, index) => {
        const prev = samples[Math.max(0, index - 1)];
        const next = samples[Math.min(samples.length - 1, index + 1)];
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        return width * (0.16 + 0.92 * Math.abs(Math.sin(angle - nib)));
      },
      color,
      alpha
    );
  } else if (brush === "marker") {
    ctx.lineCap = "butt";
    ctx.globalCompositeOperation = light ? "multiply" : "screen";
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 3.4;
    ctx.globalAlpha = alpha * 0.34;
    traceSpline(ctx, spline(points, 3));
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.18;
    ctx.lineWidth = width * 1.9;
    ctx.stroke();
  } else if (brush === "watercolor") {
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = light ? "multiply" : "source-over";
    const samples = spline(points, 3);
    for (let pass = 0; pass < 3; pass += 1) {
      const angle = pass * 2.1;
      ctx.save();
      ctx.translate(Math.cos(angle) * width * 0.32, Math.sin(angle) * width * 0.32);
      ribbonFill(
        ctx,
        samples,
        () => width * (1.35 + pass * 0.5),
        color,
        alpha * (pass === 0 ? 0.2 : 0.13)
      );
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = toCss(shade(color, light ? -0.24 : 0.28), 1);
    ctx.lineWidth = Math.max(0.7, width * 0.2);
    ctx.globalAlpha = alpha * 0.45;
    traceSpline(ctx, samples);
    ctx.stroke();
  } else if (brush === "pencil") {
    ctx.lineCap = "round";
    const samples = spline(points, 2.5);
    const pattern = grainPattern(ctx, color);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.32;
    ctx.lineWidth = width * (0.75 + tilt * 0.45);
    traceSpline(ctx, samples);
    ctx.stroke();
    ribbonFill(
      ctx,
      samples,
      (sample) => width * (0.5 + 0.8 * sample.p) * (1 + tilt * 0.5),
      pattern || color,
      alpha * 0.92
    );
  } else {
    ctx.lineCap = "round";
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    traceSpline(ctx, spline(points, 2));
    ctx.stroke();
  }

  ctx.restore();
}

export function paintText(ctx, element) {
  const size = element.fontSize || 22;
  ctx.save();
  ctx.globalAlpha = element.alpha ?? 1;
  ctx.fillStyle = element.color || tokenColor("--ink-light") || "#e9e2d0";
  ctx.font = `500 ${size}px "Inter", ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = "top";
  String(element.text || "")
    .split("\n")
    .forEach((line, index) => {
      ctx.fillText(line, element.x || 0, (element.y || 0) + index * size * 1.32);
    });
  ctx.restore();
}

export function paintElement(ctx, element, opts) {
  if (!element) return;
  if (element.kind === "text") paintText(ctx, element);
  else paintStroke(ctx, element, opts);
}

/** Ink coverage colour for the swatch preview in the brush picker. */
export function brushPreviewStyle(brush, color) {
  const base = parseColor(color);
  if (brush === "marker") return { color: toCss(base, 0.35), height: 10 };
  if (brush === "watercolor") return { color: toCss(base, 0.5), height: 12 };
  if (brush === "pencil") return { color: toCss(base, 0.7), height: 4 };
  if (brush === "calligraphy") return { color: toCss(base, 1), height: 6 };
  return { color: toCss(base, 1), height: brush === "fountain" ? 5 : 4 };
}