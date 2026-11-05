import { useMemo } from "react";
import { cn } from "@/lib/utils";

export default function NoteOutlinePanel({ note }) {
  const body = note?.body || "";

  const headings = useMemo(() => {
    const found = [];
    const re = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = re.exec(body)) !== null) {
      found.push({ level: match[1].length, text: match[2].trim(), index: match.index });
    }
    return found.slice(0, 40);
  }, [body]);

  const jumpTo = (index) => {
    const node = document.getElementById("nb-editor");
    if (!node) return;
    node.focus();
    node.setSelectionRange(index, index);
    if (body.length) {
      const ratio = index / body.length;
      node.scrollTop = Math.max(0, ratio * node.scrollHeight - node.clientHeight / 3);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3">
      <p className="nb-label">outline</p>
      {headings.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground">No headings yet.</p>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {headings.map((heading, index) => (
            <li key={`${heading.index}-${index}`}>
              <button
                type="button"
                onClick={() => jumpTo(heading.index)}
                className={cn(
                  "block w-full truncate rounded px-1 py-0.5 text-left text-[12px] text-muted-foreground transition hover:bg-accent/60 hover:text-foreground",
                  heading.level === 1 && "text-[12.5px] text-foreground/85",
                  heading.level === 2 && "pl-2",
                  heading.level === 3 && "pl-3.5",
                  heading.level >= 4 && "pl-5"
                )}
                title={heading.text}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}