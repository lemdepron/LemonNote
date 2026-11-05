import { paintElement } from "@/lib/ink/brushes";
import { drawPaper } from "@/lib/ink/paper";

/**
 * Offscreen render of a world-space region. Always rendered on light paper so
 * handwriting recognition and exports stay legible.
 */
export function renderRegion({ strokes, paper, region, scale = 2, light = true }) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(region.w * scale));
  canvas.height = Math.max(1, Math.round(region.h * scale));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, -region.x * scale, -region.y * scale);
  drawPaper(ctx, {
    paper: light ? { ...paper, tone: "light" } : paper,
    view: {
      left: region.x,
      top: region.y,
      right: region.x + region.w,
      bottom: region.y + region.h,
      scale,
    },
  });
  strokes.forEach((stroke) => paintElement(ctx, stroke, { light: true }));
  return canvas;
}

export function samplePixel(canvas, cssX, cssY, dpr) {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(Math.round(cssX * dpr), Math.round(cssY * dpr), 1, 1).data;
    if (!data[3]) return null;
    const hex = `#${[data[0], data[1], data[2]]
      .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
      .join("")}`;
    return { hex, alpha: data[3] / 255 };
  } catch {
    return null;
  }
}