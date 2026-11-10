import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { plainText, isNoteLocked } from "./vault";
import { normalizeStyle, PAGE_SIZES, PAGE_ORIENTATIONS, MARGINS, fontStack, LETTER_SPACING, WIDTHS } from "./text-style";
import { db } from "@/api/localDb";

/** Downloads for the export extension: the open note as Markdown, HTML or PDF. */

function checkLocked(note) {
  if (isNoteLocked(note)) {
    throw new Error("Cannot export locked note. Please unlock it first.");
  }
}

const slug = (title = "") =>
  String(title)
    .trim()
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .replace(/\s+/g, "-")
    .toLowerCase() || "note";

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"]/g, (chars) => ({ "&": "&", "<": "<", ">": ">", '"': "\"" })[chars]);

function download(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="wikilink">$1</span>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^#+\s*/, "");
}

/** A deliberately small Markdown reader — enough for a readable standalone page. */
export function markdownToHtml(markdown = "") {
  const lines = String(markdown).split("\n");
  const out = [];
  let code = null;
  let list = null;
  let quote = null;

  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  const closeQuote = () => {
    if (quote) out.push("</blockquote>");
    quote = null;
  };

  lines.forEach((raw) => {
    const line = raw.replace(/\s+$/, "");
    if (/^```/.test(line.trim())) {
      closeList();
      closeQuote();
      if (code) {
        out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = null;
      } else {
        code = [];
      }
      return;
    }
    if (code) {
      code.push(raw);
      return;
    }
    if (!line.trim()) {
      closeList();
      closeQuote();
      return;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      closeQuote();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      return;
    }
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      closeList();
      closeQuote();
      out.push("<hr />");
      return;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      if (!quote) {
        out.push("<blockquote>");
        quote = true;
      }
      out.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
      return;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      closeQuote();
      const kind = bullet ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((bullet || numbered)[1])}</li>`);
      return;
    }
    closeList();
    closeQuote();
    out.push(`<p>${inline(line)}</p>`);
  });

  if (code) out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  closeList();
  closeQuote();
  return out.join("\n");
}

/** Convert markdown to HTML with inline styles for clipboard copy (rich text). */
export function markdownToHtmlWithInlineStyles(markdown = "", style = {}) {
  const s = normalizeStyle(style);
  const fontFamily = fontStack(s.font) || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const fontSize = s.size ? `${s.size}px` : '16px';
  const lineHeight = s.lineHeight || 1.6;
  const letterSpacing = s.spacing ? LETTER_SPACING.find((item) => item.id === s.spacing)?.value || 'normal' : 'normal';
  const textAlign = s.align || 'left';
  const headingFontFamily = fontStack(s.headingFont) || fontFamily;
  
  // Base styles for elements
  const baseStyle = `font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing}; text-align: ${textAlign};`;
  
  function inline(text) {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em style="font-style: italic;">$2</em>')
      .replace(/`([^`]+)`/g, '<code style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px;">$1</code>')
      .replace(/\[\[([^\]]+)\]\]/g, '<span style="color: #0066cc; text-decoration: underline;">$1</span>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" style="color: #0066cc;">$1</a>')
      .replace(/^#+\s*/, "");
  }

  const lines = String(markdown).split("\n");
  const out = [];
  let code = null;
  let list = null;
  let quote = null;

  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  const closeQuote = () => {
    if (quote) out.push("</blockquote>");
    quote = null;
  };

  lines.forEach((raw) => {
    const line = raw.replace(/\s+$/, "");
    if (/^```/.test(line.trim())) {
      closeList();
      closeQuote();
      if (code) {
        out.push(`<pre style="background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto;"><code style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: transparent; padding: 0;">${escapeHtml(code.join("\n"))}</code></pre>`);
        code = null;
      } else {
        code = [];
      }
      return;
    }
    if (code) {
      code.push(raw);
      return;
    }
    if (!line.trim()) {
      closeList();
      closeQuote();
      return;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      closeQuote();
      const level = heading[1].length;
      const headingSizes = { 1: '2.1em', 2: '1.5em', 3: '1.3em', 4: '1.1em', 5: '1em', 6: '0.9em' };
      const headingMargins = { 1: '0 0 0.5em', 2: '1.2em 0 0.4em', 3: '1em 0 0.3em', 4: '0.8em 0 0.2em', 5: '0.6em 0 0.2em', 6: '0.5em 0 0.1em' };
      out.push(`<h${level} style="font-family: ${headingFontFamily}; font-size: ${headingSizes[level]}; margin: ${headingMargins[level]}; font-weight: bold;">${inline(heading[2])}</h${level}>`);
      return;
    }
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      closeList();
      closeQuote();
      out.push('<hr style="border: 0; border-top: 1px solid #d9cdbc; margin: 1.5em 0;" />');
      return;
    }
    if (/^>\s?/.test(line)) {
      closeList();
      if (!quote) {
        out.push('<blockquote style="margin: 1em 0; padding-left: 1em; border-left: 3px solid #ccc; color: #666; font-style: italic;">');
        quote = true;
      }
      out.push(`<p style="margin: 0.5em 0;">${inline(line.replace(/^>\s?/, ""))}</p>`);
      return;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      closeQuote();
      const kind = bullet ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        out.push(`<${kind} style="padding-left: 1.5em; margin: 0.8em 0;">`);
        list = kind;
      }
      out.push(`<li style="margin: 0.3em 0;">${inline((bullet || numbered)[1])}</li>`);
      return;
    }
    closeList();
    closeQuote();
    out.push(`<p style="margin: 0.8em 0;">${inline(line)}</p>`);
  });

  if (code) out.push(`<pre style="background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto;"><code style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: transparent; padding: 0;">${escapeHtml(code.join("\n"))}</code></pre>`);
  closeList();
  closeQuote();
  return out.join("\n");
}

export function exportMarkdown(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  download(`# ${title}\n\n${note?.body || ""}\n`, `${slug(title)}.md`, "text/markdown;charset=utf-8");
}

export function exportHtml(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const body = markdownToHtml(note?.body || "");
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f7f3ec; color: #241d16; font: 16px/1.75 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  h1 { font-size: 2.1rem; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 2rem; }
  h2 { font-size: 1.35rem; margin: 2.2rem 0 0.6rem; }
  h3 { font-size: 1.1rem; margin: 1.8rem 0 0.4rem; }
  p { margin: 0.9rem 0; }
  ul, ol { padding-left: 1.3rem; }
  blockquote { margin: 1.2rem 0; padding-left: 1rem; border-left: 2px solid #b1703a; color: #5a4a3a; font-style: italic; }
  code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 0.86em; background: #efe7db; border-radius: 4px; padding: 0.1em 0.35em; }
  pre { background: #efe7db; border-radius: 10px; padding: 1rem; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  hr { border: 0; border-top: 1px solid #d9cdbc; margin: 2rem 0; }
  .wikilink { color: #146c62; border-bottom: 1px dashed #146c62aa; }
  a { color: #146c62; }
  @media print { body { background: #fff; } main { padding: 0; max-width: none; } }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
${body}
</main>
</body>
</html>
`;
  download(page, `${slug(title)}.html`, "text/html;charset=utf-8");
}

/** Get page dimensions in points (1pt = 1/72 inch) from note style */
function getPageDimensions(style) {
  const s = normalizeStyle(style);
  
  // Get page size
  let pageWidth = 595.28; // A4 width in points (210mm)
  let pageHeight = 841.89; // A4 height in points (297mm)
  
  if (s.pageSize && s.pageSize !== "custom") {
    const size = PAGE_SIZES.find((p) => p.id === s.pageSize);
    if (size) {
      // Convert mm to points (1mm = 2.83465pt)
      pageWidth = size.width * 2.83465;
      pageHeight = size.height * 2.83465;
    }
  } else if (s.pageSize === "custom" && s.pageWidth && s.pageHeight) {
    pageWidth = s.pageWidth * 2.83465;
    pageHeight = s.pageHeight * 2.83465;
  }
  
  // Apply orientation
  if (s.pageOrientation === "landscape") {
    [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  
  // Get margins
  let marginTop = 72; // 1 inch = 72pt default
  let marginRight = 72;
  let marginBottom = 72;
  let marginLeft = 72;
  
  if (s.pageMargins && s.pageMargins !== "custom") {
    const margins = MARGINS.find((m) => m.id === s.pageMargins);
    if (margins) {
      marginTop = margins.top * 2.83465;
      marginRight = margins.right * 2.83465;
      marginBottom = margins.bottom * 2.83465;
      marginLeft = margins.left * 2.83465;
    }
  } else if (s.pageMargins === "custom") {
    if (s.marginTop !== undefined) marginTop = s.marginTop * 2.83465;
    if (s.marginRight !== undefined) marginRight = s.marginRight * 2.83465;
    if (s.marginBottom !== undefined) marginBottom = s.marginBottom * 2.83465;
    if (s.marginLeft !== undefined) marginLeft = s.marginLeft * 2.83465;
  }
  
  return { pageWidth, pageHeight, marginTop, marginRight, marginBottom, marginLeft };
}

export function exportPdf(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const style = note?.style || {};
  
  const { pageWidth, pageHeight, marginTop, marginRight, marginBottom, marginLeft } = getPageDimensions(style);
  
  const doc = new jsPDF({ unit: "pt", format: [pageWidth, pageHeight] });
  const maxWidth = pageWidth - marginLeft - marginRight;
  const maxHeight = pageHeight - marginTop - marginBottom;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  const heading = doc.splitTextToSize(title, maxWidth);
  doc.text(heading, marginLeft, marginTop + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(plainText(note?.body || "") || "(empty note)", maxWidth);
  let y = marginTop + 8 + heading.length * 22 + 16;
  lines.forEach((line) => {
    if (y > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
    doc.text(line, marginLeft, y);
    y += 16;
  });
  
  doc.save(`${slug(title)}.pdf`);
}

/** Export note as plain text (no markdown syntax) */
export function exportPlainText(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const body = plainText(note?.body || "");
  download(`${title}\n\n${body}\n`, `${slug(title)}.txt`, "text/plain;charset=utf-8");
}

/** Copy note as rich text (HTML) to clipboard */
export async function copyAsRichText(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const style = note?.style || {};
  const body = markdownToHtmlWithInlineStyles(note?.body || "", style);
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
</head>
<body>
<h1 style="font-weight: bold; margin-bottom: 0.5em;">${escapeHtml(title)}</h1>
${body}
</body>
</html>`;
  
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([`${title}\n\n${plainText(note?.body || "")}`], { type: "text/plain" }),
      }),
    ]);
    return true;
  } catch (err) {
    // Fallback: copy as plain text if rich text fails
    await navigator.clipboard.writeText(`${title}\n\n${plainText(note?.body || "")}`);
    return false;
  }
}

/** Print the current note */
export function printNote(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const body = markdownToHtml(note?.body || "");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #fff; color: #241d16; font: 16px/1.75 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  h1 { font-size: 2.1rem; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 2rem; }
  h2 { font-size: 1.35rem; margin: 2.2rem 0 0.6rem; }
  h3 { font-size: 1.1rem; margin: 1.8rem 0 0.4rem; }
  p { margin: 0.9rem 0; }
  ul, ol { padding-left: 1.3rem; }
  blockquote { margin: 1.2rem 0; padding-left: 1rem; border-left: 2px solid #b1703a; color: #5a4a3a; font-style: italic; }
  code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 0.86em; background: #efe7db; border-radius: 4px; padding: 0.1em 0.35em; }
  pre { background: #efe7db; border-radius: 10px; padding: 1rem; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  hr { border: 0; border-top: 1px solid #d9cdbc; margin: 2rem 0; }
  .wikilink { color: #146c62; border-bottom: 1px dashed #146c62aa; }
  a { color: #146c62; }
  @media print {
    body { background: #fff; }
    main { padding: 0; max-width: none; }
    @page { margin: 2cm; }
  }
</style>
</head>
<body onload="window.print(); window.onafterprint = () => window.close();">
<main>
<h1>${escapeHtml(title)}</h1>
${body}
</main>
</body>
</html>`);
  printWindow.document.close();
}

/** Create mailto link for emailing the note */
export function createEmailLink(note) {
  checkLocked(note);
  const title = (note?.title || "Untitled note").trim();
  const body = plainText(note?.body || "");
  const fullText = `${title}\n\n${body}`;
  const charCount = fullText.length;
  
  // Warn if body is large (mailto has practical limits ~2000 chars in some clients)
  const warning = charCount > 2000 
    ? " (Note: large notes may be truncated by some email clients)"
    : "";
  
  const subject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(fullText);
  return `mailto:?subject=${subject}&body=${emailBody}${warning}`;
}

/** Export all notes as a zip of .md files */
export async function exportAllNotesAsZip() {
  const zip = new JSZip();
  const notes = await db.entities.Note.list({ limit: 10000 });
  const items = notes?.items ?? [];
  
  if (items.length === 0) {
    return { success: false, message: "No notes to export." };
  }
  
  let exportedCount = 0;
  for (const note of items) {
    if (note.trashed) continue;
    if (isNoteLocked(note)) continue; // Skip locked notes
    exportedCount++;
    const title = (note.title || "Untitled note").trim();
    const body = note.body || "";
    const tags = Array.isArray(note.tags) && note.tags.length > 0 ? `\n\n---\ntags: ${note.tags.join(", ")}` : "";
    const filename = `${slug(title)}.md`;
    const content = `# ${title}\n\n${body}${tags}\n`;
    zip.file(filename, content);
  }
  
  if (exportedCount === 0) {
    return { success: false, message: "No unlocked notes to export." };
  }
  
  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  download(blob, `lemonnote-notes-${date}.zip`, "application/zip");
  
  return { success: true, count: exportedCount };
}