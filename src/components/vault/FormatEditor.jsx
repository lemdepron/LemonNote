import { useRef } from "react";
import { TOKEN_CLASS, tokenize } from "@/lib/code-languages";
import { autoIndent, indentUnit } from "@/lib/note-formats";

/**
 * Note body editor for non-Markdown formats: a transparent textarea over a
 * highlighted copy of the same text, so the caret, selection and scrolling stay
 * native while the tokens are coloured.
 */
export default function FormatEditor({ value, onChange, format }) {
  const areaRef = useRef(null);
  const preRef = useRef(null);
  const unit = indentUnit(format);

  const syncScroll = () => {
    const area = areaRef.current;
    if (!area) return;
    if (preRef.current) {
      preRef.current.scrollTop = area.scrollTop;
      preRef.current.scrollLeft = area.scrollLeft;
    }
  };

  const setCaret = (caret) => {
    requestAnimationFrame(() => {
      const area = areaRef.current;
      if (!area) return;
      area.selectionStart = caret;
      area.selectionEnd = caret;
    });
  };

  // A closer typed on its own line pulls that line back one level, like a code editor.
  const handleChange = (event) => {
    const next = event.target.value;
    const caret = event.target.selectionStart;
    const lineStart = next.lastIndexOf("\n", caret - 1) + 1;
    const head = next.slice(lineStart, caret);
    const lead = (head.match(/^[ \t]*/) || [""])[0];
    const closer =
      /^[ \t]*[}\])]$/.test(head) ||
      /^[ \t]*<\/>$/.test(head) ||
      (format === "bash" && /^[ \t]*(?:done|fi|esac)$/.test(head));
    if (closer && lead.length) {
      const shortened = lead.startsWith(unit) ? lead.slice(unit.length) : "";
      onChange(`${next.slice(0, lineStart)}${shortened}${head.slice(lead.length)}${next.slice(caret)}`);
      setCaret(caret - (lead.length - shortened.length));
      return;
    }
    onChange(next);
  };

  const handleKeyDown = (event) => {
    const area = event.currentTarget;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (event.key === "Tab") {
      event.preventDefault();
      if (!event.shiftKey) {
        onChange(`${before}${unit}${after}`);
        setCaret(start + unit.length);
        return;
      }
      const lineStart = before.lastIndexOf("\n") + 1;
      const line = value.slice(lineStart);
      if (!line.startsWith(unit) && !line.startsWith("\t") && !line.startsWith(" ")) return;
      const removed = line.startsWith(unit) ? unit.length : 1;
      onChange(`${value.slice(0, lineStart)}${value.slice(lineStart + removed)}`);
      setCaret(Math.max(lineStart, start - removed));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const insert = `\n${autoIndent(format, before, after)}`;
      onChange(`${before}${insert}${after}`);
      setCaret(start + insert.length);
    }
  };

  return (
    <div className="relative">
      <pre
        ref={preRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre font-mono text-[13.5px] leading-[1.95]"
      >
        {tokenize(value, format).map((token, index) => (
          <span key={index} className={TOKEN_CLASS[token.type]}>
            {token.text}
          </span>
        ))}
        {"\n"}
      </pre>
      <textarea
        ref={areaRef}
        id="nb-editor"
        value={value}
        onChange={handleChange}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        wrap="off"
        spellCheck={false}
        aria-label={`${format} note body`}
        placeholder="Start writing…"
        className="relative block min-h-[46vh] w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-0 font-mono text-[13.5px] leading-[1.95] text-transparent caret-primary outline-none selection:bg-primary/25 placeholder:text-muted-foreground/35"
      />
    </div>
  );
}