import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { NOTE_LINK_PREFIX, preprocessMarkdown, titleKey } from "@/lib/vault";
import { SANITIZE_SCHEMA, blockStyle, highlightStyle, normalizeStyle, readerProps, spanStyle } from "@/lib/text-style";
import { getAttachmentUrl } from "@/lib/attachments";
import { isAssetPath, resolveAssetPath, revokeAssetUrl, extractAssetId } from "@/lib/assets";
import { renderChart } from "@/lib/charts";
import { Paperclip, FileText, AudioWaveform, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

// Import KaTeX CSS for offline rendering
import "katex/dist/katex.min.css";

// Import highlight.js core and only the languages we need
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import plaintext from "highlight.js/lib/languages/plaintext";
import properties from "highlight.js/lib/languages/properties";
// Register only the needed languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("ini", properties);
// Also register common aliases
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("py", python);
hljs.registerLanguage("rs", rust);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("txt", plaintext);
// Note: TOML is not available in highlight.js; use yaml for similar syntax
// Import highlight.js theme
import "highlight.js/styles/atom-one-light.css";

const REMARK = [remarkGfm, [remarkMath, { singleDollarTextMath: false }]];
// Pass the custom hljs instance to rehype-highlight
const REHYPE = [rehypeRaw, rehypeKatex, [rehypeHighlight, { hljs }], [rehypeSanitize, SANITIZE_SCHEMA]];

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

/** Check if a link is a file attachment: [name (size)](local:<id>) or [name (size)](./assets/...) */
function isFileAttachment(href, children) {
  if (typeof href !== "string") return false;
  const isLocal = href.startsWith("local:");
  const isAsset = isAssetPath(href);
  if (!isLocal && !isAsset) return false;
  // Children should be text like "name (size)"
  return typeof children === "string" && /\([\d.]+ [KMGT]?B\)$/.test(children.trim());
}

/** File attachment link component with paperclip icon and click handler */
function MarkdownFileAttachment({ href, children }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const [isAssetRef, setIsAssetRef] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const loadFile = async () => {
      try {
        if (isAssetPath(href)) {
          setIsAssetRef(true);
          objectUrl = await resolveAssetPath(href);
        } else {
          objectUrl = await getAttachmentUrl(href);
        }
        if (!mounted) return;
        setResolvedUrl(objectUrl);
        setLoading(false);

        // Get file info from database
        const id = isAssetPath(href) ? extractAssetId(href) : String(href || "").replace(/^local:/, "");
        if (id) {
          const { getFile } = await import("@/api/localDb");
          const row = await getFile(id);
          if (mounted && row) setFileInfo({ name: row.name, type: row.type, size: row.size });
        }
      } catch {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadFile();

    return () => {
      mounted = false;
      // Revoke object URL if we created one for an asset
      if (objectUrl && isAssetRef) {
        revokeAssetUrl(href);
      }
    };
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

/** Audio player component for ![audio](local:<id>) or ![audio](./assets/...) */
function MarkdownAudio({ src, alt }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAssetRef, setIsAssetRef] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const loadAudio = async () => {
      try {
        if (isAssetPath(src)) {
          setIsAssetRef(true);
          objectUrl = await resolveAssetPath(src);
        } else {
          objectUrl = await resolveSrc(src);
        }
        if (mounted) {
          setResolvedSrc(objectUrl);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          setError(true);
        }
      }
    };

    loadAudio();

    return () => {
      mounted = false;
      // Revoke object URL if we created one for an asset
      if (objectUrl && isAssetRef) {
        revokeAssetUrl(src);
      }
    };
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

/** Image component that resolves local: refs and ./assets/... paths asynchronously. */
function MarkdownImage({ src, alt }) {
  const resolveSrc = useAttachmentResolver();
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [error, setError] = useState(false);
  const [isAsset, setIsAsset] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl = null;

    const loadImage = async () => {
      try {
        if (isAssetPath(src)) {
          setIsAsset(true);
          objectUrl = await resolveAssetPath(src);
        } else {
          objectUrl = await resolveSrc(src);
        }
        if (mounted) {
          setResolvedSrc(objectUrl);
          setError(false);
        }
      } catch {
        if (mounted) {
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      // Revoke object URL if we created one for an asset
      if (objectUrl && isAssetPath(src)) {
        revokeAssetUrl(src);
      }
    };
  }, [src, resolveSrc]);

  // Check if this is an audio placeholder
  if (alt === "audio") {
    return <MarkdownAudio src={src} alt={alt} />;
  }

  // Extract filename from asset path for placeholder
  const getFilename = (path) => {
    const match = path.match(/\/([^/]+)$/);
    return match ? match[1] : path;
  };

  if (error) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-destructive">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="font-mono text-[11px] truncate max-w-[300px]">{getFilename(src)}</span>
        <span className="text-[11px] text-muted-foreground">(missing)</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || ""}
      loading="lazy"
      decoding="async"
      className="my-2 h-auto max-h-[520px] w-auto max-w-full rounded-lg border border-border/50"
      onError={() => setError(true)}
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