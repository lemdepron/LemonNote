import ReactMarkdown from "react-markdown";
import { NOTE_LINK_PREFIX, preprocessMarkdown, titleKey } from "@/lib/vault";

export default function MarkdownView({ body = "", linkIndex, onOpenNote, onCreateNote }) {
  return (
    <div className="nb-prose">
      <ReactMarkdown
        components={{
          a({ href, children }) {
            if (typeof href === "string" && href.startsWith(NOTE_LINK_PREFIX)) {
              const title = decodeURIComponent(href.slice(NOTE_LINK_PREFIX.length));
              const target = linkIndex?.get(titleKey(title));
              return (
                <a
                  href={target ? `/note/${target.id}` : "#"}
                  className={target ? "nb-wikilink" : "nb-wikilink nb-wikilink-missing"}
                  onClick={(event) => {
                    event.preventDefault();
                    if (target) onOpenNote?.(target.id);
                    else onCreateNote?.(title);
                  }}
                >
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            return (
              <img
                src={src}
                alt={alt || ""}
                loading="lazy"
                decoding="async"
                className="my-2 h-auto max-h-[520px] w-auto max-w-full rounded-lg border border-border/50"
              />
            );
          },
        }}
      >
        {preprocessMarkdown(body)}
      </ReactMarkdown>
    </div>
  );
}