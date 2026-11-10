import {
  LayoutDashboard,
  FileText,
  List,
  BookOpen,
  AlignLeft,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Ruler,
  Grid,
  Type,
  Eye,
  PenLine,
  Shield,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { countWords } from "@/lib/note-stats";
import { EDITOR_FONTS, WIDTHS } from "@/lib/text-style";
import { runAccessibilityChecks } from "@/lib/accessibility";
import { useState } from "react";

const VIEW_MODES = [
  { id: "read", label: "Read Mode", icon: Eye, hint: "Rendered markdown with styling" },
  { id: "draft", label: "Draft", icon: PenLine, hint: "Plain writing box, no styling" },
  { id: "print", label: "Print Layout", icon: FileText, hint: "Pages with shadows, numbers, margins" },
  { id: "outline", label: "Outline", icon: List, hint: "Collapsible heading tree" },
  { id: "immersive", label: "Immersive Reader", icon: BookOpen, hint: "Distraction-free, large text, read-aloud" },
];

const ZOOM_PRESETS = [
  { value: 100, label: "100%" },
  { value: "page-width", label: "Page Width" },
  { value: "one-page", label: "One Page" },
  { value: "two-pages", label: "Multiple Pages" },
];

export function ViewTab() {
  const { value, selection, typography: t, setTypography, body } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };
  const selected = value.slice(selection.start, selection.end);
  const words = countWords(body);
  const lines = body ? body.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(words / 220));
  const stat = (label, text) => (
    <div className="flex min-w-[3.6rem] flex-col items-center px-1.5 font-mono">
      <span className="text-[12px] text-foreground">{text}</span>
      <span className="text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground/70">{label}</span>
    </div>
  );

  // Accessibility checker state
  const [a11yOpen, setA11yOpen] = useState(false);
  const [a11yIssues, setA11yIssues] = useState([]);
  const [a11yRunning, setA11yRunning] = useState(false);

  const runA11yCheck = () => {
    setA11yRunning(true);
    // Run in a timeout to not block UI
    setTimeout(() => {
      const issues = runAccessibilityChecks(body);
      setA11yIssues(issues);
      setA11yOpen(true);
      setA11yRunning(false);
    }, 0);
  };

  const scrollToIssue = (issue) => {
    // Find the element in the reader view
    const readContent = document.querySelector('[data-read-content]') || document.querySelector('.nb-prose');
    if (readContent && issue.line) {
      // For markdown view, we need to find the line
      const walker = document.createTreeWalker(readContent, NodeFilter.SHOW_TEXT);
      let currentLine = 0;
      let node;
      while ((node = walker.nextNode())) {
        currentLine += (node.textContent?.match(/\n/g) || []).length + 1;
        if (currentLine >= issue.line) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          node.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }
    setA11yOpen(false);
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'error') return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    if (severity === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  };

  return (
    <>
      {/* 1. Views */}
      <RibbonGroup label="Views" icon={LayoutDashboard}>
        <div className="flex flex-wrap gap-1">
          {VIEW_MODES.map(({ id, label, icon: Icon, hint }) => (
            <Btn
              key={id}
              id={`view.mode.${id}`}
              icon={Icon}
              label={label}
              hint={hint}
              active={t.viewMode === id}
              onClick={() => patch({ viewMode: id })}
            />
          ))}
        </div>
      </RibbonGroup>

      {/* 2. Navigation Pane */}
      <RibbonGroup label="Navigation pane" icon={AlignLeft}>
        <Btn
          id="view.navPane"
          icon={AlignLeft}
          label="Navigation pane"
          hint="Show side panel with headings and find"
          active={t.showNavPane === true}
          onClick={() => patch({ showNavPane: !t.showNavPane })}
        />
        <Btn
          id="view.find"
          icon={Search}
          label="Find"
          hint="Find in this note (Ctrl+F)"
          onClick={() => {
            patch({ showNavPane: true, navPaneTab: "find" });
            // Focus the find input after a tick
            setTimeout(() => {
              const input = document.querySelector('[data-find-input]');
              input?.focus();
            }, 0);
          }}
        />
      </RibbonGroup>

      {/* 3. Zoom */}
      <RibbonGroup label="Zoom" icon={Maximize2}>
        <div className="flex items-center gap-2">
          <Btn
            id="view.zoomOut"
            icon={ZoomOut}
            label="Zoom out"
            hint="Decrease zoom (Ctrl+-)"
            onClick={() => patch({ zoom: Math.max(50, (t.zoom || 100) - 10) })}
          />
          <div className="w-24">
            <RibbonSelect
              title="Zoom level"
              placeholder="Zoom"
              options={ZOOM_PRESETS.map((item) => ({ value: String(item.value), label: item.label }))}
              value={t.zoom === "page-width" ? "page-width" : t.zoom === "one-page" ? "one-page" : t.zoom === "two-pages" ? "two-pages" : String(t.zoom || 100)}
              onChange={(value) => {
                if (value === "page-width" || value === "one-page" || value === "two-pages") {
                  patch({ zoom: value });
                } else {
                  const num = Number(value);
                  if (Number.isFinite(num)) patch({ zoom: Math.max(50, Math.min(300, num)) });
                }
              }}
            />
          </div>
          <Btn
            id="view.zoomIn"
            icon={ZoomIn}
            label="Zoom in"
            hint="Increase zoom (Ctrl++)"
            onClick={() => patch({ zoom: Math.min(300, (t.zoom || 100) + 10) })}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-mono text-[10px] text-muted-foreground/70">Slider:</span>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={typeof t.zoom === "number" ? t.zoom : 100}
            onChange={(e) => patch({ zoom: Number(e.target.value) })}
            className="flex-1 h-4 accent-primary"
            title="Zoom 50%–300%"
          />
        </div>
      </RibbonGroup>

      {/* 4. Page Display */}
      <RibbonGroup label="Page display" icon={LayoutGrid}>
        <Btn
          id="view.ruler"
          icon={Ruler}
          label="Ruler"
          hint="Show horizontal ruler with page width and margins"
          active={t.showRuler === true}
          onClick={() => patch({ showRuler: !t.showRuler })}
        />
        <Btn
          id="view.gridlines"
          icon={Grid}
          label="Gridlines"
          hint="Show overlay grid on the page"
          active={t.showGridlines === true}
          onClick={() => patch({ showGridlines: !t.showGridlines })}
        />
      </RibbonGroup>

      {/* 5. Scroll Mode */}
      <RibbonGroup label="Scroll mode" icon={MoveVertical}>
        <div className="flex gap-1">
          <Btn
            id="view.scrollVertical"
            icon={MoveVertical}
            label="Vertical"
            hint="Vertical scrolling (default)"
            active={t.scrollMode !== "horizontal"}
            onClick={() => patch({ scrollMode: "vertical" })}
          />
          <Btn
            id="view.scrollHorizontal"
            icon={MoveHorizontal}
            label="Side to Side"
            hint="Horizontal page flow (Print Layout only)"
            active={t.scrollMode === "horizontal"}
            onClick={() => patch({ scrollMode: "horizontal" })}
            disabled={t.viewMode !== "print"}
          />
        </div>
      </RibbonGroup>

      {/* 6. Reading page width (existing) */}
      <RibbonGroup label="Reading page">
        <RibbonSelect
          title="Width of the reading column"
          placeholder="Width"
          options={WIDTHS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.width || ""}
          onChange={(value) => (value ? patch({ width: value }) : drop("width"))}
        />
      </RibbonGroup>

      {/* 7. Editor (existing) */}
      <RibbonGroup label="Editor">
        <RibbonSelect
          title="Font of the writing box"
          placeholder="Editor font"
          options={EDITOR_FONTS.map((item) => ({ value: item.id, label: item.label }))}
          value={t.editorFont || ""}
          onChange={(value) => (value ? patch({ editorFont: value }) : drop("editorFont"))}
        />
        <Stepper title="Editor text size (px)" value={t.editorSize || 14} min={10} max={32} onChange={(editorSize) => patch({ editorSize })} format={(n) => `${n}px`} />
        <Btn
          id="view.spellCheck"
          icon={Type}
          label="Spell check"
          hint="Underline misspelled words in the writing box"
          active={t.spell !== false}
          disabled={false}
          onClick={() => (t.spell === false ? drop("spell") : patch({ spell: false }))}
        />
      </RibbonGroup>

      {/* 8. Statistics (existing) */}
      <RibbonGroup label="Statistics">
        <div className="flex items-center divide-x divide-border/50" style={{ minWidth: 'max-content' }}>
          {stat("words", words)}
          {stat("chars", body.length)}
          {stat("lines", lines)}
          {stat("read", `${readMinutes} min`)}
          {stat("selected", selected ? countWords(selected) : 0)}
        </div>
      </RibbonGroup>

      {/* 9. Accessibility Checker */}
      <RibbonGroup label="Accessibility" icon={Shield}>
        <Btn
          id="view.a11yCheck"
          icon={Shield}
          label="Check accessibility"
          hint="Check for missing alt text, skipped headings, weak links, and low contrast"
          onClick={runA11yCheck}
          disabled={a11yRunning}
        />
        {a11yRunning && <span className="text-[11px] text-muted-foreground ml-2">Checking…</span>}
      </RibbonGroup>

      {/* Accessibility Issues Panel */}
      {a11yOpen && a11yIssues.length > 0 && (
        <div
          className="fixed bottom-0 right-0 z-50 w-80 max-h-[60vh] bg-card border border-border/80 shadow-xl flex flex-col"
          style={{ borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}
          role="dialog"
          aria-label="Accessibility issues"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-[11px] font-medium">Accessibility Issues ({a11yIssues.length})</span>
            <button
              type="button"
              onClick={() => setA11yOpen(false)}
              className="p-1 rounded hover:bg-accent transition"
              aria-label="Close accessibility panel"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {a11yIssues.map((issue, index) => (
              <button
                key={`${issue.type}-${issue.line}-${index}`}
                type="button"
                onClick={() => scrollToIssue(issue)}
                className="w-full flex items-start gap-2 px-2 py-2 text-left rounded hover:bg-accent transition"
              >
                <span className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[12px]">{issue.message}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Line {issue.line} · {issue.type.replace('-', ' ')}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground/70 mt-0.5">{issue.snippet}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2 text-[10px] text-muted-foreground font-mono">
            Click an issue to jump to it in the note.
          </div>
        </div>
      )}

      {a11yOpen && a11yIssues.length === 0 && !a11yRunning && (
        <div
          className="fixed bottom-0 right-0 z-50 w-80 bg-card border border-border/80 shadow-xl flex flex-col"
          style={{ borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}
          role="dialog"
          aria-label="Accessibility check passed"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-[11px] font-medium">Accessibility Check</span>
            <button
              type="button"
              onClick={() => setA11yOpen(false)}
              className="p-1 rounded hover:bg-accent transition"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-[13px]">No issues found</p>
            <p className="text-[11px] text-muted-foreground mt-1">Your note passes all accessibility checks.</p>
            <button
              type="button"
              onClick={() => setA11yOpen(false)}
              className="mt-3 px-3 py-1.5 text-[11px] rounded border border-border/70 hover:bg-accent transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}