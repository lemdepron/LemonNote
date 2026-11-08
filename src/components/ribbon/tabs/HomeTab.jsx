import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownAZ, ArrowUpAZ, Bold, Brush, Code, Copy, Eraser,
  FlipHorizontal2, Hash, Highlighter, IndentDecrease, IndentIncrease, Italic, List, ListChecks, ListOrdered, ListX, Merge, Minus,
  Quote, Redo2, Scissors, SquareDashedMousePointer, Strikethrough, Trash2,
  Underline, Undo2, WrapText, Pilcrow, ArrowLeftRight,
  Circle, CircleCheck, Timer, ListRestart, CircleDashed,
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
import { useState } from "react";

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
  ["TODO", Circle, "Mark the line TODO, or clear it if it already is", "Ctrl+Alt+1", "home.todo"],
  ["DOING", Timer, "Mark the line DOING, or clear it if it already is", "Ctrl+Alt+2", "home.doing"],
  ["DONE", CircleCheck, "Mark the line DONE, or clear it if it already is", "Ctrl+Alt+3", "home.done"],
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

export function HomeTab({ format, onFormat, body, noteId, noteTitle }) {
  const ctx = useRibbon();
  const { selection, markdown, run, typography: t, setTypography } = ctx;
  const level = headingAtCaret(selection.value, selection.start);
  const selected = selection.value.slice(selection.start, selection.end);
  const status = taskStatusAt(body, selection.start);
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };
  const [formatPainterActive, setFormatPainterActive] = useState(false);

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
    } else if (formatPainterActive) {
      // If double-clicked and already active, keep it active
      setFormatPainterActive(true);
    }
  };

  const handleFormatPainterApply = () => {
    const marks = readFormatPainter();
    if (marks && Object.keys(marks).length > 0) {
      run(applyMarks(selection, marks));
    }
  };

  return (
    <>
      <RibbonGroup label="Clipboard">
        <Btn id="home.undo" icon={Undo2} label="Undo" hint="Undo the last edit" onClick={() => execEditor("undo")} />
        <Btn id="home.redo" icon={Redo2} label="Redo" hint="Redo" onClick={() => execEditor("redo")} />
        <Btn id="home.cut" icon={Scissors} label="Cut" hint="Cut the selection" disabled={!selected} disabledReason="Select some text first" onClick={cut} />
        <Btn id="home.copy" icon={Copy} label="Copy" hint="Copy the selection" disabled={!selected} disabledReason="Select some text first" onClick={() => copyText(selected)} />
        <Btn id="home.selectAll" icon={SquareDashedMousePointer} label="Select all" hint="Select the whole note" onClick={() => execEditor("selectAll")} />
        <Btn
          id="home.formatPainter"
          icon={Brush}
          label="Format painter"
          hint="Copy formatting from the selection, then apply to the next selection (double-click to keep active)"
          active={formatPainterActive}
          onClick={handleFormatPainter}
          onDoubleClick={() => setFormatPainterActive(true)}
        />
      </RibbonGroup>

      <RibbonGroup label="Font">
        <Btn id="home.bold" icon={Bold} hint="Bold" shortcut="Ctrl+B" edit={(s) => toggleWrap(s, "**")} />
        <Btn id="home.italic" icon={Italic} hint="Italic" shortcut="Ctrl+I" edit={toggleItalic} />
        <Btn id="home.underline" icon={Underline} hint="Underline" shortcut="Ctrl+U" edit={(s) => toggleWrap(s, "<u>", "</u>")} />
        <Btn id="home.strike" icon={Strikethrough} hint="Strikethrough" shortcut="Ctrl+Shift+X" edit={(s) => toggleWrap(s, "~~")} />
        <Btn id="home.highlight" icon={Highlighter} hint="Highlight (yellow)" shortcut="Ctrl+Shift+H" edit={(s) => applyAttr(s, "mark", "h", "yellow")} />
        <Btn id="home.inlineCode" icon={Code} hint="Inline code" shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
        <Btn id="home.clearFormatting" icon={Eraser} hint="Clear formatting on the selection or the line" edit={clearFormatting} />
      </RibbonGroup>

      <RibbonGroup label="Style">
        <RibbonSelect
          title="Paragraph style"
          disabled={!markdown}
          value={String(level)}
          onChange={(value) => run(setHeading(selection, Number(value)))}
          options={[
            { value: "0", label: "Paragraph" },
            ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Heading ${n}` })),
          ]}
        />
      </RibbonGroup>

      <RibbonGroup label="Lists">
        <Btn id="home.bulletList" icon={List} hint="Bulleted list" edit={(s) => toggleLinePrefix(s, "bullet")} />
        <Btn id="home.numberList" icon={ListOrdered} hint="Numbered list" edit={(s) => toggleLinePrefix(s, "number")} />
        <Btn id="home.checklist" icon={ListChecks} hint="Checklist" edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn id="home.quote" icon={Quote} hint="Quote" edit={(s) => toggleLinePrefix(s, "quote")} />
        <Btn id="home.indent" icon={IndentIncrease} hint="Indent" edit={(s) => shiftIndent(s, 1)} />
        <Btn id="home.outdent" icon={IndentDecrease} hint="Outdent" edit={(s) => shiftIndent(s, -1)} />
      </RibbonGroup>

      <RibbonGroup label="Align">
        {[
          ["left", AlignLeft, "Align left", "home.alignLeft"],
          ["center", AlignCenter, "Centre", "home.alignCenter"],
          ["right", AlignRight, "Align right", "home.alignRight"],
          ["justify", AlignJustify, "Justify", "home.alignJustify"],
        ].map(([id, icon, hint, qa]) => (
          <Btn key={id} id={qa} icon={icon} hint={hint} edit={(s) => setBlock(s, { a: id })} />
        ))}
        <Btn id="home.ltr" icon={Pilcrow} label="LTR" hint="Left-to-right text direction" edit={(s) => setBlock(s, { dir: "ltr" })} />
        <Btn id="home.rtl" icon={FlipHorizontal2} label="RTL" hint="Right-to-left direction, for Arabic" edit={(s) => setBlock(s, { dir: "rtl" })} />
      </RibbonGroup>

      <RibbonGroup label="Lines">
        <Btn id="home.sortAsc" icon={ArrowDownAZ} hint="Sort the selected lines A to Z (numbers sort by value)" edit={(s) => lineTool(s, "sort-asc")} />
        <Btn id="home.sortDesc" icon={ArrowUpAZ} hint="Sort the selected lines Z to A" edit={(s) => lineTool(s, "sort-desc")} />
        <Btn id="home.reverse" icon={ArrowLeftRight} hint="Reverse the order of the selected lines" label="Reverse" edit={(s) => lineTool(s, "reverse")} />
        <Btn id="home.unique" icon={ListX} hint="Remove duplicate lines" label="Unique" edit={(s) => lineTool(s, "unique")} />
        <Btn id="home.noBlanks" icon={Minus} hint="Remove blank lines" label="No blanks" edit={(s) => lineTool(s, "remove-blank")} />
        <Btn id="home.join" icon={Merge} hint="Join the selected lines into one" label="Join" edit={(s) => lineTool(s, "join")} />
        <Btn id="home.numberLines" icon={Hash} hint="Number the selected lines" label="Number" edit={(s) => lineTool(s, "number")} />
        <Btn id="home.trim" icon={WrapText} hint="Trim spaces at the end of each line" label="Trim" edit={(s) => lineTool(s, "trim")} />
      </RibbonGroup>

      <RibbonGroup label="Typography">
        <RibbonSelect
          title="Font of the whole note"
          placeholder="Note font: default"
          groups={fontGroups}
          value={t.font || ""}
          onChange={(value) => (value ? patch({ font: value }) : drop("font"))}
        />
        <Stepper title="Note text size (px)" value={t.size || 16} min={10} max={40} onChange={(size) => patch({ size })} format={(n) => `${n}px`} />
        <RibbonSelect
          title="Letter spacing of the whole note"
          placeholder="Tracking"
          options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
          value={t.spacing || ""}
          onChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
        />
        <RibbonSelect
          title="Heading font of the whole note"
          placeholder="Heading font"
          groups={fontGroups}
          value={t.headingFont || ""}
          onChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
        />
        <Btn
          id="home.resetTypography"
          icon={Trash2}
          hint="Reset the typography of this note to the app default"
          disabled={false}
          onClick={() => setTypography({})}
        />
      </RibbonGroup>

      <RibbonGroup label="Tasks">
        {STATUS.map(([id, icon, hint, key, qa]) => (
          <Btn key={id} id={qa} icon={icon} label={id} hint={hint} shortcut={key} active={status === id} edit={(s) => toggleTask(s, id)} />
        ))}
        <Btn id="home.nextStatus" icon={ListRestart} label="Next status" hint="Cycle TODO → DOING → DONE → TODO" edit={(s) => toggleTask(s, CYCLE[taskStatusAt(body, selection.start)] || "TODO")} />
        <Btn id="home.clearStatus" icon={CircleDashed} label="Clear" hint="Remove the status words from the selected lines (or the whole note)" edit={tasks("clear")} />
      </RibbonGroup>

      <RibbonGroup label="Note type">
        <select
          value={format}
          onChange={(event) => onFormat?.(event.target.value)}
          aria-label="Note format"
          title={`The type of the whole note (now ${formatLabel(format)})`}
          className="h-8 rounded-md border border-border/70 bg-card/60 px-1.5 font-mono text-[10.5px] text-foreground outline-none focus:border-primary/40 min-w-[72px]"
        >
          {FORMAT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.ids.map((id) => (
                <option key={id} value={id}>
                  {formatLabel(id)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </RibbonGroup>
    </>
  );
}