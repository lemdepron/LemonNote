import { useEffect, useRef, useState, useCallback } from "react";
import { resolveAssetPath } from "@/lib/assets";
import { getAttachmentUrl } from "@/lib/attachments";
import { readerProps } from "@/lib/text-style";
import katexCss from "katex/dist/katex.min.css?raw";

/**
 * Read view for HTML format notes.
 * Renders HTML inside a sandboxed iframe with NO scripts, NO network access.
 * Uses srcdoc with a restrictive CSP.
 */
export default function HtmlView({ body = "", linkIndex, onOpenNote, onCreateNote, typography, hasInk }) {
  const iframeRef = useRef(null);
  const [iframeSrc, setIframeSrc] = useState("");
  const [assetUrls, setAssetUrls] = useState(new Map());
  const assetUrlCache = useRef(new Map());

  // Build the HTML content for the iframe
  const buildIframeContent = useCallback(async (htmlBody) => {
    // Resolve local asset references to blob URLs
    const resolvedBody = await resolveAssetReferences(htmlBody);
    
    // Build the complete HTML document with restrictive CSP
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src blob: data:; style-src 'unsafe-inline'; font-src 'self' data:;">
<style>
${katexCss}
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 1.5rem; font: 16px/1.75 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--background, #fff); color: var(--foreground, #111); }
  img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  a { color: var(--link, #146c62); text-decoration: underline; }
  pre { background: #f4f4f4; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86em; background: #f4f4f4; border-radius: 0.25rem; padding: 0.1em 0.35em; }
  pre code { background: transparent; padding: 0; }
  blockquote { margin: 1.2rem 0; padding-left: 1rem; border-left: 2px solid var(--border, #b1703a); color: var(--muted-foreground, #5a4a3a); font-style: italic; }
  hr { border: 0; border-top: 1px solid var(--border, #d9cdbc); margin: 2rem 0; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid var(--border, #d9cdbc); padding: 0.5rem; }
  th { background: var(--muted, #f4f4f4); }
  .katex { font-size: 1em !important; }
  .katex-display { overflow-x: auto; overflow-y: hidden; }
</style>
</head>
<body>
${resolvedBody}
</body>
</html>`;
    
    return html;
  }, []);

  // Resolve asset references in HTML body to blob URLs
  const resolveAssetReferences = async (htmlBody) => {
    // Find all img src and a href that reference local assets
    const assetRefRegex = /(src|href)=["']((?:\.\/)?assets\/[a-f0-9]{24}\.[a-zA-Z0-9]+)["']/g;
    const matches = [...htmlBody.matchAll(assetRefRegex)];
    
    let resolvedBody = htmlBody;
    
    for (const match of matches) {
      const attr = match[1];
      const path = match[2];
      const fullMatch = match[0];
      
      if (!assetUrlCache.current.has(path)) {
        try {
          const url = await resolveAssetPath(path);
          assetUrlCache.current.set(path, url);
        } catch (err) {
          console.warn("Failed to resolve asset:", path, err);
          // Try attachment fallback
          const id = path.replace(/^.*assets\/([a-f0-9]{24})\..*$/, "$1");
          if (id) {
            try {
              const url = await getAttachmentUrl(`local:${id}`);
              assetUrlCache.current.set(path, url);
            } catch (e) {
              // Keep original path if all fails
            }
          }
        }
      }
      
      const blobUrl = assetUrlCache.current.get(path);
      if (blobUrl) {
        resolvedBody = resolvedBody.replace(fullMatch, `${attr}="${blobUrl}"`);
      }
    }
    
    return resolvedBody;
  };

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of assetUrlCache.current.values()) {
        URL.revokeObjectURL(url);
      }
      assetUrlCache.current.clear();
    };
  }, []);

  // Update iframe src when body changes
  useEffect(() => {
    let mounted = true;
    buildIframeContent(body).then((html) => {
      if (mounted) {
        setIframeSrc(html);
      }
    });
    return () => { mounted = false; };
  }, [body, buildIframeContent]);

  // Handle messages from iframe (for link clicks)
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from our iframe
      if (event.source !== iframeRef.current?.contentWindow) return;
      
      if (event.data.type === "open-link") {
        const { href } = event.data;
        if (href.startsWith("/note/")) {
          const noteId = href.slice(6);
          onOpenNote?.(noteId);
        } else if (href.startsWith("note://")) {
          const title = decodeURIComponent(href.slice(7));
          onCreateNote?.(title);
        }
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onOpenNote, onCreateNote]);

  // Inject the link click handler script into the iframe
  const injectLinkHandler = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    
    const script = `
      (function() {
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (!link) return;
          
          const href = link.getAttribute('href');
          if (!href) return;
          
          // Handle wiki-links and note links
          if (href.startsWith('/note/') || href.startsWith('note://')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'open-link', href }, '*');
          }
          // Allow external links to open normally (they'll be blocked by CSP anyway)
        }, true);
      })();
    `;
    
    try {
      const scriptEl = iframe.contentDocument.createElement("script");
      scriptEl.textContent = script;
      iframe.contentDocument.head.appendChild(scriptEl);
    } catch (e) {
      // CSP may block inline scripts, that's fine
    }
  }, []);

  // Inject link handler when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const onLoad = () => {
      // Small delay to ensure DOM is ready
      setTimeout(injectLinkHandler, 0);
    };
    
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [injectLinkHandler]);

  // Get reader props for styling the container
  const { style, className } = readerProps(typography, hasInk);

  return (
    <div className={`nb-prose ${className}`.trim()} style={style}>
      <iframe
        ref={iframeRef}
        srcDoc={iframeSrc}
        sandbox="allow-same-origin"  // No allow-scripts, no allow-forms, no allow-popups, no allow-top-navigation
        className="w-full min-h-[400px] border-0 bg-transparent"
        style={{ minHeight: "400px" }}
        title="HTML note preview"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}