import { jsPDF } from "jspdf";
import { plainText } from "./vault";

/** Downloads for the export extension: the open note as Markdown, HTML or PDF. */

const slug = (title = "") =>
  String(title)
    .trim()
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .replace(/\s+/g, "-")
    .toLowerCase() || "note";

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"]/g, (chars) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[chars]);

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

export function exportMarkdown(note) {
  const title = (note?.title || "Untitled note").trim();
  download(`# ${title}\n\n${note?.body || ""}\n`, `${slug(title)}.md`, "text/markdown;charset=utf-8");
}

export function exportHtml(note) {
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

export function exportPdf(note) {
  const title = (note?.title || "Untitled note").trim();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = width - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  const heading = doc.splitTextToSize(title, maxWidth);
  doc.text(heading, margin, margin + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(plainText(note?.body || "") || "(empty note)", maxWidth);
  let y = margin + 8 + heading.length * 22 + 16;
  lines.forEach((line) => {
    if (y > height - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 16;
  });

  doc.save(`${slug(title)}.pdf`);
}