import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownAZ, ArrowUpAZ, ArrowLeftRight, ArrowRightToLine, Bold, Brush, Code, Copy, Eraser,
  FlipHorizontal2, Hash, Highlighter, IndentDecrease, IndentIncrease, Italic, List, ListChecks, ListOrdered, ListX, Minus,
  Quote, Redo2, Scissors, SquareDashedMousePointer, Strikethrough, RotateCcw,
  Underline, Undo2, Pilcrow,
  Circle, CircleCheck, Timer, ListRestart, CircleDashed,
  Globe, Languages, Wand2,
  Type, FileText,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { FORMAT_GROUPS, formatLabel } from "@/lib/note-formats";
import { Btn, RibbonSelect, Stepper, useRibbon } from "@/components/ribbon/RibbonKit";
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
} from "@/components/ui/select-compact";

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

function taskHint(tr, baseHintKey, shortcut, label) {
  return `${tr(baseHintKey)} · ${shortcut} · ${label}`;
}

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

export function HomeTab({ format, onFormat, body, noteId, noteTitle }) {
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
      toast.error(tr("ribbon.home.ai.markdownOnly"));
      return;
    }
    if (!isAIEnabled()) {
      toast.error(tr("ribbon.home.ai.notEnabled"));
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
      toast.success(tr("ribbon.home.ai.copied"));
    } catch {
      toast.error(tr("ribbon.home.ai.copyFailed"));
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
      toast.info(tr("ribbon.home.formatPainterActive"), 3000);
    }
  };

  const handleFormatPainterLock = () => {
    if (formatPainterActive) {
      setFormatPainterLocked(true);
      toast.info(tr("ribbon.home.formatPainterLocked"), 0);
    }
  };

  // Handle Esc to cancel locked format painter
  useEffect(() => {
    if (!formatPainterLocked) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setFormatPainterActive(false);
        setFormatPainterLocked(false);
        toast.info(tr("ribbon.home.formatPainterCancelled"), 2000);
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
      <RibbonGroup
        label={tr("ribbon.home.edit")}
        icon={Copy}
        priority={90}
        more={
          <>
            <Btn
              id="home.formatPainter"
              icon={Brush}
              label={tr("ribbon.home.formatPainter")}
              hint={tr("ribbon.home.formatPainterHint")}
              active={formatPainterActive}
              onClick={handleFormatPainter}
              onDoubleClick={handleFormatPainterLock}
            />
            <Btn id="home.inlineCode" icon={Code} hint={tr("ribbon.home.inlineCode")} shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
            <Btn id="home.clearFormatting" icon={Eraser} hint={tr("ribbon.home.clearFormatting")} edit={clearFormatting} />
          </>
        }
      >
        <Btn id="home.undo" icon={Undo2} label={tr("ribbon.home.undo")} hint={tr("ribbon.home.undoHint")} onClick={() => execEditor("undo")} />
        <Btn id="home.redo" icon={Redo2} label={tr("ribbon.home.redo")} hint={tr("ribbon.home.redoHint")} onClick={() => execEditor("redo")} />
        <Btn id="home.cut" icon={Scissors} label={tr("ribbon.home.cut")} hint={tr("ribbon.home.cutHint")} disabled={!selected} disabledReason={tr("ribbon.home.selectFirst")} onClick={cut} />
        <Btn id="home.copy" icon={Copy} label={tr("ribbon.home.copy")} hint={tr("ribbon.home.copyHint")} disabled={!selected} disabledReason={tr("ribbon.home.selectFirst")} onClick={() => copyText(selected)} />
        <Btn id="home.selectAll" icon={SquareDashedMousePointer} label={tr("ribbon.home.selectAll")} hint={tr("ribbon.home.selectAllHint")} onClick={() => execEditor("selectAll")} />
        <Btn id="home.bold" icon={Bold} hint={tr("ribbon.home.bold")} shortcut="Ctrl+B" edit={(s) => toggleWrap(s, "**")} />
        <Btn id="home.italic" icon={Italic} hint={tr("ribbon.home.italic")} shortcut="Ctrl+I" edit={toggleItalic} />
        <Btn id="home.underline" icon={Underline} hint={tr("ribbon.home.underline")} shortcut="Ctrl+U" edit={(s) => toggleWrap(s, "<u>", "</u>")} />
        <Btn id="home.strike" icon={Strikethrough} hint={tr("ribbon.home.strike")} shortcut="Ctrl+Shift+X" edit={(s) => toggleWrap(s, "~~")} />
        <Btn id="home.highlight" icon={Highlighter} hint={tr("ribbon.home.highlight")} shortcut="Ctrl+Shift+H" edit={(s) => applyAttr(s, "mark", "h", "yellow")} />
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.style")} icon={Pilcrow} priority={50}>
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

      <RibbonGroup
        label={tr("ribbon.home.lists")}
        icon={List}
        priority={70}
        more={
          <>
            <Btn id="home.outdent" icon={IndentDecrease} hint={tr("ribbon.home.outdent")} edit={(s) => shiftIndent(s, -1)} />
          </>
        }
      >
        <Btn id="home.bulletList" icon={List} hint={tr("ribbon.home.bulletList")} edit={(s) => toggleLinePrefix(s, "bullet")} />
        <Btn id="home.numberList" icon={ListOrdered} hint={tr("ribbon.home.numberList")} edit={(s) => toggleLinePrefix(s, "number")} />
        <Btn id="home.checklist" icon={ListChecks} hint={tr("ribbon.home.checklist")} edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn id="home.quote" icon={Quote} hint={tr("ribbon.home.quote")} edit={(s) => toggleLinePrefix(s, "quote")} />
        <Btn id="home.indent" icon={IndentIncrease} hint={tr("ribbon.home.indent")} edit={(s) => shiftIndent(s, 1)} />
      </RibbonGroup>

      <RibbonGroup
        label={tr("ribbon.home.align")}
        icon={AlignLeft}
        priority={60}
        more={
          <>
            <Btn id="home.rtl" icon={FlipHorizontal2} label={tr("ribbon.home.rtl")} hint={tr("ribbon.home.rtlHint")} edit={(s) => setBlock(s, { dir: "rtl" })} />
            <Btn id="home.dirAuto" icon={ArrowLeftRight} label={tr("ribbon.home.auto")} hint={tr("ribbon.home.autoHint")} edit={(s) => setBlock(s, { dir: "auto" })} />
          </>
        }
      >
        {[
          ["left", AlignLeft, tr("ribbon.home.alignLeft")],
          ["center", AlignCenter, tr("ribbon.home.alignCenter")],
          ["right", AlignRight, tr("ribbon.home.alignRight")],
          ["justify", AlignJustify, tr("ribbon.home.justify")],
        ].map(([id, icon, hint]) => (
          <Btn key={id} id={`home.align${id.slice(0, 1).toUpperCase()}${id.slice(1)}`} icon={icon} hint={hint} edit={(s) => setBlock(s, { a: id })} />
        ))}
        <Btn id="home.ltr" icon={Type} label={tr("ribbon.home.ltr")} hint={tr("ribbon.home.ltrHint")} edit={(s) => setBlock(s, { dir: "ltr" })} />
      </RibbonGroup>

      <RibbonGroup
        label={tr("ribbon.home.lines")}
        icon={ArrowDownAZ}
        priority={40}
        more={
          <>
            <Btn id="home.numberLines" icon={Hash} hint={tr("ribbon.home.numberLinesHint")} label={tr("ribbon.home.numberLines")} edit={(s) => lineTool(s, "number")} />
            <Btn id="home.trim" icon={Scissors} hint={tr("ribbon.home.trimHint")} label={tr("ribbon.home.trim")} edit={(s) => lineTool(s, "trim")} />
          </>
        }
      >
        <Btn id="home.sortAsc" icon={ArrowDownAZ} hint={tr("ribbon.home.sortAsc")} edit={(s) => lineTool(s, "sort-asc")} />
        <Btn id="home.sortDesc" icon={ArrowUpAZ} hint={tr("ribbon.home.sortDesc")} edit={(s) => lineTool(s, "sort-desc")} />
        <Btn id="home.reverse" icon={ArrowLeftRight} hint={tr("ribbon.home.reverseHint")} label={tr("ribbon.home.reverse")} edit={(s) => lineTool(s, "reverse")} />
        <Btn id="home.unique" icon={ListX} hint={tr("ribbon.home.uniqueHint")} label={tr("ribbon.home.unique")} edit={(s) => lineTool(s, "unique")} />
        <Btn id="home.noBlanks" icon={Minus} hint={tr("ribbon.home.noBlanksHint")} label={tr("ribbon.home.noBlanks")} edit={(s) => lineTool(s, "remove-blank")} />
      </RibbonGroup>

      <RibbonGroup
        label={tr("ribbon.home.typography")}
        icon={Type}
        priority={1}
        more={
          <>
            <Btn
              id="home.resetTypography"
              icon={RotateCcw}
              hint={tr("ribbon.home.resetTypography")}
              disabled={false}
              onClick={() => setTypography({})}
            />
          </>
        }
      >
        <Select
          value={typo.font || ""}
          onValueChange={(value) => (value ? patch({ font: value }) : drop("font"))}
        >
          <SelectTrigger aria-label={tr("ribbon.home.noteFont")} className="min-w-[140px]">
            <SelectValue placeholder={tr("ribbon.home.noteFontPlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="">{tr("ribbon.home.noteFontPlaceholder")}</SelectItem>
            {fontGroups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Stepper
          title={tr("ribbon.home.noteSize")}
          value={typo.size || 16}
          min={10}
          max={40}
          onChange={(size) => patch({ size })}
          format={(n) => `${n}px`}
          style={{ gridRow: "span 2" }}
        />
        <Select
          value={typo.spacing || ""}
          onValueChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
        >
          <SelectTrigger aria-label={tr("ribbon.home.tracking")} className="min-w-[100px]">
            <SelectValue placeholder={tr("ribbon.home.trackingPlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="">{tr("ribbon.home.trackingPlaceholder")}</SelectItem>
            {LETTER_SPACING.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typo.headingFont || ""}
          onValueChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
        >
          <SelectTrigger aria-label={tr("ribbon.home.headingFont")} className="min-w-[140px]">
            <SelectValue placeholder={tr("ribbon.home.headingFontPlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="">{tr("ribbon.home.headingFontPlaceholder")}</SelectItem>
            {fontGroups.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typo.dir || ""}
          onValueChange={(value) => (value ? patch({ dir: value }) : drop("dir"))}
        >
          <SelectTrigger aria-label={tr("ribbon.home.noteDirection")} className="min-w-[100px]">
            <SelectValue placeholder={tr("ribbon.home.noteDirectionDefault")} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="">{tr("ribbon.home.noteDirectionDefault")}</SelectItem>
            <SelectItem value="ltr">{tr("dir.ltr")}</SelectItem>
            <SelectItem value="rtl">{tr("dir.rtl")}</SelectItem>
            <SelectItem value="auto">{tr("dir.auto")}</SelectItem>
          </SelectContent>
        </Select>
      </RibbonGroup>

      <RibbonGroup label={tr("ribbon.home.tasks")} icon={CircleCheck} priority={30}>
        {STATUS.map(([id, icon, hintKey, key, qa]) => (
          <Btn key={id} id={qa} icon={icon} hint={taskHint(tr, hintKey, key, id)} shortcut={key} active={status === id} edit={(s) => toggleTask(s, id)} />
        ))}
        <Btn id="home.nextStatus" icon={ListRestart} hint={tr("ribbon.home.nextStatusHint")} edit={(s) => toggleTask(s, CYCLE[taskStatusAt(body, selection.start)] || "TODO")} />
        <Btn id="home.clearStatus" icon={CircleDashed} hint={tr("ribbon.home.clearStatusHint")} edit={tasks("clear")} />
      </RibbonGroup>

      {/* AI Actions - only shown when AI is enabled and note is markdown */}
      {markdown && isAIEnabled() && (
        <RibbonGroup label={tr("ribbon.home.ai")} icon={Wand2} priority={20}>
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
            icon={FileText}
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
            icon={ArrowRightToLine}
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

      <RibbonGroup label={tr("ribbon.home.noteType")} icon={FileText} priority={10}>
        <Select value={format} onValueChange={onFormat}>
          <SelectTrigger aria-label={tr("ribbon.home.noteFormatAria")} className="min-w-[72px]">
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