import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { CornerDownLeft, FilePlus2, Link2 } from "lucide-react";
import { commit, registerEditor, syncEditor } from "@/lib/editor-bridge";
import { tableCaretMove, tableOp, tsvToMarkdown } from "@/lib/ribbon-actions";
import { cn } from "@/lib/utils";
import FindBar from "@/components/editor/FindBar";

function optionsFor(suggest, titles) {
  if (!suggest) return [];
  const term = suggest.term.toLowerCase();
  const matches = titles.filter((t) => t.toLowerCase().includes(term)).slice(0, 5);
  const exact = titles.some((t) => t.toLowerCase() === term);
  const rows = matches.map((title) => ({ title, create: false }));
  if (suggest.term && !exact) rows.push({ title: suggest.term, create: true });
  return rows;
}

function countLines(text) {
  if (!text) return 1;
  // Split by newline and count
  return text.split("\n").length;
}

// Maximum height before falling back to inner scrollbar (for performance with very long notes)
// ~20,000 lines at ~26px per line = ~520,000px, cap at 600,000px to handle 20k lines
const MAX_AUTO_HEIGHT = 600000;

export default function MarkdownEditor({ value, onChange, titles = [], onCreateNote, onImageFiles, style, spellCheck = true, hasInk = false, showLineNumbers = false }) {
  const [suggest, setSuggest] = useState(null);
  const [active, setActive] = useState(0);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findMatches, setFindMatches] = useState([]);
  const [findIndex, setFindIndex] = useState(-1);
  const [useInnerScroll, setUseInnerScroll] = useState(false);
  const areaRef = useRef(null);
  const gutterRef = useRef(null);
  const rows = optionsFor(suggest, titles);

  // The ribbon reads the caret through the bridge, so it can edit around it.
  useEffect(() => registerEditor(areaRef.current), []);

  // Auto-height textarea logic
  const updateTextareaHeight = useCallback(() => {
    const node = areaRef.current;
    if (!node) return;

    // Reset height to auto to get the correct scrollHeight
    node.style.height = "auto";
    const scrollHeight = node.scrollHeight;
    
    // Check if we should use inner scrollbar for performance
    const shouldUseInnerScroll = scrollHeight > MAX_AUTO_HEIGHT;
    if (shouldUseInnerScroll !== useInnerScroll) {
      setUseInnerScroll(shouldUseInnerScroll);
    }

    if (!shouldUseInnerScroll) {
      // Set the height to scrollHeight to show all content without inner scrollbar
      node.style.height = `${scrollHeight}px`;
    } else {
      // When using inner scrollbar, cap at MAX_AUTO_HEIGHT and allow scrolling
      node.style.height = `${MAX_AUTO_HEIGHT}px`;
      node.style.overflowY = "auto";
    }
  }, [useInnerScroll]);

  // Update height on value change, window resize, and font/width changes
  useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  // Update height on window resize
  useEffect(() => {
    const handleResize = () => updateTextareaHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateTextareaHeight]);

  // Initial height update when textarea mounts
  useEffect(() => {
    const node = areaRef.current;
    if (node) {
      // Small delay to ensure styles are applied
      requestAnimationFrame(() => {
        updateTextareaHeight();
      });
    }
  }, [updateTextareaHeight]);

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
    // Ctrl+F (or Cmd+F on Mac) opens find bar when editor has focus
    const modKey = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "") ? event.metaKey : event.ctrlKey;
    if (modKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      if (!findOpen) {
        openFind();
      } else {
        findNext();
      }
      return;
    }

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

  // Find in editor logic
  const findMatchesRef = useRef([]);
  const findIndexRef = useRef(-1);

  const performFind = useCallback((query) => {
    if (!query) {
      setFindMatches([]);
      setFindIndex(-1);
      findMatchesRef.current = [];
      findIndexRef.current = -1;
      return;
    }
    const text = value;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
    findMatchesRef.current = matches;
    setFindMatches(matches);
    setFindIndex(matches.length > 0 ? 0 : -1);
    findIndexRef.current = matches.length > 0 ? 0 : -1;
    // Select first match
    if (matches.length > 0 && areaRef.current) {
      const node = areaRef.current;
      node.setSelectionRange(matches[0].start, matches[0].end);
      node.focus({ preventScroll: true });
      // Scroll into view
      const lineHeight = 21.6; // 1.95 * 13.5px ≈ 26.3, but let's use approximate
      const lineStart = text.slice(0, matches[0].start).split("\n").length;
      node.scrollTop = Math.max(0, (lineStart - 3) * 26);
    }
  }, [value]);

  useEffect(() => {
    performFind(findQuery);
  }, [findQuery, performFind]);

  const goToMatch = useCallback((index) => {
    if (index < 0 || index >= findMatchesRef.current.length) return;
    const match = findMatchesRef.current[index];
    setFindIndex(index);
    findIndexRef.current = index;
    if (areaRef.current) {
      const node = areaRef.current;
      node.setSelectionRange(match.start, match.end);
      node.focus({ preventScroll: true });
      const text = value;
      const lineStart = text.slice(0, match.start).split("\n").length;
      node.scrollTop = Math.max(0, (lineStart - 3) * 26);
    }
  }, [value]);

  const findNext = useCallback(() => {
    if (findMatchesRef.current.length === 0) return;
    const next = (findIndexRef.current + 1) % findMatchesRef.current.length;
    goToMatch(next);
  }, [goToMatch]);

  const findPrev = useCallback(() => {
    if (findMatchesRef.current.length === 0) return;
    const prev = (findIndexRef.current - 1 + findMatchesRef.current.length) % findMatchesRef.current.length;
    goToMatch(prev);
  }, [goToMatch]);

  const openFind = useCallback(() => {
    setFindOpen(true);
    // Focus will be auto-focused via FindBar's autoFocus
  }, []);

  const closeFind = useCallback(() => {
    setFindOpen(false);
    setFindQuery("");
  }, []);

  // Sync gutter scroll with textarea scroll
  const handleScroll = useCallback(() => {
    if (gutterRef.current && areaRef.current) {
      gutterRef.current.scrollTop = areaRef.current.scrollTop;
    }
  }, []);

  // Merge passed style with hasInk logic for fixed content width (same as Read view)
  const editorStyle = useMemo(() => {
    const base = style || {};
    if (hasInk && !base.maxWidth) {
      return { ...base, maxWidth: "736px" }; // 46rem = 736px default
    }
    return base;
  }, [style, hasInk]);

  const lineCount = countLines(value);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Min height for empty note click target (about 6 lines)
  const MIN_HEIGHT = "156px"; // 6 * 26px

  return (
    <div className="relative">
      {/* Find bar */}
      <FindBar
        isOpen={findOpen}
        onClose={closeFind}
        query={findQuery}
        onQueryChange={setFindQuery}
        matchCount={findMatches.length}
        currentIndex={findIndex}
        onPrev={findPrev}
        onNext={findNext}
        hasFocus={findOpen}
      />
      {showLineNumbers && (
        <div
          ref={gutterRef}
          className="absolute left-0 top-0 w-12 bg-muted/30 border-r border-border/50 font-mono text-[11px] text-muted-foreground/60 select-none pointer-events-none overflow-hidden"
          style={{ 
            lineHeight: "1.95", 
            paddingTop: "0.3rem",
            minHeight: MIN_HEIGHT,
          }}
          aria-hidden="true"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="text-right pr-2 h-[1.95rem] leading-[1.95]">
              {num}
            </div>
          ))}
        </div>
      )}
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
        onScroll={handleScroll}
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
        style={{ 
          ...editorStyle, 
          paddingLeft: showLineNumbers ? "3rem" : undefined,
          minHeight: MIN_HEIGHT,
          // Auto-height: height is set by updateTextareaHeight, but we set a default
          height: useInnerScroll ? `${MAX_AUTO_HEIGHT}px` : "auto",
          overflowY: useInnerScroll ? "auto" : "hidden",
        }}
        placeholder={"Start writing in markdown…\n\nType [[ to link another note, or #tag to label it."}
        className="w-full resize-none bg-transparent font-mono text-[13.5px] leading-[1.95] text-foreground/90 outline-none placeholder:text-muted-foreground/35"
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