import {
  Eye,
  PenLine,
  FileText,
  List,
  BookOpen,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Ruler,
  Grid,
  Type,
  Shield,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Table,
  Image,
  SpellCheck,
  Sidebar,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { useI18n } from "@/lib/i18n";
import { countWords } from "@/lib/note-stats";
import { EDITOR_FONTS } from "@/lib/text-style";
import { runAccessibilityChecks } from "@/lib/accessibility";
import { addAttachment } from "@/lib/attachments";
import { tableInsert } from "@/lib/ribbon-actions";
import { useState } from "react";

const VIEW_MODES = [
  { id: "read", label: "ribbon.view.readMode", icon: Eye, hint: "ribbon.view.readModeHint" },
  { id: "draft", label: "ribbon.view.draft", icon: PenLine, hint: "ribbon.view.draftHint" },
  { id: "print", label: "ribbon.view.printLayout", icon: FileText, hint: "ribbon.view.printLayoutHint" },
  { id: "outline", label: "ribbon.view.outline", icon: List, hint: "ribbon.view.outlineHint" },
  { id: "immersive", label: "ribbon.view.immersiveReader", icon: BookOpen, hint: "ribbon.view.immersiveReaderHint" },
];

const ZOOM_PRESETS = [
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
  { value: "125", label: "125%" },
  { value: "150", label: "150%" },
  { value: "200", label: "200%" },
  { value: "300", label: "300%" },
  { value: "page-width", label: "ribbon.view.pageWidth" },
  { value: "one-page", label: "ribbon.view.onePage" },
  { value: "two-pages", label: "ribbon.view.twoPages" },
];

const READ_WIDTHS = [
  { value: "36", label: "ribbon.view.narrow" },
  { value: "42", label: "ribbon.view.medium" },
  { value: "48", label: "ribbon.view.wide" },
  { value: "60", label: "ribbon.view.full" },
];

function StatRow({ label, text }) {
  return (
    <div className="flex min-w-[3.6rem] flex-col items-center px-1.5 font-mono">
      <span className="text-[12px] text_foreground">{text}</span>
      <span className="text_[8.5px] uppercase tracking_[0.12em] text-muted_foreground/70">{label}</span>
    </div>
  );
}

export function ViewTab() {
  const { t } = useI18n();
  const { value, selection, typography: typo, setTypography, body, markdown, run } = useRibbon();
  const patch = (next) => setTypography({ ...typo, ...next });
  const drop = (key) => {
    const next = { ...typo };
    delete next[key];
    setTypography(next);
  };
  const selected = value.slice(selection.start, selection.end);
  const words = countWords(body);
  const lines = body ? body.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(words / 220));

  const [a11yOpen, setA11yOpen] = useState(false);
  const [a11yIssues, setA11yIssues] = useState([]);
  const [a11yRunning, setA11yRunning] = useState(false);

  const runA11yCheck = () => {
    setA11yRunning(true);
    setTimeout(() => {
      const issues = runAccessibilityChecks(body);
      setA11yIssues(issues);
      setA11yOpen(true);
      setA11yRunning(false);
    }, 0);
  };

  const scrollToIssue = (issue) => {
    const readContent = document.querySelector('[data-read-content]') || document.querySelector('.nb-prose');
    if (readContent && issue.line) {
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
    if (severity === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber_500" />;
    return <CheckCircle className="h-3.5 w-3.5 text-green_500" />;
  };

  const handleAttachFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const attachment = await addAttachment(file);
        const snippet = `\n[${file.name}](${attachment.ref})\n\n`;
        run({
          start: selection.start ?? value.length,
          end: selection.end ?? value.length,
          text: snippet,
          caret: selection.start + snippet.length,
        });
      } catch (err) {
        console.error("Failed to attach file:", err);
      }
    };
    input.click();
  };

  const handleAttachImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const attachment = await addAttachment(file);
        const snippet = `\n![${file.name.replace(/\.[^.]+$/, "")}](${attachment.ref})\n\n`;
        run({
          start: selection.start ?? value.length,
          end: selection.end ?? value.length,
          text: snippet,
          caret: selection.start + snippet.length,
        });
      } catch (err) {
        console.error("Failed to attach image:", err);
      }
    };
    input.click();
  };

  const handleInsertTable = () => {
    const table = tableInsert(selection, 3, 3);
    if (table) {
      run(table);
    }
  };

  const viewMode = typo.viewMode || "read";

  return (
    <>
      {/* ─── Views ─── */}
      <RibbonGroup label={t("ribbon.view.views")} icon={Maximize2} priority={90}>
        {VIEW_MODES.map((mode) => (
          <Btn
            key={mode.id}
            id={`view.mode.${mode.id}`}
            icon={mode.icon}
            label={t(mode.label)}
            hint={t(mode.hint)}
            active={viewMode === mode.id}
            onClick={() => patch({ viewMode: mode.id })}
          />
        ))}
      </RibbonGroup>

      {/* ─── Navigation ─── */}
      <RibbonGroup label={t("ribbon.view.navigation")} icon={Sidebar} priority={80}>
        <Btn
          id="view.navPane"
          icon={Sidebar}
          label={t("ribbon.view.navigationPane")}
          hint={t("ribbon.view.navigationPaneHint")}
          active={typo.showNavPane}
          onClick={() => patch({ showNavPane: !typo.showNavPane })}
        />
        <Btn
          id="view.find"
          icon={Search}
          label={t("ribbon.view.find")}
          hint={t("ribbon.view.findHint")}
          shortcut="Ctrl+F"
          onClick={() => patch({ showNavPane: true, navPaneTab: "find" })}
        />
      </RibbonGroup>

      {/* ─── Zoom ─── */}
      <RibbonGroup label={t("ribbon.view.zoom")} icon={ZoomIn} priority={70}>
        <Btn
          id="view.zoomOut"
          icon={ZoomOut}
          label={t("ribbon.view.zoomOut")}
          hint={t("ribbon.view.zoomOutHint")}
          shortcut="Ctrl+-"
          onClick={() => {
            const current = typeof typo.zoom === "number" ? typo.zoom : 100;
            patch({ zoom: Math.max(50, current - 10) });
          }}
        />
        <Btn
          id="view.zoomIn"
          icon={ZoomIn}
          label={t("ribbon.view.zoomIn")}
          hint={t("ribbon.view.zoomInHint")}
          shortcut="Ctrl++"
          onClick={() => {
            const current = typeof typo.zoom === "number" ? typo.zoom : 100;
            patch({ zoom: Math.min(300, current + 10) });
          }}
        />
        <RibbonSelect
          title={t("ribbon.view.zoomLevel")}
          value={String(typo.zoom ?? 100)}
          onChange={(val) => {
            if (val === "page-width" || val === "one-page" || val === "two-pages") {
              patch({ zoom: val });
            } else {
              patch({ zoom: Math.max(50, Math.min(300, Number(val))) });
            }
          }}
          options={ZOOM_PRESETS}
          style={{ gridRow: "span 2" }}
        />
      </RibbonGroup>

      {/* ─── Page & Scroll ─── */}
      <RibbonGroup label={t("ribbon.view.pageScroll")} icon={MoveVertical} priority={60}>
        <Btn
          id="view.ruler"
          icon={Ruler}
          label={t("ribbon.view.ruler")}
          hint={t("ribbon.view.rulerHint")}
          active={typo.showRuler}
          onClick={() => patch({ showRuler: !typo.showRuler })}
        />
        <Btn
          id="view.gridlines"
          icon={Grid}
          label={t("ribbon.view.gridlines")}
          hint={t("ribbon.view.gridlinesHint")}
          active={typo.showGridlines}
          onClick={() => patch({ showGridlines: !typo.showGridlines })}
        />
        <Btn
          id="view.scrollVertical"
          icon={MoveVertical}
          label={t("ribbon.view.vertical")}
          hint={t("ribbon.view.verticalHint")}
          active={typo.scrollMode === "vertical" || !typo.scrollMode}
          onClick={() => patch({ scrollMode: "vertical" })}
        />
        <Btn
          id="view.scrollHorizontal"
          icon={MoveHorizontal}
          label={t("ribbon.view.horizontal")}
          hint={t("ribbon.view.horizontalHint")}
          active={typo.scrollMode === "horizontal"}
          disabled={viewMode !== "print"}
          disabledReason={viewMode !== "print" ? t("ribbon.view.horizontalHint") : undefined}
          onClick={() => patch({ scrollMode: "horizontal" })}
        />
        <Stepper
          title={t("ribbon.view.readingPageWidth")}
          value={typo.readWidth || 42}
          min={36}
          max={60}
          step={2}
          onChange={(w) => patch({ readWidth: w })}
          format={(n) => `${n}em`}
          style={{ gridRow: "span 2" }}
        />
      </RibbonGroup>

      {/* ─── Attach & Table ─── */}
      <RibbonGroup label={t("ribbon.view.attachTable")} icon={Paperclip} priority={50}>
        <Btn
          id="view.attachFile"
          icon={Paperclip}
          label={t("ribbon.view.attachFile")}
          hint={t("ribbon.view.attachFileHint")}
          onClick={handleAttachFile}
        />
        <Btn
          id="view.attachImage"
          icon={Image}
          label={t("ribbon.view.attachImage")}
          hint={t("ribbon.view.attachImageHint")}
          onClick={handleAttachImage}
        />
        <Btn
          id="view.insertTable"
          icon={Table}
          label={t("ribbon.view.insertTable")}
          hint={t("ribbon.view.insertTableHint")}
          onClick={handleInsertTable}
        />
      </RibbonGroup>

      {/* ─── Editor & Accessibility ─── */}
      <RibbonGroup label={t("ribbon.view.editorA11y")} icon={Type} priority={40}>
        <RibbonSelect
          title={t("ribbon.view.editorFont")}
          placeholder={t("ribbon.view.editorFontPlaceholder")}
          options={EDITOR_FONTS.map((f) => ({ value: f.id, label: f.label }))}
          value={typo.editorFont || ""}
          onChange={(value) => (value ? patch({ editorFont: value }) : drop("editorFont"))}
          style={{ gridRow: "span 2" }}
        />
        <Stepper
          title={t("ribbon.view.editorSize")}
          value={typo.editorSize || 14}
          min={10}
          max={24}
          step={1}
          onChange={(size) => patch({ editorSize: size })}
          format={(n) => `${n}px`}
          style={{ gridRow: "span 2" }}
        />
        <Btn
          id="view.spellCheck"
          icon={SpellCheck}
          label={t("ribbon.view.spellCheck")}
          hint={t("ribbon.view.spellCheckHint")}
          active={typo.spell !== false}
          onClick={() => {
            const t_ = typo || {};
            if (t_.spell === false) {
              const next = { ...t_ };
              delete next.spell;
              setTypography(next);
            } else {
              setTypography({ ...t_, spell: false });
            }
          }}
        />
        <Btn
          id="view.a11yCheck"
          icon={Shield}
          label={t("ribbon.view.checkAccessibility")}
          hint={t("ribbon.view.checkAccessibilityHint")}
          disabled={a11yRunning}
          onClick={runA11yCheck}
        />
      </RibbonGroup>

      {/* ─── Statistics (read-only display) ─── */}
      <RibbonGroup label={t("ribbon.view.statistics")} icon={Maximize2} priority={10} className="border-s border-border/50 pl-2">
        <StatRow label={t("ribbon.view.words")} text={String(words)} />
        <StatRow label={t("ribbon.view.chars")} text={String(body.length)} />
        <StatRow label={t("ribbon.view.lines")} text={String(lines)} />
        <StatRow label={t("ribbon.view.read")} text={`${readMinutes} ${t("ribbon.view.read")}`} />
      </RibbonGroup>

      {/* ─── Accessibility Issues Dialog ─── */}
      {a11yOpen && a11yIssues.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="a11y-title">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="a11y-title" className="font-semibold text-lg">{t("ribbon.view.accessibilityIssues", { count: a11yIssues.length })}</h2>
              <button
                type="button"
                onClick={() => setA11yOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-96 overflow-auto space-y-2">
              {a11yIssues.map((issue, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIssue(issue)}
                  className="w-full text-left p-3 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/50 transition flex items-start gap-3"
                >
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{issue.message}</div>
                    <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                      {t("ribbon.view.line")} {issue.line}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-center text-muted-foreground text-sm">
              {t("ribbon.view.clickToJump")}
            </div>
          </div>
        </div>
      )}

      {a11yOpen && a11yIssues.length === 0 && !a11yRunning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="a11y-title">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl text-center">
            <CheckCircle className="h-12 w-12 text-green_500 mx-auto mb-4" />
            <h2 id="a11y-title" className="font-semibold text-lg mb-2">{t("ribbon.view.noIssuesFound")}</h2>
            <p className="text-muted-foreground mb-6">{t("ribbon.view.passesAllChecks")}</p>
            <button
              type="button"
              onClick={() => setA11yOpen(false)}
              className="h-8 rounded-md bg-primary text-primary-foreground px-4 font-mono text-[10.5px] transition hover:bg-primary/90"
            >
              {t("ribbon.view.checkAccessibility")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}