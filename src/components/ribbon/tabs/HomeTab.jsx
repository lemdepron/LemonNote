import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownAZ, ArrowUpAZ, ArrowRight, ArrowLeftRight, Bold, Brush, Code, Copy, Eraser,
  FlipHorizontal2, Hash, Highlighter, IndentDecrease, IndentIncrease, Italic, List, ListChecks, ListOrdered, ListX, Merge, Minus,
  Quote, Redo2, Scissors, SquareDashedMousePointer, Strikethrough, Trash2,
  Underline, Undo2, WrapText, Pilcrow, MoveHorizontal,
  Circle, CircleCheck, Timer, ListRestart, CircleDashed, Search,
  Globe, Languages, Wand2,
  Type, FileText,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { FORMAT_GROUPS, formatLabel } from "@/lib/note-formats";
import { Btn, GroupMenu, MenuLabel, RibbonSelect, Stepper, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText, execEditor } from "@/lib/editor-bridge";
import {
  applyAttr, clearFormatting, lineTool, setBlock, setHeading, shiftIndent, toggleItalic, toggleLinePrefix, toggleWrap, taskTool,
  readMarks, applyMarks,
} from "@/lib/format-actions";
import {
  FONTS, FONT_GROUPS, LETTER_SPACING,
} from "@/lib/text-style";
import { toggleTask, taskStatusAt } from "@/lib/ribbon-actions";
import { readPref, writePref } from "@/lib/preferences";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { TagGroup } from "@/components/ribbon/tabs/TagGroup";
import { isAIEnabled, callAI, buildPrompt, getAIErrorMessage } from "@/lib/ai";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

const CYCLE = { TODO: "DOING", DOING: "DONE", DONE: "TODO" };

const headingAtCaret = (value, index) => {
  const start = value.lastIndexOf("\n", index - 1) + 1;
  const end = value.indexOf("\n", index);
  const line = value.slice(start, end === -1 ? value.length : end);
  return (/^\s*(#{1,6})\s/.exec(line) || [])[1]?.length || 0;
};

const fontGroups = FONT_GROUPS.map((label) => ({
  label,
  options: FONTS.filter((font) => font.group === label).map((font) => ({ value: font.id, label: font.label })),
}));

const STATUS = [
  ["TODO", Circle, "ribbon.home.todoHint", "Ctrl+Alt+1", "home.todo"],
  ["DOING", Timer, "ribbon.home.doingHint", "Ctrl+Alt+2", "home.doing"],
  ["DONE", CircleCheck, "ribbon.home.doneHint", "Ctrl+Alt+3", "home.done"],
];

const FORMAT_PAINTER_KEY = "formatPainterMarks";

function readFormatPainter() {
  try {
    const raw = readPref(FORMAT_PAINTER_KEY, "{}");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeFormatPainter(marks) {
  writePref(FORMAT_PAINTER_KEY, JSON.stringify(marks));
}

export function HomeTab({ format, onFormat, body, noteId, noteTitle, onFindTags }) {
  const { t: tr } = useI18n();
  const ctx = useRibbon();
  const { selection, markdown, run, typography: typo, setTypography } = ctx;
  const level = headingAtCaret(selection.value, selection.start);
  const selected = selection.value.slice(selection.start, selection.end);
  const status = taskStatusAt(body, selection.start);
  const patch = (next) => setTypography({ ...typo, ...next });
  const drop = (key) => {
    const next = { ...typo };
    delete next[key];
    setTypography(next);
  };
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [formatPainterLocked, setFormatPainterLocked] = useState(false); // double-click keeps active

  // AI state
  const [aiBusy, setAiBusy] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiAction, setAiAction] = useState("");
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);

  // Get text to process: selection if any, otherwise full note body
  const textToProcess = selected || body;

  // Get note language for spelling/hyphenation (from typography)
  const noteLanguage = typo.language || "en";

  const runAI = async (action, targetLang) => {
    if (!markdown) {
      toast.error("AI actions only work in Markdown notes");
      return;
    }
    if (!isAIEnabled()) {
      toast.error("AI is not enabled. Configure it in Settings > AI");
      return;
    }

    setAiBusy(action);
    setAiAction(action);
    setAiError("");
    setAiResult("");

    try {
      const prompt = buildPrompt(action, textToProcess, targetLang, noteLanguage);
      const result = await callAI(prompt);
      setAiResult(result);
      setAiPreviewOpen(true);
    } catch (err) {
      const message = getAIErrorMessage(err);
      setAiError(message);
      toast.error(message);
    } finally {
      setAiBusy("");
    }
  };

  const handleApplyAI = (mode) => {
    if (!aiResult) return;
    if (mode === "replace") {
      run({ next: aiResult, start: selection.start, end: selection.end });
    } else if (mode === "insert") {
      run({ next: aiResult, start: selection.end, end: selection.end });
    }
    setAiResult("");
    setAiPreviewOpen(false);
    setAiAction("");
  };

  const handleCopyAI = async () => {
    if (!aiResult) return;
    try {
      await navigator.clipboard.writeText(aiResult);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Apply format painter when user makes a selection while it's active
  useEffect(() => {
    if (!formatPainterActive) return;
    const selected = selection.value.slice(selection.start, selection.end);
    if (selected) {
      handleFormatPainterApply();
      if (!formatPainterLocked) {
        setFormatPainterActive(false);
      }
    }
  }, [selection.start, selection.end, formatPainterActive, formatPainterLocked]);

  const cut = async () => {
    if (!selected) return;
    await copyText(selected);
    run({ next: "", start: selection.start, end: selection.end, text: "", caret: selection.start });
  };

  const tasks = (tool) => (s) => taskTool(s, tool);

  const handleFormatPainter = () => {
    const marks = readMarks(selection);
    if (marks) {
      writeFormatPainter(marks);
      setFormatPainterActive(true);
      setFormatPainterLocked(false);
      toast.info("Format painter active — select text to apply", 3000);
    }
  };

  const handleFormatPainterLock = () => {
    if (formatPainterActive) {
      setFormatPainterLocked(true);
      toast.info("Format painter locked — press Esc to cancel", 0);
    }
  };

  // Handle Esc to cancel locked format painter
  useEffect(() => {
    if (!formatPainterLocked) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setFormatPainterActive(false);
        setFormatPainterLocked(false);
        toast.info("Format painter cancelled", 2000);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formatPainterLocked]);

  const handleFormatPainterApply = () => {
    const marks = readFormatPainter();
    if (marks && Object.keys(marks).length > 0) {
      run(applyMarks(selection, marks));
    }
  };

  return (
    <>
      <RibbonGroup label={tr("ribbon.home.clipboard")} icon={Copy} priority={10}>
        <Btn id="home.undo" icon={Undo2} label={tr("ribbon.home.undo")} hint={tr("ribbon.home.undoHint")} onClick={() => execEditor("undo")} />
        <Btn id="home.redo" icon={Redo2} label={tr("ribbon.home.redo")} hint={tr("ribbon.home.redoHint")} onClick={() => execEditor("redo")} />
        <Btn id="home.cut" icon={Scissors} label={tr("ribbon.home.cut")} hint={tr("ribbon.home.cutHint")} disabled={!selected} disabledReason={tr("ribbon.home.selectFirst")} onClick={cut} />
        <Btn id="home.copy" icon={Copy} label={tr("ribbon.home.copy")} hint={tr("ribbon.home.copyHint")} disabled={!selected} disabledReason={tr("ribbon.home.selectFirst")} onClick={() => copyText(selected)} />
        <Btn id="home.selectAll" icon={SquareDashedMousePointer} label={tr("ribbon.home.selectAll")} hint={tr("ribbon.home.selectAllHint")} onClick={() => execEditor("selectAll")} />
        <Btn
          id="home.formatPainter"
          icon={Brush}
          label={tr("ribbon.home.formatPainter")}
          hint={tr("ribbon.home.formatPainterHint")}
          active={formatPainterActive}
          onClick={handleFormatPainter}
          onDoubleClick={handleFormatPainterLock}
        />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.font")} icon={Bold} priority={20}>
        <Btn id="home.bold" icon={Bold} hint={tr("ribbon.home.bold")} shortcut="Ctrl+B" edit={(s) => toggleWrap(s, "**")} />
        <Btn id="home.italic" icon={Italic} hint={tr("ribbon.home.italic")} shortcut="Ctrl+I" edit={toggleItalic} />
        <Btn id="home.underline" icon={Underline} hint={tr("ribbon.home.underline")} shortcut="Ctrl+U" edit={(s) => toggleWrap(s, "<u>", "</u>")} />
        <Btn id="home.strike" icon={Strikethrough} hint={tr("ribbon.home.strike")} shortcut="Ctrl+Shift+X" edit={(s) => toggleWrap(s, "~~")} />
        <Btn id="home.highlight" icon={Highlighter} hint={tr("ribbon.home.highlight")} shortcut="Ctrl+Shift+H" edit={(s) => applyAttr(s, "mark", "h", "yellow")} />
        <Btn id="home.inlineCode" icon={Code} hint={tr("ribbon.home.inlineCode")} shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
        <Btn id="home.clearFormatting" icon={Eraser} hint={tr("ribbon.home.clearFormatting")} edit={clearFormatting} />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.style")} icon={Pilcrow} priority={30}>
        <RibbonSelect
          title={tr("ribbon.home.paragraphStyle")}
          disabled={!markdown}
          value={String(level)}
          onChange={(value) => run(setHeading(selection, Number(value)))}
          options={[
            { value: "0", label: tr("ribbon.home.paragraph") },
            ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${tr("ribbon.home.heading")} ${n}` })),
          ]}
        />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.lists")} icon={List} priority={40}>
        <Btn id="home.bulletList" icon={List} hint={tr("ribbon.home.bulletList")} edit={(s) => toggleLinePrefix(s, "bullet")} />
        <Btn id="home.numberList" icon={ListOrdered} hint={tr("ribbon.home.numberList")} edit={(s) => toggleLinePrefix(s, "number")} />
        <Btn id="home.checklist" icon={ListChecks} hint={tr("ribbon.home.checklist")} edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn id="home.quote" icon={Quote} hint={tr("ribbon.home.quote")} edit={(s) => toggleLinePrefix(s, "quote")} />
        <Btn id="home.indent" icon={IndentIncrease} hint={tr("ribbon.home.indent")} edit={(s) => shiftIndent(s, 1)} />
        <Btn id="home.outdent" icon={IndentDecrease} hint={tr("ribbon.home.outdent")} edit={(s) => shiftIndent(s, -1)} />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.align")} icon={AlignLeft} priority={50}>
        {[
          ["left", AlignLeft, tr("ribbon.home.alignLeft")],
          ["center", AlignCenter, tr("ribbon.home.alignCenter")],
          ["right", AlignRight, tr("ribbon.home.alignRight")],
          ["justify", AlignJustify, tr("ribbon.home.justify")],
        ].map(([id, icon, hint]) => (
          <Btn key={id} id={`home.align${id.slice(0, 1).toUpperCase()}${id.slice(1)}`} icon={icon} hint={hint} edit={(s) => setBlock(s, { a: id })} />
        ))}
        <Btn id="home.ltr" icon={Pilcrow} label={tr("ribbon.home.ltr")} hint={tr("ribbon.home.ltrHint")} edit={(s) => setBlock(s, { dir: "ltr" })} />
        <Btn id="home.rtl" icon={FlipHorizontal2} label={tr("ribbon.home.rtl")} hint={tr("ribbon.home.rtlHint")} edit={(s) => setBlock(s, { dir: "rtl" })} />
        <Btn id="home.dirAuto" icon={MoveHorizontal} label={tr("ribbon.home.auto")} hint={tr("ribbon.home.autoHint")} edit={(s) => setBlock(s, { dir: "auto" })} />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.lines")} icon={ArrowDownAZ} priority={60}>
        <Btn id="home.sortAsc" icon={ArrowDownAZ} hint={tr("ribbon.home.sortAsc")} edit={(s) => lineTool(s, "sort-asc")} />
        <Btn id="home.sortDesc" icon={ArrowUpAZ} hint={tr("ribbon.home.sortDesc")} edit={(s) => lineTool(s, "sort-desc")} />
        <Btn id="home.reverse" icon={ArrowLeftRight} hint={tr("ribbon.home.reverseHint")} label={tr("ribbon.home.reverse")} edit={(s) => lineTool(s, "reverse")} />
        <Btn id="home.unique" icon={ListX} hint={tr("ribbon.home.uniqueHint")} label={tr("ribbon.home.unique")} edit={(s) => lineTool(s, "unique")} />
        <Btn id="home.noBlanks" icon={Minus} hint={tr("ribbon.home.noBlanksHint")} label={tr("ribbon.home.noBlanks")} edit={(s) => lineTool(s, "remove-blank")} />
        <Btn id="home.join" icon={Merge} hint={tr("ribbon.home.joinHint")} label={tr("ribbon.home.join")} edit={(s) => lineTool(s, "join")} />
        <Btn id="home.numberLines" icon={Hash} hint={tr("ribbon.home.numberLinesHint")} label={tr("ribbon.home.numberLines")} edit={(s) => lineTool(s, "number")} />
        <Btn id="home.trim" icon={WrapText} hint={tr("ribbon.home.trimHint")} label={tr("ribbon.home.trim")} edit={(s) => lineTool(s, "trim")} />
      </RibbonGroup>

      <RibbonGroup
        label={tr("ribbon.home.typography")}
        icon={Type}
        priority={1}
        collapsedRender={() => (
          <>
            <Stepper title={tr("ribbon.home.noteSize")} value={typo.size || 16} min={10} max={40} onChange={(size) => patch({ size })} format={(n) => `${n}px`} />
            <GroupMenu icon={Type} label={tr("ribbon.home.typography")} width={320}>
              {() => (
                <>
                  <MenuLabel>{tr("ribbon.home.typography")}</MenuLabel>
                  <RibbonSelect
                    title={tr("ribbon.home.noteFont")}
                    placeholder={tr("ribbon.home.noteFontPlaceholder")}
                    groups={fontGroups}
                    value={typo.font || ""}
                    onChange={(value) => (value ? patch({ font: value }) : drop("font"))}
                  />
                  <RibbonSelect
                    title={tr("ribbon.home.tracking")}
                    placeholder={tr("ribbon.home.trackingPlaceholder")}
                    options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
                    value={typo.spacing || ""}
                    onChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
                  />
                  <RibbonSelect
                    title={tr("ribbon.home.headingFont")}
                    placeholder={tr("ribbon.home.headingFontPlaceholder")}
                    groups={fontGroups}
                    value={typo.headingFont || ""}
                    onChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
                  />
                  <RibbonSelect
                    title={tr("ribbon.home.noteDirection")}
                    placeholder={tr("ribbon.home.noteDirectionDefault")}
                    options={[
                      { value: "ltr", label: tr("dir.ltr") },
                      { value: "rtl", label: tr("dir.rtl") },
                      { value: "auto", label: tr("dir.auto") },
                    ]}
                    value={typo.dir || ""}
                    onChange={(value) => (value ? patch({ dir: value }) : drop("dir"))}
                  />
                  <Btn
                    id="home.resetTypography"
                    icon={Trash2}
                    hint={tr("ribbon.home.resetTypography")}
                    disabled={false}
                    onClick={() => setTypography({})}
                  />
                </>
              )}
            </GroupMenu>
          </>
        )}
      >
        <RibbonSelect
          title={tr("ribbon.home.noteFont")}
          placeholder={tr("ribbon.home.noteFontPlaceholder")}
          groups={fontGroups}
          value={typo.font || ""}
          onChange={(value) => (value ? patch({ font: value }) : drop("font"))}
        />
        <Stepper title={tr("ribbon.home.noteSize")} value={typo.size || 16} min={10} max={40} onChange={(size) => patch({ size })} format={(n) => `${n}px`} />
        <RibbonSelect
          title={tr("ribbon.home.tracking")}
          placeholder={tr("ribbon.home.trackingPlaceholder")}
          options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
          value={typo.spacing || ""}
          onChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
        />
        <RibbonSelect
          title={tr("ribbon.home.headingFont")}
          placeholder={tr("ribbon.home.headingFontPlaceholder")}
          groups={fontGroups}
          value={typo.headingFont || ""}
          onChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
        />
        {/* Whole-note text direction: LTR, RTL or Auto (per block in the reader). */}
        <RibbonSelect
          title={tr("ribbon.home.noteDirection")}
          placeholder={tr("ribbon.home.noteDirectionDefault")}
          options={[
            { value: "ltr", label: tr("dir.ltr") },
            { value: "rtl", label: tr("dir.rtl") },
            { value: "auto", label: tr("dir.auto") },
          ]}
          value={typo.dir || ""}
          onChange={(value) => (value ? patch({ dir: value }) : drop("dir"))}
        />
        <Btn
          id="home.resetTypography"
          icon={Trash2}
          hint={tr("ribbon.home.resetTypography")}
          disabled={false}
          onClick={() => setTypography({})}
        />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.tasks")} icon={CircleCheck} priority={70}>
        {STATUS.map(([id, icon, hintKey, key, qa]) => (
          <Btn key={id} id={qa} icon={icon} label={id} hint={tr(hintKey)} shortcut={key} active={status === id} edit={(s) => toggleTask(s, id)} />
        ))}
        <Btn id="home.nextStatus" icon={ListRestart} label={tr("ribbon.home.nextStatus")} hint={tr("ribbon.home.nextStatusHint")} edit={(s) => toggleTask(s, CYCLE[taskStatusAt(body, selection.start)] || "TODO")} />
        <Btn id="home.clearStatus" icon={CircleDashed} label={tr("ribbon.home.clear")} hint={tr("ribbon.home.clearStatusHint")} edit={tasks("clear")} />
      </RibbonGroup>

      {/* AI Actions - only shown when AI is enabled and note is markdown */}
      {markdown && isAIEnabled() && (
        <RibbonGroup label={tr("ribbon.home.ai")} icon={Wand2} priority={5}>
          <Btn
            id="home.ai.translate"
            icon={Globe}
            label={tr("ribbon.home.ai.translate")}
            hint={tr("ribbon.home.ai.translateHint")}
            disabled={aiBusy || !textToProcess.trim()}
            onClick={() => runAI("translate", "en")}
          />
          <Btn
            id="home.ai.summarize"
            icon={List}
            label={tr("ribbon.home.ai.summarize")}
            hint={tr("ribbon.home.ai.summarizeHint")}
            disabled={aiBusy || !textToProcess.trim()}
            onClick={() => runAI("summarize")}
          />
          <Btn
            id="home.ai.fixGrammar"
            icon={Wand2}
            label={tr("ribbon.home.ai.fixGrammar")}
            hint={tr("ribbon.home.ai.fixGrammarHint")}
            disabled={aiBusy || !textToProcess.trim()}
            onClick={() => runAI("fixGrammar")}
          />
          <Btn
            id="home.ai.continue"
            icon={ArrowRight}
            label={tr("ribbon.home.ai.continue")}
            hint={tr("ribbon.home.ai.continueHint")}
            disabled={aiBusy || !textToProcess.trim()}
            onClick={() => runAI("continue")}
          />
          <Btn
            id="home.ai.arabicEnglish"
            icon={Languages}
            label={tr("ribbon.home.ai.arabicEnglish")}
            hint={tr("ribbon.home.ai.arabicEnglishHint")}
            disabled={aiBusy || !textToProcess.trim()}
            onClick={() => runAI(noteLanguage === "ar" ? "arabicToEnglish" : "englishToArabic")}
          />
        </RibbonGroup>
      )}

      <TagGroup format={format} />

      <RibbonGroup label={tr("ribbon.home.search")} icon={Search} priority={80}>
        <Btn
          id="home.findTags"
          icon={Search}
          label={tr("ribbon.home.findTags")}
          hint={tr("ribbon.home.findTagsHint")}
          onClick={onFindTags}
        />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.noteType")} icon={FileText} priority={90}>
        <Select value={format} onValueChange={onFormat}>
          <SelectTrigger aria-label={tr("ribbon.home.noteFormatAria")} className="h-8 rounded-md border border-border/70 bg-card/60 px-1.5 font-mono text-[10.5px] text-foreground outline-none focus:border-primary/40 min-w-[72px]">
            <SelectValue placeholder={tr("ribbon.home.noteFormatTitle")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {FORMAT_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.ids.map((id) => (
                  <SelectItem key={id} value={id}>
                    {formatLabel(id)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </RibbonGroup>

      {/* AI Preview Panel */}
      {aiPreviewOpen && aiResult && (
        <RibbonGroup label={tr("ribbon.home.ai.preview")} className="w-full" priority={0}>
          <div className="w-full space-y-2">
            <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-foreground/85">
              {aiResult}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyAI("replace")}
                disabled={aiBusy}
                className="h-8 rounded-md border border-primary/40 bg-primary/10 px-2.5 text-[12px] text-primary transition hover:bg-primary/15 disabled:opacity-50"
              >
                {tr("ribbon.home.ai.replace")}
              </button>
              <button
                type="button"
                onClick={() => handleApplyAI("insert")}
                disabled={aiBusy}
                className="h-8 rounded-md border border-border/80 px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {tr("ribbon.home.ai.insertBelow")}
              </button>
              <button
                type="button"
                onClick={handleCopyAI}
                disabled={aiBusy}
                className="h-8 rounded-md px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                {tr("ribbon.home.ai.copy")}
              </button>
              <button
                type="button"
                onClick={() => { setAiPreviewOpen(false); setAiResult(""); setAiAction(""); }}
                className="h-8 rounded-md px-2.5 text-[12px] text-muted-foreground transition hover:text-foreground"
              >
                {tr("ribbon.home.ai.discard")}
              </button>
            </div>
          </div>
        </RibbonGroup>
      )}
    </>
  );
}