import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowDownAZ, ArrowUpAZ, Bold, CaseSensitive, Code, Copy, Eraser,
  FlipHorizontal2, Highlighter, IndentDecrease, IndentIncrease, Italic, List, ListChecks, ListOrdered, ListX, Merge, Minus,
  Quote, Redo2, Scissors, SquareDashedMousePointer, Strikethrough, Subscript, Superscript, Trash2,
  Type, Underline, Undo2, WrapText, Keyboard, Hash, Pilcrow, ArrowLeftRight, Space,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { FORMAT_GROUPS, formatLabel } from "@/lib/note-formats";
import { Btn, MenuItem, MenuLabel, RibbonMenu, RibbonSelect, Stepper, Swatches, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText, execEditor } from "@/lib/editor-bridge";
import {
  applyAttr, changeCase, clearFormatting, lineTool, setBlock, setHeading, shiftIndent, toggleItalic, toggleLinePrefix, toggleWrap,
} from "@/lib/format-actions";
import {
  COLORS, FONTS, FONT_GROUPS, HIGHLIGHTS, LETTER_SPACING, LINE_HEIGHTS, PARAGRAPH_GAPS, SIZES,
} from "@/lib/text-style";

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

/* ---------------------------------- Home ---------------------------------- */

export function HomeTab({ format, onFormat }) {
  const ctx = useRibbon();
  const { selection, markdown, run } = ctx;
  const level = headingAtCaret(selection.value, selection.start);
  const selected = selection.value.slice(selection.start, selection.end);

  const cut = async () => {
    if (!selected) return;
    await copyText(selected);
    run({ next: "", start: selection.start, end: selection.end, text: "", caret: selection.start });
  };

  return (
    <>
      <RibbonGroup label="Clipboard">
        <Btn icon={Undo2} label="Undo" hint="Undo the last edit" onClick={() => execEditor("undo")} />
        <Btn icon={Redo2} label="Redo" hint="Redo" onClick={() => execEditor("redo")} />
        <Btn icon={Scissors} label="Cut" hint="Cut the selection" disabled={!selected} disabledReason="Select some text first" onClick={cut} />
        <Btn icon={Copy} label="Copy" hint="Copy the selection" disabled={!selected} disabledReason="Select some text first" onClick={() => copyText(selected)} />
        <Btn icon={SquareDashedMousePointer} label="Select all" hint="Select the whole note" onClick={() => execEditor("selectAll")} />
      </RibbonGroup>

      <RibbonGroup label="Font">
        <Btn icon={Bold} hint="Bold" shortcut="Ctrl+B" edit={(s) => toggleWrap(s, "**")} />
        <Btn icon={Italic} hint="Italic" shortcut="Ctrl+I" edit={toggleItalic} />
        <Btn icon={Underline} hint="Underline" shortcut="Ctrl+U" edit={(s) => toggleWrap(s, "<u>", "</u>")} />
        <Btn icon={Strikethrough} hint="Strikethrough" shortcut="Ctrl+Shift+X" edit={(s) => toggleWrap(s, "~~")} />
        <Btn icon={Highlighter} hint="Highlight (yellow)" shortcut="Ctrl+Shift+H" edit={(s) => applyAttr(s, "mark", "h", "yellow")} />
        <Btn icon={Code} hint="Inline code" shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
        <Btn icon={Eraser} hint="Clear formatting on the selection or the line" edit={clearFormatting} />
      </RibbonGroup>

      <RibbonGroup label="Style">
        <RibbonSelect
          title="Paragraph style"
          width={128}
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
        <Btn icon={List} hint="Bulleted list" edit={(s) => toggleLinePrefix(s, "bullet")} />
        <Btn icon={ListOrdered} hint="Numbered list" edit={(s) => toggleLinePrefix(s, "number")} />
        <Btn icon={ListChecks} hint="Checklist" edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn icon={Quote} hint="Quote" edit={(s) => toggleLinePrefix(s, "quote")} />
        <Btn icon={IndentIncrease} hint="Indent" edit={(s) => shiftIndent(s, 1)} />
        <Btn icon={IndentDecrease} hint="Outdent" edit={(s) => shiftIndent(s, -1)} />
      </RibbonGroup>

      <RibbonGroup label="Note type">
        <select
          value={format}
          onChange={(event) => onFormat?.(event.target.value)}
          aria-label="Note format"
          title={`The type of the whole note (now ${formatLabel(format)})`}
          className="h-8 w-[128px] shrink-0 rounded-md border border-border/70 bg-card/60 px-1.5 font-mono text-[10.5px] text-foreground outline-none focus:border-primary/40"
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

/* --------------------------------- Format --------------------------------- */

export function FormatTab() {
  const { selection, markdown, run, typography, setTypography } = useRibbon();
  const t = typography;
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };

  return (
    <>
      <RibbonGroup label="Selection font">
        <RibbonSelect
          title="Font of the selected text"
          width={150}
          disabled={!markdown}
          placeholder="Font…"
          groups={fontGroups}
          value=""
          onChange={(value) => value && run(applyAttr(selection, "span", "f", value))}
        />
        <RibbonSelect
          title="Size of the selected text (px)"
          width={72}
          disabled={!markdown}
          placeholder="Size"
          options={SIZES.map((n) => ({ value: String(n), label: String(n) }))}
          value=""
          onChange={(value) => value && run(applyAttr(selection, "span", "s", value))}
        />
        <RibbonMenu icon={Type} label="Color" hint="Text colour">
          {(close) => (
            <>
              <MenuLabel>Text colour</MenuLabel>
              <Swatches items={COLORS} onPick={(id) => { run(applyAttr(selection, "span", "c", id)); close(); }} />
              <MenuItem onClick={() => { run(applyAttr(selection, "span", "c", null)); close(); }}>Remove colour</MenuItem>
            </>
          )}
        </RibbonMenu>
        <RibbonMenu icon={Highlighter} label="Highlight" hint="Highlight colour">
          {(close) => (
            <>
              <MenuLabel>Highlight</MenuLabel>
              <Swatches items={HIGHLIGHTS} onPick={(id) => { run(applyAttr(selection, "mark", "h", id)); close(); }} />
              <MenuItem onClick={() => { run(applyAttr(selection, "mark", "h", null)); close(); }}>Remove highlight</MenuItem>
            </>
          )}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Effects">
        <Btn icon={Bold} hint="Bold" edit={(s) => toggleWrap(s, "**")} />
        <Btn icon={Italic} hint="Italic" edit={toggleItalic} />
        <Btn icon={Underline} hint="Underline" edit={(s) => toggleWrap(s, "<u>", "</u>")} />
        <Btn icon={Strikethrough} hint="Strikethrough" edit={(s) => toggleWrap(s, "~~")} />
        <Btn icon={Superscript} hint="Superscript" edit={(s) => toggleWrap(s, "<sup>", "</sup>")} />
        <Btn icon={Subscript} hint="Subscript" edit={(s) => toggleWrap(s, "<sub>", "</sub>")} />
        <Btn icon={CaseSensitive} hint="Small caps" edit={(s) => applyAttr(s, "span", "sc", null)} />
        <Btn icon={Keyboard} hint="Keyboard key look" edit={(s) => toggleWrap(s, "<kbd>", "</kbd>")} />
        <Btn icon={Eraser} hint="Clear formatting" edit={clearFormatting} />
      </RibbonGroup>

      <RibbonGroup label="Spacing and case">
        <RibbonSelect
          title="Letter spacing of the selected text"
          width={104}
          disabled={!markdown}
          placeholder="Spacing…"
          options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
          value=""
          onChange={(value) => value && run(applyAttr(selection, "span", "ls", value))}
        />
        <RibbonMenu icon={CaseSensitive} label="Case" hint="Change letter case">
          {(close) =>
            [
              ["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"], ["sentence", "Sentence case"], ["toggle", "tOGGLE cASE"],
            ].map(([mode, text]) => (
              <MenuItem key={mode} onClick={() => { run(changeCase(selection, mode)); close(); }}>{text}</MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Whole-note typography">
        <RibbonSelect
          title="Font of the whole note"
          width={140}
          placeholder="Note font: default"
          groups={fontGroups}
          value={t.font || ""}
          onChange={(value) => (value ? patch({ font: value }) : drop("font"))}
        />
        <Stepper title="Note text size (px)" value={t.size || 16} min={10} max={40} onChange={(size) => patch({ size })} format={(n) => `${n}px`} />
        <RibbonSelect
          title="Letter spacing of the whole note"
          width={96}
          placeholder="Tracking"
          options={LETTER_SPACING.map((item) => ({ value: item.id, label: item.label }))}
          value={t.spacing || ""}
          onChange={(value) => (value ? patch({ spacing: value }) : drop("spacing"))}
        />
        <RibbonSelect
          title="Heading font of the whole note"
          width={140}
          placeholder="Heading font"
          groups={fontGroups}
          value={t.headingFont || ""}
          onChange={(value) => (value ? patch({ headingFont: value }) : drop("headingFont"))}
        />
        <Btn
          icon={Trash2}
          hint="Reset the typography of this note to the app default"
          disabled={false}
          onClick={() => setTypography({})}
        />
      </RibbonGroup>
    </>
  );
}

/* -------------------------------- Paragraph -------------------------------- */

const ALIGNS = [
  ["left", AlignLeft, "Align left"],
  ["center", AlignCenter, "Centre"],
  ["right", AlignRight, "Align right"],
  ["justify", AlignJustify, "Justify"],
];

export function ParagraphTab() {
  const { typography: t, setTypography } = useRibbon();
  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };

  return (
    <>
      <RibbonGroup label="Align selected lines">
        {ALIGNS.map(([id, icon, hint]) => (
          <Btn key={id} icon={icon} hint={hint} edit={(s) => setBlock(s, { a: id })} />
        ))}
        <Btn icon={Pilcrow} label="LTR" hint="Left-to-right text direction" edit={(s) => setBlock(s, { dir: "ltr" })} />
        <Btn icon={FlipHorizontal2} label="RTL" hint="Right-to-left direction, for Arabic" edit={(s) => setBlock(s, { dir: "rtl" })} />
      </RibbonGroup>

      <RibbonGroup label="Lists">
        <Btn icon={List} hint="Bulleted list" edit={(s) => toggleLinePrefix(s, "bullet")} />
        <Btn icon={ListOrdered} hint="Numbered list" edit={(s) => toggleLinePrefix(s, "number")} />
        <Btn icon={ListChecks} hint="Checklist" edit={(s) => toggleLinePrefix(s, "check")} />
        <Btn icon={Quote} hint="Quote" edit={(s) => toggleLinePrefix(s, "quote")} />
        <Btn icon={IndentIncrease} hint="Indent" edit={(s) => shiftIndent(s, 1)} />
        <Btn icon={IndentDecrease} hint="Outdent" edit={(s) => shiftIndent(s, -1)} />
      </RibbonGroup>

      <RibbonGroup label="Whole-note layout">
        <RibbonSelect
          title="Line spacing of the whole note"
          width={104}
          placeholder="Line spacing"
          options={LINE_HEIGHTS.map((n) => ({ value: String(n), label: `Lines ${n}` }))}
          value={t.lineHeight ? String(t.lineHeight) : ""}
          onChange={(value) => (value ? patch({ lineHeight: Number(value) }) : drop("lineHeight"))}
        />
        <RibbonSelect
          title="Space between paragraphs"
          width={112}
          placeholder="Para. gap"
          options={PARAGRAPH_GAPS.map((n) => ({ value: String(n), label: `Gap ${n}em` }))}
          value={t.gap !== undefined ? String(t.gap) : ""}
          onChange={(value) => (value ? patch({ gap: Number(value) }) : drop("gap"))}
        />
        <RibbonSelect
          title="Text alignment of the whole note"
          width={96}
          placeholder="Align"
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Centre" },
            { value: "right", label: "Right" },
            { value: "justify", label: "Justify" },
          ]}
          value={t.align || ""}
          onChange={(value) => (value ? patch({ align: value }) : drop("align"))}
        />
        <RibbonSelect
          title="Direction of the whole note"
          width={96}
          placeholder="Direction"
          options={[
            { value: "ltr", label: "LTR" },
            { value: "rtl", label: "RTL (Arabic)" },
          ]}
          value={t.dir || ""}
          onChange={(value) => (value ? patch({ dir: value }) : drop("dir"))}
        />
        <Btn
          icon={ArrowLeftRight}
          label="First-line indent"
          hint="Indent the first line of every paragraph in the reader"
          active={Boolean(t.indent)}
          disabled={false}
          onClick={() => (t.indent ? drop("indent") : patch({ indent: true }))}
        />
        <Btn
          icon={Space}
          label="Drop cap"
          hint="Large first letter on the first paragraph in the reader"
          active={Boolean(t.dropCap)}
          disabled={false}
          onClick={() => (t.dropCap ? drop("dropCap") : patch({ dropCap: true }))}
        />
      </RibbonGroup>

      <RibbonGroup label="Lines">
        <Btn icon={ArrowDownAZ} hint="Sort the selected lines A to Z (numbers sort by value)" edit={(s) => lineTool(s, "sort-asc")} />
        <Btn icon={ArrowUpAZ} hint="Sort the selected lines Z to A" edit={(s) => lineTool(s, "sort-desc")} />
        <Btn icon={ArrowLeftRight} hint="Reverse the order of the selected lines" label="Reverse" edit={(s) => lineTool(s, "reverse")} />
        <Btn icon={ListX} hint="Remove duplicate lines" label="Unique" edit={(s) => lineTool(s, "unique")} />
        <Btn icon={Minus} hint="Remove blank lines" label="No blanks" edit={(s) => lineTool(s, "remove-blank")} />
        <Btn icon={Merge} hint="Join the selected lines into one" label="Join" edit={(s) => lineTool(s, "join")} />
        <Btn icon={Hash} hint="Number the selected lines" label="Number" edit={(s) => lineTool(s, "number")} />
        <Btn icon={WrapText} hint="Trim spaces at the end of each line" label="Trim" edit={(s) => lineTool(s, "trim")} />
      </RibbonGroup>
    </>
  );
}

