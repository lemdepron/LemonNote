import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, FilePlus2, Link2 } from "lucide-react";
import { commit, registerEditor, syncEditor } from "@/lib/editor-bridge";
import { tableCaretMove, tableOp, tsvToMarkdown } from "@/lib/ribbon-actions";
import { cn } from "@/lib/utils";

function optionsFor(suggest, titles) {
  if (!suggest) return [];
  const term = suggest.term.toLowerCase();
  const matches = titles.filter((t) => t.toLowerCase().includes(term)).slice(0, 5);
  const exact = titles.some((t) => t.toLowerCase() === term);
  const rows = matches.map((title) => ({ title, create: false }));
  if (suggest.term && !exact) rows.push({ title: suggest.term, create: true });
  return rows;
}

export default function MarkdownEditor({ value, onChange, titles = [], onCreateNote, onImageFiles, style, spellCheck = true }) {
  const [suggest, setSuggest] = useState(null);
  const [active, setActive] = useState(0);
  const areaRef = useRef(null);
  const rows = optionsFor(suggest, titles);

  // The ribbon reads the caret through the bridge, so it can edit around it.
  useEffect(() => registerEditor(areaRef.current), []);

  const detect = (text, caret) => {
    const before = text.slice(0, caret);
    const open = before.lastIndexOf("[[");
    if (open === -1) return setSuggest(null);
    const fragment = before.slice(open + 2);
    if (!fragment) {
      setActive(0);
      return setSuggest({ open, caret, term: "" });
    }
    if (fragment.includes("]]") || fragment.includes("\n") || fragment.includes("[")) return setSuggest(null);
    setActive(0);
    setSuggest({ open, caret, term: fragment.trim() });
  };

  const insert = (title) => {
    if (!suggest) return;
    const next = `${value.slice(0, suggest.open)}[[${title}]]${value.slice(suggest.caret)}`;
    const caret = suggest.open + title.length + 4;
    onChange(next);
    setSuggest(null);
    requestAnimationFrame(() => {
      const node = areaRef.current;
      node?.focus();
      node?.setSelectionRange(caret, caret);
      syncEditor();
    });
  };

  // Images dropped or pasted into the editor go through the same upload as the ribbon.
  const pickImages = (list) => {
    const files = Array.from(list || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return false;
    onImageFiles?.(files);
    return true;
  };

  const onKeyDown = (event) => {
    if (rows.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % rows.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i - 1 + rows.length) % rows.length);
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const row = rows[active] || rows[0];
        if (row.create) onCreateNote?.(row.title);
        insert(row.title);
      } else if (event.key === "Escape") {
        setSuggest(null);
      }
      return;
    }

    // Tab walks the cells of the table under the caret; the last cell adds a row.
    if (event.key !== "Tab") return;
    const node = event.currentTarget;
    const selection = { value: node.value, start: node.selectionStart, end: node.selectionEnd };
    const move = tableCaretMove(selection, event.shiftKey ? -1 : 1);
    if (move === "add-row") {
      const result = tableOp(selection, "row-below");
      if (!result) return;
      event.preventDefault();
      commit(result, onChange);
      return;
    }
    if (!move) return;
    event.preventDefault();
    node.setSelectionRange(move.at, move.at);
    syncEditor();
  };

  return (
    <div className="relative">
      <textarea
        id="nb-editor"
        ref={areaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          detect(event.target.value, event.target.selectionStart);
          syncEditor();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={syncEditor}
        onSelect={syncEditor}
        onFocus={syncEditor}
        onClick={(event) => {
          syncEditor();
          detect(value, event.target.selectionStart);
        }}
        onPaste={(event) => {
          if (pickImages(event.clipboardData?.files)) {
            event.preventDefault();
            return;
          }
          // A block copied from Excel or Google Sheets becomes a markdown table.
          const text = event.clipboardData?.getData("text/plain") || "";
          if (!text.includes("\t")) return;
          const table = tsvToMarkdown(text);
          if (!table) return;
          event.preventDefault();
          const node = event.currentTarget;
          const start = node.selectionStart;
          const end = node.selectionEnd;
          commit(
            {
              start,
              end,
              text: table,
              caret: start + table.length,
              next: `${node.value.slice(0, start)}${table}${node.value.slice(end)}`,
            },
            onChange
          );
        }}
        onDragOver={(event) => {
          if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
        }}
        onDrop={(event) => {
          if (pickImages(event.dataTransfer?.files)) event.preventDefault();
        }}
        onBlur={() => {
          syncEditor();
          setTimeout(() => setSuggest(null), 150);
        }}
        spellCheck={spellCheck}
        style={style}
        placeholder={"Start writing in markdown…\n\nType [[ to link another note, or #tag to label it."}
        className="min-h-[46vh] w-full resize-none bg-transparent font-mono text-[13.5px] leading-[1.95] text-foreground/90 outline-none placeholder:text-muted-foreground/35"
      />

      {suggest && rows.length > 0 && (
        <div className="absolute bottom-2 left-0 z-30 w-[min(440px,100%)] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl shadow-[hsl(var(--shadow)/0.4)]">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <span className="nb-label">link a note</span>
            <span className="font-mono text-[10px] text-muted-foreground">[[ ]]</span>
          </div>
          <ul>
            {rows.map((row, index) => (
              <li key={`${row.title}-${index}`}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (row.create) onCreateNote?.(row.title);
                    insert(row.title);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] transition",
                    index === active ? "bg-accent text-foreground" : "text-foreground/80 hover:bg-accent/60"
                  )}
                >
                  {row.create ? (
                    <FilePlus2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{row.create ? `Create “${row.title}”` : row.title}</span>
                  {row.create && <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">new</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 border-t border-border/70 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
            <CornerDownLeft className="h-3 w-3" /> select · esc dismiss
          </div>
        </div>
      )}
    </div>
  );
}