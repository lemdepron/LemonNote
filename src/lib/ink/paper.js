export const PAGE_SIZES = {
  infinite: null,
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
};

export const PAPER_TEMPLATES = [
  { id: "blank", label: "Blank" },
  { id: "ruled", label: "Ruled" },
  { id: "grid", label: "Grid" },
  { id: "dots", label: "Dotted" },
  { id: "stave", label: "Stave" },
  { id: "iso", label: "Isometric" },
];

export const PAPER_TONES = [
  { id: "dark", label: "Slate" },
  { id: "light", label: "Paper" },
];

export const PAPER_SIZES = [
  { id: "infinite", label: "Infinite" },
  { id: "a4", label: "A4" },
  { id: "letter", label: "Letter" },
];

import { tokenColor } from "@/lib/theme";

const TONES = {
  dark: {
    pageToken: "--paper-page-slate",
    page: "#12161c",
    outside: "#090c10",
    line: "rgba(255,255,255,0.065)",
    strong: "rgba(255,255,255,0.13)",
    accent: "rgba(229,181,103,0.35)",
    label: "rgba(255,255,255,0.24)",
    border: "rgba(255,255,255,0.09)",
  },
  light: {
    pageToken: "--paper-page-paper",
    page: "#f7f2e7",
    outside: "#090c10",
    line: "rgba(28,36,54,0.10)",
    strong: "rgba(28,36,54,0.18)",
    accent: "rgba(178,88,66,0.4)",
    label: "rgba(28,36,54,0.34)",
    border: "rgba(28,36,54,0.12)",
  },
};

const GAP = 34;

/** Paper stock and canvas surround both resolve from theme tokens at paint time. */
export function toneOf(paper) {
  const tone = TONES[paper?.tone === "light" ? "light" : "dark"];
  return {
    ...tone,
    page: tokenColor(tone.pageToken) || tone.page,
    outside: tokenColor("--paper-outside") || tone.outside,
  };
}

export function pageStep(paper) {
  const size = PAGE_SIZES[paper?.size] ?? null;
  if (!size) return null;
  return { stepX: size.w + GAP, stepY: size.h + GAP, size };
}

export function pageOrigin(index, paper) {
  const step = pageStep(paper);
  if (!step) return { x: 0, y: 0 };
  const columns = Math.max(1, Math.round(step.stepY > 0 ? 1 : 1));
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { x: column * step.stepX, y: row * step.stepY };
}

export function pageIndexAt(point, paper) {
  const step = pageStep(paper);
  if (!step) return 0;
  const column = Math.max(0, Math.floor(point.x / step.stepX));
  const row = Math.max(0, Math.floor(point.y / step.stepY));
  return row + column;
}

function drawTemplate(ctx, rect, template, tone, scale) {
  if (template === "blank" || !rect.w || !rect.h) return;
  const dense = scale >= 0.32;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.strokeStyle = tone.line;
  ctx.lineWidth = 1 / Math.max(0.2, scale);

  if (template === "ruled") {
    const spacing = 34;
    const first = rect.y + 60;
    if (dense) {
      ctx.beginPath();
      for (let y = first; y < rect.y + rect.h; y += spacing) {
        ctx.moveTo(rect.x + 16, y);
        ctx.lineTo(rect.x + rect.w - 16, y);
      }
      ctx.stroke();
      ctx.strokeStyle = tone.accent;
      ctx.beginPath();
      ctx.moveTo(rect.x + 62, rect.y + 24);
      ctx.lineTo(rect.x + 62, rect.y + rect.h - 24);
      ctx.stroke();
    }
  } else if (template === "grid") {
    const spacing = 26;
    if (dense) {
      ctx.beginPath();
      for (let x = rect.x; x <= rect.x + rect.w; x += spacing) {
        ctx.moveTo(x, rect.y);
        ctx.lineTo(x, rect.y + rect.h);
      }
      for (let y = rect.y; y <= rect.y + rect.h; y += spacing) {
        ctx.moveTo(rect.x, y);
        ctx.lineTo(rect.x + rect.w, y);
      }
      ctx.stroke();
    }
  } else if (template === "dots") {
    const spacing = 28;
    if (dense) {
      ctx.fillStyle = tone.strong;
      for (let x = rect.x + 14; x < rect.x + rect.w; x += spacing) {
        for (let y = rect.y + 14; y < rect.y + rect.h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (template === "stave") {
    const lineGap = 11;
    const groupGap = 92;
    if (dense) {
      ctx.beginPath();
      for (let group = rect.y + 70; group < rect.y + rect.h - 40; group += groupGap) {
        for (let line = 0; line < 5; line += 1) {
          const y = group + line * lineGap;
          ctx.moveTo(rect.x + 30, y);
          ctx.lineTo(rect.x + rect.w - 30, y);
        }
      }
      ctx.stroke();
    }
  } else if (template === "iso") {
    const spacing = 32;
    if (dense) {
      ctx.beginPath();
      const span = rect.w + rect.h;
      for (let offset = -span; offset < span; offset += spacing) {
        ctx.moveTo(rect.x + offset, rect.y);
        ctx.lineTo(rect.x + offset + rect.h, rect.y + rect.h);
        ctx.moveTo(rect.x + offset, rect.y + rect.h);
        ctx.lineTo(rect.x + offset + rect.h, rect.y);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Paints the paper system across the visible world rect: an infinite sheet or a
 * tiled grid of A4 / Letter pages with the chosen template.
 */
export function drawPaper(ctx, { paper, view }) {
  const tone = toneOf(paper);
  ctx.save();
  ctx.fillStyle = tone.outside;
  ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);

  const step = pageStep(paper);
  const template = paper?.template || "blank";

  if (!step) {
    ctx.fillStyle = tone.page;
    ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
    drawTemplate(ctx, { x: view.left, y: view.top, w: view.right - view.left, h: view.bottom - view.top }, template, tone, view.scale);
    ctx.restore();
    return;
  }

  const { size } = step;
  const firstColumn = Math.floor((view.left - GAP) / step.stepX) - 1;
  const lastColumn = Math.ceil((view.right + GAP) / step.stepX);
  const firstRow = Math.floor((view.top - GAP) / step.stepY) - 1;
  const lastRow = Math.ceil((view.bottom + GAP) / step.stepY);
  const total = (lastColumn - firstColumn + 1) * (lastRow - firstRow + 1);
  if (total > 260) {
    ctx.restore();
    return;
  }

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const rect = {
        x: column * step.stepX,
        y: row * step.stepY,
        w: size.w,
        h: size.h,
      };
      ctx.fillStyle = tone.page;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
      else ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.fill();
      ctx.strokeStyle = tone.border;
      ctx.lineWidth = 1 / Math.max(0.2, view.scale);
      ctx.stroke();
      drawTemplate(ctx, rect, template, tone, view.scale);
      if (view.scale > 0.45) {
        ctx.fillStyle = tone.label;
        ctx.font = `500 11px "Inter", ui-sans-serif, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${row + 1}`, rect.x + rect.w / 2, rect.y + rect.h - 16);
      }
    }
  }
  ctx.restore();
}