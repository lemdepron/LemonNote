import { TOKEN_CLASS, tokenize } from "@/lib/code-languages";
import HtmlView from "./HtmlView";
import PDFView from "./PDFView";

/** Read-only, syntax-highlighted rendering of a note written in a code format. */
export default function FormatPreview({ value = "", format, linkIndex, onOpenNote, onCreateNote, typography, hasInk, noteTitle }) {
  // Use HtmlView for HTML format
  if (format === "html") {
    return <HtmlView body={value} linkIndex={linkIndex} onOpenNote={onOpenNote} onCreateNote={onCreateNote} typography={typography} hasInk={hasInk} />;
  }

  // Use PDFView for PDF format - value contains the file reference (local:<id>)
  if (format === "pdf") {
    const fileId = String(value || "").replace(/^local:/, "");
    return <PDFView fileId={fileId} noteTitle={noteTitle} typography={typography} />;
  }
  
  return (
    <pre className="overflow-x-auto whitespace-pre rounded-xl border border-border/60 bg-card/25 px-4 py-3 font-mono text-[13px] leading-[1.9]">
      {tokenize(value, format).map((token, index) => (
        <span key={index} className={TOKEN_CLASS[token.type]}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}