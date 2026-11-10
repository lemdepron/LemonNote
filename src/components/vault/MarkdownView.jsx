import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { NOTE_LINK_PREFIX, preprocessMarkdown, titleKey } from "@/lib/vault";
import { SANITIZE_SCHEMA, blockStyle, highlightStyle, normalizeStyle, readerProps, spanStyle } from "@/lib/text-style";
import { getAttachmentUrl } from "@/lib/attachments";
import { renderChart } from "@/lib/charts";
import { Paperclip, FileText, AudioWaveform, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

const REMARK = [remarkGfm];
const REHYPE = [rehypeRaw, [rehypeSanitize, SANITIZE_SCHEMA]];

/** react-markdown hands data-attributes over as `data-x` props; the tables in text-style read them by that name. */
const dataOf = (props) => Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith("data-")));

/**
 * Resolve a local: attachment reference to an object URL.
 * Uses a simple in-memory cache to avoid repeated lookups.
 */
function useAttachmentResolver() {
  const cache = useMemo(() => new Map(), []);

  const resolve = useCallback(async (src) => {
    if (typeof src === "string" && src.startsWith("local:")) {
      const cached = cache.get(src);
      if (cached) return cached;
      try {
        const url = await getAttachmentUrl(src);
        cache.set(src, url);
        return url;
      } catch {
        return src; // fallback to original if not found
      }
    }
    return src;
  }, [cache]);

  return resolve;
}

/** Check if a link is a file attachment: [name (size)](local:<id>) */
function isFileAttachment(href, children) {
  if (typeof href !== "string" || !href.startsWith("local:")) return false;
  // Children should be text like "name (size)"
  return typeof children === "string" && /\([\d.]+ [KMGT]?B\)$/.test(children.trim());
}

/** File attachment link component with paperclip icon and click handler */
function MarkdownFileAttachment({ href, children }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    let mounted = true;
    const id = String(href || "").replace(/^local:/, "");
    if (!id) {
      setLoading(false);
      return;
    }

    // Get file metadata
    getAttachmentUrl(href).then((url) => {
      if (!mounted) return;
      setResolvedUrl(url);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    // Try to get file info from the database
    import("@/api/localDb").then(({ getFile }) => {
      getFile(id).then((row) => {
        if (mounted && row) setFileInfo({ name: row.name, type: row.type, size: row.size });
      }).catch(() => {});
    });

    return () => { mounted = false; };
  }, [href, resolveSrc]);

  const handleClick = async (event) => {
    event.preventDefault();
    if (!resolvedUrl || !fileInfo) return;

    const { name, type } = fileInfo;
    const isImage = type.startsWith("image/");
    const isPdf = type === "application/pdf";

    if (isImage || isPdf) {
      // Open in viewer panel (new tab with the file)
      window.open(resolvedUrl, "_blank");
    } else {
      // Download the file
      try {
        // Try Tauri save dialog first
        const { save } = await import("@tauri-apps/plugin-dialog").catch(() => ({ save: null }));
        if (save) {
          const blob = await fetch(resolvedUrl).then((r) => r.blob());
          const arrayBuffer = await blob.arrayBuffer();
          await save({
            defaultPath: name,
            filters: [{ name: "All Files", extensions: ["*"] }],
          }, new Uint8Array(arrayBuffer));
          toast.success("File saved.");
        } else {
          // Fallback: browser download
          const a = document.createElement("a");
          a.href = resolvedUrl;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } catch {
        toast.error("Failed to download file.");
      }
    }
  };

  if (loading) {
    return (
      <a href="#" className="flex items-center gap-2 text-muted-foreground cursor-wait">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="font-mono text-[11px]">Loading…</span>
      </a>
    );
  }

  const icon = fileInfo?.type?.startsWith("image/") ? FileText : Paperclip;

  return (
    <a
      href={resolvedUrl || href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-[12.5px] text-foreground transition hover:bg-accent hover:border-primary/30"
      title="Click to open or download"
    >
      <icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono">{children}</span>
    </a>
  );
}

/** Audio player component for ![audio](local:<id>) */
function MarkdownAudio({ src, alt }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    resolveSrc(src).then((url) => {
      if (mounted) {
        setResolvedSrc(url);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false);
        setError(true);
      }
    });
    return () => { mounted = false; };
  }, [src, resolveSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setError(true));
      setPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  if (loading) {
    return (
      <div className="my-2 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-mono text-[11px]">Loading audio…</span>
      </div>
    );
  }

  if (error || !resolvedSrc) {
    return (
      <div className="my-2 flex items-center gap-2 text-destructive">
        <AudioWaveform className="h-4 w-4" />
        <span className="font-mono text-[11px]">Failed to load audio</span>
      </div>
    );
  }

  return (
    <div className="my-2 flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2">
      <button
        ref={audioRef}
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition hover:bg-primary/20"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
        style={{ display: "none" }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-foreground truncate">Audio recording</div>
        <div className="h-1 w-full mt-1 rounded bg-border/50">
          <div
            className="h-full rounded bg-primary"
            style={{ width: audioRef.current?.duration ? `${(audioRef.current.currentTime / audioRef.current.duration) * 100}%` : "0%" }}
          />
        </div>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">
        {audioRef.current?.duration ? `${Math.floor(audioRef.current.currentTime / 60)}:${String(Math.floor(audioRef.current.currentTime) % 60).padStart(2, "0")} / ${Math.floor(audioRef.current.duration / 60)}:${String(Math.floor(audioRef.current.duration) % 60).padStart(2, "0")}` : "0:00 / 0:00"}
      </span>
    </div>
  );
}

/** Image component that resolves local: refs asynchronously. */
function MarkdownImage({ src, alt }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let mounted = true;
    resolveSrc(src).then((url) => {
      if (mounted) setResolvedSrc(url);
    });
    return () => {
      mounted = false;
    };
  }, [src, resolveSrc]);

  // Check if this is an audio placeholder
  if (alt === "audio") {
    return <MarkdownAudio src={src} alt={alt} />;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      className="my-2 h-auto max-h-[520px] w-auto max-w-full rounded-lg border border-border/50"
    />
  );
}

/** Extract GFM tables from markdown as arrays of arrays */
function extractTables(markdown = "") {
  const tables = [];
  const lines = markdown.split("\n");
  let inTable = false;
  let currentTable = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      // This is a table row
      const cells = trimmed.slice(1, -1).split("|").map(c => c.trim());
      currentTable.push(cells);
      inTable = true;
    } else if (inTable && /^\s*\|?\s*[-:]+\s*\|/.test(trimmed)) {
      // This is a separator row (--- | ---), skip it but stay in table
      continue;
    } else if (inTable) {
      // End of table
      if (currentTable.length > 1) { // At least header + one row
        tables.push(currentTable);
      }
      currentTable = [];
      inTable = false;
    }
  }
  // Handle table at end of document
  if (inTable && currentTable.length > 1) {
    tables.push(currentTable);
  }
  return tables;
}

/** Block elements that get dir="auto" individually when the note direction is Auto. */
const DIR_AUTO_TAGS = [
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "pre", "dt", "dd", "td", "th",
];

export default function MarkdownView({ body = "", linkIndex, onOpenNote, onCreateNote, typography, hasInk }) {
  const dirAuto = normalizeStyle(typography).dir === "auto";
  const { style, className } = readerProps(typography, hasInk);

  // Extract tables from body for chart rendering
  const tables = useMemo(() => extractTables(body), [body]);

  // Scroll to anchor (bookmark) on mount or when body changes
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      // Small delay to ensure the DOM is rendered
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    }
  }, [body]);

  return (
    <div className={`nb-prose ${className}`.trim()} style={style}>
        <ReactMarkdown
          remarkPlugins={REMARK}
          rehypePlugins={REHYPE}
          components={{
            // With note direction "Auto" every block element detects its own direction.
            ...(dirAuto
              ? Object.fromEntries(
                  DIR_AUTO_TAGS.map((tag) => [tag, ({ node, ...props }) => React.createElement(tag, { ...props, dir: "auto" })])
                )
              : {}),
            span({ children, ...props }) {
              return <span style={spanStyle(dataOf(props))}>{children}</span>;
            },
            mark({ children, ...props }) {
              return <mark style={highlightStyle(props["data-h"])}>{children}</mark>;
            },
            div({ children, ...props }) {
              return <div style={blockStyle(dataOf(props))} dir={dataOf(props)["data-dir"] === "auto" ? "auto" : undefined}>{children}</div>;
            },
            figcaption({ children, ...props }) {
              return <figcaption className="nb-figcaption" style={props.style}>{children}</figcaption>;
            },
            code({ children, className, ...props }) {
              // Check if this is a chart code block (language-chart)
              const lang = className?.replace(/^language-/, '');
              if (lang === 'chart') {
                try {
                  const config = JSON.parse(children);
                  return <div dangerouslySetInnerHTML={{ __html: renderChart(config, tables) }} />;
                } catch {
                  return <pre className="chart-error" style={{ color: 'var(--destructive)', padding: '1rem', border: '1px solid var(--destructive)', borderRadius: '0.5rem' }}>Invalid chart config: could not parse JSON</pre>;
                }
              }
              return <code className={className} {...props}>{children}</code>;
            },
            a({ href, children }) {
            if (typeof href === "string" && href.startsWith(NOTE_LINK_PREFIX)) {
              const rawTitle = decodeURIComponent(href.slice(NOTE_LINK_PREFIX.length));
              // Split title and anchor (e.g., "Note Title#bookmark-name")
              const hashIndex = rawTitle.indexOf('#');
              const title = hashIndex >= 0 ? rawTitle.slice(0, hashIndex) : rawTitle;
              const anchor = hashIndex >= 0 ? rawTitle.slice(hashIndex + 1) : null;
              const target = linkIndex?.get(titleKey(title));
              const hrefWithAnchor = target ? `/note/${target.id}${anchor ? '#' + anchor : ''}` : "#";
              return (
                <a
                  href={hrefWithAnchor}
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
            // Handle file attachments: [name (size)](local:<id>)
            if (isFileAttachment(href, children)) {
              return <MarkdownFileAttachment href={href} children={children} />;
            }
            return (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
          img: MarkdownImage,
        }}
      >
        {preprocessMarkdown(body)}
      </ReactMarkdown>
    </div>
  );
}