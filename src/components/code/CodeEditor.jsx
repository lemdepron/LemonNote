import { useRef } from "react";
import { TOKEN_CLASS, tokenize } from "@/lib/code-languages";

export default function CodeEditor({ value, onChange, language }) {
  const areaRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);

  const syncScroll = () => {
    const area = areaRef.current;
    if (!area) return;
    if (preRef.current) {
      preRef.current.scrollTop = area.scrollTop;
      preRef.current.scrollLeft = area.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop;
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const area = event.currentTarget;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    onChange(`${value.slice(0, start)}  ${value.slice(end)}`);
    requestAnimationFrame(() => {
      area.selectionStart = start + 2;
      area.selectionEnd = start + 2;
    });
  };

  const lines = value.split("\n");

  return (
    <div className="flex h-[58vh] min-h-[340px] overflow-hidden rounded-xl border border-border/70 bg-[hsl(var(--canvas))] font-mono text-[13px] leading-[1.75]">
      <div ref={gutterRef} className="w-11 shrink-0 overflow-hidden border-r border-border/40 py-3 text-right">
        {lines.map((_, index) => (
          <div key={index} className="pr-2 text-[10.5px] leading-[22.75px] text-muted-foreground/40">
            {index + 1}
          </div>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-4 py-3 font-mono text-[13px] leading-[22.75px]"
        >
          {tokenize(value, language).map((token, index) => (
            <span key={index} className={TOKEN_CLASS[token.type]}>
              {token.text}
            </span>
          ))}
          {"\n"}
        </pre>
        <textarea
          ref={areaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          wrap="off"
          spellCheck={false}
          aria-label="Source code"
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-4 py-3 font-mono text-[13px] leading-[22.75px] text-transparent caret-primary outline-none selection:bg-primary/20"
        />
      </div>
    </div>
  );
}