import { useState } from "react";
import {
  AtSign, Braces, ChevronsDownUp, Footprints, Hash, ImagePlus, Link, Link2, ListOrdered, ListTree, MessageSquareQuote,
  Minus, Omega, SquareCode, TextQuote, Clock, CornerDownLeft, CalendarPlus, CalendarClock, CalendarCheck, CalendarRange, CalendarDays,
  BookOpenCheck, ArrowLeft, ArrowRight,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import TablePicker from "@/components/ribbon/TablePicker";
import CardComposer from "@/components/ribbon/CardComposer";
import { Btn, MenuItem, MenuLabel, RibbonMenu, TextGrid, useRibbon } from "@/components/ribbon/RibbonKit";
import {
  fenceAt, footnoteParts, insertBlock, linkWithUrl, outlineOf, toggleWrap, wikiLink, wrapSelectionInFence,
} from "@/lib/format-actions";
import { insertText, tableInsert } from "@/lib/ribbon-actions";
import { DATE_FORMATS, JOURNAL_TEMPLATES, monthKey, monthlyTemplate, neighbourTitle, weekKey, weeklyTemplate } from "@/lib/journal-tools";
import { shiftDay } from "@/lib/journal";
import { SYMBOLS } from "@/lib/text-style";
import { ALL_FENCE_LANGUAGES, FENCE_GROUPS, QUICK_LANGUAGES, fenceLabel } from "@/lib/code-fence-languages";
import { LANGUAGES } from "@/lib/code-languages";
import { readPref, writePref } from "@/lib/preferences";
import { shortcutLabel } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { JOURNAL_TEMPLATE, dateKey } from "@/lib/journal";
import { db } from "@/api/localDb";
import { useNavigate } from "react-router-dom";

const FIELD =
  "h-8 w-full rounded-md border border-border/80 bg-background/60 px-2 text-[12.5px] text-foreground outline-none focus:border-primary/40";

/** A popover with one text field and an Insert button. */
function UrlMenu({ id, icon, label, hint, placeholder, build, type = "text" }) {
  const { selection, run } = useRibbon();
  const [value, setValue] = useState("");
  return (
    <RibbonMenu id={id} icon={icon} label={label} hint={hint} width={300}>
      {(close) => (
        <form
          className="space-y-2 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            const text = value.trim();
            if (!text) return;
            run(build(selection, text));
            setValue("");
            close();
          }}
        >
          <input autoFocus type={type} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className={FIELD} />
          <button type="submit" className="h-8 w-full rounded-md bg-primary/90 text-[12px] font-medium text-primary-foreground hover:bg-primary">
            Insert
          </button>
        </form>
      )}
    </RibbonMenu>
  );
}

const CALLOUTS = [
  ["Note", "Note"],
  ["Tip", "Tip"],
  ["Important", "Important"],
  ["Warning", "Warning"],
  ["Danger", "Danger"],
];

/* --------------------------------- Insert --------------------------------- */

export function InsertTab({ onPickImage, signals, shortcuts, body, noteId, noteTitle }) {
  const navigate = useNavigate();
  const { selection, run, value } = useRibbon();
  const now = () => new Date();

  const goTo = async (title, template, tag = "journal") => {
    const found = await db.entities.Note.filter({ title, trashed: { $ne: true } }, { limit: 1 });
    const note = found?.items?.[0] || (await db.entities.Note.create({ title, body: template, tags: [tag] }));
    navigate(`/note/${note.id}`);
  };

  const today = dateKey();
  const prev = neighbourTitle(noteTitle, -1);
  const next = neighbourTitle(noteTitle, 1);

  const block = fenceAt(value, selection.start);
  const active = block ? block.lang || "plain" : readPref("codeBlockLanguage", "plain");
  const inBlock = Boolean(block);
  const needBlock = "Put the cursor inside a code block first.";
  const [language, setLanguage] = useState(() => readPref("codeBlockLanguage", "plain"));
  const [filter, setFilter] = useState("");

  const choose = (id) => {
    setLanguage(id);
    writePref("codeBlockLanguage", id);
  };

  const insertFence = (id) => {
    choose(id);
    const wrapped = wrapSelectionInFence(selection, id);
    if (wrapped) return run(wrapped);
    const snippet = `\`\`\`${id}\n\n\`\`\``;
    run(insertBlock(selection, snippet, id.length + 4));
  };

  const matches = (label, id) => !filter || `${label} ${id}`.toLowerCase().includes(filter.toLowerCase());
  const snippets = LANGUAGES.filter((item) => item.template);

  return (
    <>
      <RibbonGroup label="Pictures">
        <Btn id="insert.image" icon={ImagePlus} label="Image file" hint="Insert an image from your computer" shortcut="Ctrl+Alt+I" onClick={onPickImage} />
        <UrlMenu
          id="insert.imageUrl"
          icon={Link2}
          label="Image URL"
          hint="Insert an image from a web address"
          placeholder="https://…/picture.png"
          build={(s, url) => insertText(s, `![${s.value.slice(s.start, s.end) || "image"}](${url})`)}
        />
      </RibbonGroup>

      <RibbonGroup label="Links">
        <Btn id="insert.noteLink" icon={Link2} label="Note link" hint="Link another note with [[ ]]" edit={wikiLink} />
        <UrlMenu id="insert.webLink" icon={Link} label="Web link" hint="Turn the selection into a web link" placeholder="https://example.com" build={linkWithUrl} />
        <UrlMenu
          id="insert.email"
          icon={AtSign}
          label="Email"
          hint="Insert an email link"
          placeholder="name@example.com"
          build={(s, mail) => linkWithUrl(s, `mailto:${mail}`)}
        />
        <UrlMenu id="insert.tag" icon={Hash} label="Tag" hint="Insert a #tag" placeholder="tag-name" build={(s, tag) => insertText(s, `#${tag.replace(/^#/, "")} `)} />
      </RibbonGroup>

      <RibbonGroup label="Blocks">
        <Btn id="insert.divider" icon={Minus} label="Divider" hint="Horizontal line" edit={(s) => insertBlock(s, "---")} />
        <RibbonMenu id="insert.callout" icon={MessageSquareQuote} label="Callout" hint="Highlighted note box" width={200}>
          {(close) =>
            CALLOUTS.map(([id, text]) => (
              <MenuItem
                key={id}
                onClick={() => {
                  const bodyText = selection.value.slice(selection.start, selection.end);
                  const snippet = `> **${text}**\n> ${bodyText || ""}`;
                  run(insertBlock(selection, snippet, snippet.length));
                  close();
                }}
              >
                {text}
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <Btn
          id="insert.collapsible"
          icon={ChevronsDownUp}
          label="Collapsible"
          hint="A section that opens and closes"
          edit={(s) => insertBlock(s, "<details>\n<summary>Title</summary>\n\nHidden text\n\n</details>", "<details>\n<summary>".length)}
        />
        <Btn
          id="insert.footnote"
          icon={Footprints}
          label="Footnote"
          hint="Add a footnote marker here and its text at the end of the note"
          onClick={() => {
            const { ref, definition } = footnoteParts(value);
            const withRef = insertText(selection, ref);
            const next = withRef.next.replace(/\n*$/, "") + `\n\n${definition}`;
            run({ next, start: 0, end: value.length, text: next, caret: next.length });
          }}
        />
        <Btn id="insert.lineBreak" icon={CornerDownLeft} label="Line break" hint="Force a new line inside a paragraph" edit={(s) => insertText(s, "<br>\n")} />
        <Btn
          id="insert.outline"
          icon={ListTree}
          label="Outline"
          hint="Insert a list of this note's headings"
          disabled={!outlineOf(value)}
          disabledReason="Add some # headings first"
          edit={(s) => insertBlock(s, outlineOf(value))}
        />
        <Btn id="insert.quoteBlock" icon={TextQuote} label="Quote" hint="Block quote" edit={(s) => insertBlock(s, "> ", 2)} />
      </RibbonGroup>

      <RibbonGroup label="Symbols">
        <RibbonMenu id="insert.symbols" icon={Omega} label="Symbols" hint="Special characters" width={330}>
          {(close) =>
            SYMBOLS.map((group) => (
              <div key={group.group}>
                <MenuLabel>{group.group}</MenuLabel>
                <TextGrid
                  items={group.items}
                  columns={9}
                  onPick={(symbol) => {
                    run(insertText(selection, symbol));
                    close();
                  }}
                />
              </div>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Code block">
        <RibbonMenu id="insert.codeBlock" icon={SquareCode} label={`Block: ${fenceLabel(active)}`} hint="Insert a fenced code block; wraps the selection when there is one" width={320} shortcut="Ctrl+Alt+C">
          {(close) => (
            <>
              <input
                autoFocus
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={`Search ${ALL_FENCE_LANGUAGES.length} languages…`}
                className={cn(FIELD, "mb-1")}
              />
              {FENCE_GROUPS.map((group) => {
                const items = group.items.filter(([id, label]) => matches(label, id));
                if (!items.length) return null;
                return (
                  <div key={group.label}>
                    <MenuLabel>{group.label}</MenuLabel>
                    <div className="grid grid-cols-3 gap-1 p-1">
                      {items.map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            insertFence(id);
                            close();
                          }}
                          className={cn(
                            "h-7 truncate rounded-md border px-2 text-left text-[11.5px] transition",
                            active === id
                              ? "border-primary/50 bg-primary/15 text-primary"
                              : "border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </RibbonMenu>
        {QUICK_LANGUAGES.map(([id, label]) => (
          <Btn key={id} id={`insert.fence.${id}`} label={label} hint={`Insert a ${fenceLabel(id)} code block`} onClick={() => insertFence(id)} showLabel />
        ))}
        <Btn id="insert.inlineCode" icon={Braces} label="Inline" hint="Inline code" shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
      </RibbonGroup>

      <RibbonGroup label="Table">
        <TablePicker
          id="insert.table"
          onInsert={(rows, columns) => run(tableInsert(selection, rows, columns))}
          disabled={false}
          shortcut={shortcutLabel(shortcuts.table)}
          openSignal={signals.table}
        />
      </RibbonGroup>

      <RibbonGroup label="Time and calendar">
        <Btn id="insert.today" icon={CalendarPlus} label="Today" hint="Open or create today's daily note" shortcut="Ctrl+Alt+D" onClick={() => goTo(today, JOURNAL_TEMPLATE)} />
        <Btn id="insert.yesterday" icon={CalendarClock} label="Yesterday" hint="Open yesterday's note" onClick={() => goTo(shiftDay(today, -1), JOURNAL_TEMPLATE)} />
        <Btn id="insert.tomorrow" icon={CalendarCheck} label="Tomorrow" hint="Open or create tomorrow's note" onClick={() => goTo(shiftDay(today, 1), JOURNAL_TEMPLATE)} />
        <Btn
          id="insert.prevDay"
          icon={ArrowLeft}
          label="Previous"
          hint="The day, week or month before this note"
          disabled={!prev}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(prev, prev.includes("W") ? weeklyTemplate(prev) : prev.length === 7 ? monthlyTemplate(prev) : JOURNAL_TEMPLATE)}
        />
        <Btn
          id="insert.nextDay"
          icon={ArrowRight}
          label="Next"
          hint="The day, week or month after this note"
          disabled={!next}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(next, next.includes("W") ? weeklyTemplate(next) : next.length === 7 ? monthlyTemplate(next) : JOURNAL_TEMPLATE)}
        />
        <Btn id="insert.thisWeek" icon={CalendarRange} label="This week" hint="Open or create this week's note, e.g. 2026-W45" onClick={() => goTo(weekKey(now()), weeklyTemplate(weekKey(now())))} />
        <Btn id="insert.thisMonth" icon={CalendarDays} label="This month" hint="Open or create this month's note, e.g. 2026-11" onClick={() => goTo(monthKey(now()), monthlyTemplate(monthKey(now())))} />
        <Btn id="insert.date" icon={CalendarDays} label="Today's date" hint="Insert 2026-11-06 style date" shortcut="Ctrl+Alt+T" edit={(s) => insertText(s, dateKey())} />
        <Btn id="insert.time" icon={Clock} label="Time" hint="Insert the current time" edit={(s) => insertText(s, DATE_FORMATS.find((f) => f.id === "time24").make(now()))} />
        <Btn
          id="insert.logEntry"
          icon={ListOrdered}
          label="Log entry"
          hint="Start a new time-stamped log line"
          edit={(s) => insertText(s, `- ${DATE_FORMATS.find((f) => f.id === "time24").make(now())} `)}
        />
        <RibbonMenu id="insert.dateFormats" icon={CalendarDays} label="Formats" hint="Every date and time format" width={280}>
          {(close) =>
            DATE_FORMATS.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertText(selection, item.make(now()))); close(); }}>
                <span>{item.label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{item.make(now())}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <RibbonMenu id="insert.linkDay" icon={Link2} label="Link day" hint="Insert a [[link]] to a day note" width={200}>
          {(close) =>
            [["Today", 0], ["Yesterday", -1], ["Tomorrow", 1], ["In a week", 7], ["A week ago", -7]].map(([label, n]) => (
              <MenuItem key={label} onClick={() => { run(insertText(selection, `[[${shiftDay(today, n)}]]`)); close(); }}>
                <span>{label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{shiftDay(today, n)}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <RibbonMenu id="insert.templates" icon={BookOpenCheck} label="Templates" hint="Ready-made journal blocks" width={240}>
          {(close) =>
            JOURNAL_TEMPLATES.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertBlock(selection, item.text.replace(/\n$/, ""))); close(); }}>
                {item.label}
              </MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label="Cards">
        <CardComposer
          id="insert.card"
          body={body}
          noteId={noteId}
          noteTitle={noteTitle}
          disabled={false}
          shortcut={shortcutLabel(shortcuts.card)}
          openSignal={signals.card}
        />
      </RibbonGroup>
    </>
  );
}