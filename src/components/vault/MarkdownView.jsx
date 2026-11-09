import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { NOTE_LINK_PREFIX, preprocessMarkdown, titleKey } from "@/lib/vault";
import { SANITIZE_SCHEMA, blockStyle, highlightStyle, readerProps, spanStyle } from "@/lib/text-style";

const REMARK = [remarkGfm];
const REHYPE = [rehypeRaw, [rehypeSanitize, SANITIZE_SCHEMA]];

/** react-markdown hands data-attributes over as `data-x` props; the tables in text-style read them by that name. */
const dataOf = (props) => Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith("data-")));

export default function MarkdownView({ body = "", linkIndex, onOpenNote, onCreateNote, typography, hasInk }) {
  const { style, className } = readerProps(typography, hasInk);
  return (
    <div className={`nb-prose ${className}`.trim()} style={style}>
      <ReactMarkdown
        remarkPlugins={REMARK}
        rehypePlugins={REHYPE}
        components={{
          span({ children, ...props }) {
            return <span style={spanStyle(dataOf(props))}>{children}</span>;
          },
          mark({ children, ...props }) {
            return <mark style={highlightStyle(props["data-h"])}>{children}</mark>;
          },
          div({ children, ...props }) {
            return <div style={blockStyle(dataOf(props))}>{children}</div>;
          },
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