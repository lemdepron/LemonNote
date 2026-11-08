import { useState } from "react";
import {
  AtSign, Braces, Calendar, ChevronsDownUp, ClipboardCopy, CopyPlus, FileText, Footprints, Hash, ImagePlus, Link, Link2, ListTree, MessageSquareQuote,
  Minus, Omega, Plus, SquareCode, SquareTerminal, TextQuote, ArrowDown, ArrowUp, Trash2, FileJson, Shrink, Replace, IndentDecrease, IndentIncrease,
  MessageSquareOff, PackageOpen, Clock, CornerDownLeft,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn, MenuItem, MenuLabel, RibbonMenu, TextGrid, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import {
  fenceAt, footnoteParts, formatJsonSelection, insertBlock, lineMove, linkWithUrl, outlineOf, setFenceLanguage, shiftIndent,
  toggleComment, toggleWrap, unwrapFence, wikiLink, wrapSelectionInFence,
} from "@/lib/format-actions";
import { insertText } from "@/lib/ribbon-actions";
import { DATE_FORMATS } from "@/lib/journal-tools";
import { SYMBOLS } from "@/lib/text-style";
import { ALL_FENCE_LANGUAGES, FENCE_GROUPS, QUICK_LANGUAGES, fenceLabel } from "@/lib/code-fence-languages";
import { LANGUAGES, templateFor } from "@/lib/code-languages";
import { readPref, writePref } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const FIELD =
  "h-8 w-full rounded-md border border-border/80 bg-background/60 px-2 text-[12.5px] text-foreground outline-none focus:border-primary/40";

/** A popover with one text field and an Insert button. */
function UrlMenu({ icon, label, hint, placeholder, build, type = "text" }) {
  const { selection, run } = useRibbon();
  const [value, setValue] = useState("");
  return (
    <RibbonMenu icon={icon} label={label} hint={hint} width={300}>
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

export function InsertTab({ onPickImage }) {
  const { selection, run, value } = useRibbon();
  const now = () => new Date();

  return (
    <>
      <RibbonGroup label="Pictures">
        <Btn icon={ImagePlus} label="Image file" hint="Insert an image from your computer" shortcut="Ctrl+Alt+I" onClick={onPickImage} />
        <UrlMenu
          icon={Link2}
          label="Image URL"
          hint="Insert an image from a web address"
          placeholder="https://…/picture.png"
          build={(s, url) => insertText(s, `![${s.value.slice(s.start, s.end) || "image"}](${url})`)}
        />
      </RibbonGroup>

      <RibbonGroup label="Links">
        <Btn icon={Link2} label="Note link" hint="Link another note with [[ ]]" edit={wikiLink} />
        <UrlMenu icon={Link} label="Web link" hint="Turn the selection into a web link" placeholder="https://example.com" build={linkWithUrl} />
        <UrlMenu
          icon={AtSign}
          label="Email"
          hint="Insert an email link"
          placeholder="name@example.com"
          build={(s, mail) => linkWithUrl(s, `mailto:${mail}`)}
        />
        <UrlMenu icon={Hash} label="Tag" hint="Insert a #tag" placeholder="tag-name" build={(s, tag) => insertText(s, `#${tag.replace(/^#/, "")} `)} />
      </RibbonGroup>

      <RibbonGroup label="Blocks">
        <Btn icon={Minus} label="Divider" hint="Horizontal line" edit={(s) => insertBlock(s, "---")} />
        <RibbonMenu icon={MessageSquareQuote} label="Callout" hint="Highlighted note box" width={200}>
          {(close) =>
            CALLOUTS.map(([id, text]) => (
              <MenuItem
                key={id}
                onClick={() => {
                  const body = selection.value.slice(selection.start, selection.end);
                  const snippet = `> **${text}**\n> ${body || ""}`;
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
          icon={ChevronsDownUp}
          label="Collapsible"
          hint="A section that opens and closes"
          edit={(s) => insertBlock(s, "<details>\n<summary>Title</summary>\n\nHidden text\n\n</details>", "<details>\n<summary>".length)}
        />
        <Btn
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
        <Btn icon={CornerDownLeft} label="Line break" hint="Force a new line inside a paragraph" edit={(s) => insertText(s, "<br>\n")} />
        <Btn
          icon={ListTree}
          label="Outline"
          hint="Insert a list of this note's headings"
          disabled={!outlineOf(value)}
          disabledReason="Add some # headings first"
          edit={(s) => insertBlock(s, outlineOf(value))}
        />
        <Btn icon={TextQuote} label="Quote" hint="Block quote" edit={(s) => insertBlock(s, "> ", 2)} />
      </RibbonGroup>

      <RibbonGroup label="Symbols">
        <RibbonMenu icon={Omega} label="Symbols" hint="Special characters" width={330}>
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

      <RibbonGroup label="Date and time">
        <RibbonMenu icon={Calendar} label="Date" hint="Insert the date or time in a chosen format" width={280}>
          {(close) =>
            DATE_FORMATS.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  run(insertText(selection, item.make(now())));
                  close();
                }}
              >
                <span>{item.label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{item.make(now())}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <Btn icon={Clock} label="Time" hint="Insert the current time" edit={(s) => insertText(s, DATE_FORMATS.find((f) => f.id === "time24").make(now()))} />
      </RibbonGroup>

      <RibbonGroup label="Templates">
        <TemplateMenu selection={selection} run={run} />
      </RibbonGroup>
    </>
  );
}

// Built-in text templates
const BUILTIN_TEMPLATES = [
  {
    id: "letter",
    label: "Letter",
    text: "[Recipient Name]\n[Address]\n[City, State ZIP]\n\nDear [Recipient Name],\n\n\nSincerely,\n[Your Name]",
  },
  {
    id: "checklist",
    label: "Checklist",
    text: "## Checklist\n\n- [ ] Item 1\n- [ ] Item 2\n- [ ] Item 3\n",
  },
  {
    id: "pros-cons",
    label: "Pros & Cons",
    text: "## Decision: [Title]\n\n| Pros | Cons |\n| --- | --- |\n|  |  |\n|  |  |\n|  |  |\n",
  },
  {
    id: "meeting",
    label: "Meeting Agenda",
    text: "## Meeting: [Title]\n\n**Date:** \n**Time:** \n**Attendees:** \n\n### Agenda\n\n1. \n2. \n3. \n\n### Notes\n\n\n### Action Items\n\n- [ ] \n- [ ] \n",
  },
  {
    id: "daily-log",
    label: "Daily Log",
    text: "## Daily Log — [Date]\n\n### Top 3 Priorities\n\n1. \n2. \n3. \n\n### Notes\n\n\n### End of Day Review\n\n- Completed: \n- Blocked: \n- Tomorrow: \n",
  },
];

const TEMPLATES_PREF_KEY = "textTemplates";

function readCustomTemplates() {
  try {
    const raw = readPref(TEMPLATES_PREF_KEY, "[]");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCustomTemplates(templates) {
  writePref(TEMPLATES_PREF_KEY, JSON.stringify(templates));
}

function TemplateMenu({ selection, run }) {
  const [customTemplates, setCustomTemplates] = useState(() => readCustomTemplates());
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newText, setNewText] = useState("");

  const allTemplates = [...BUILTIN_TEMPLATES, ...customTemplates];

  const insertTemplate = (template) => {
    run(insertBlock(selection, template.text));
  };

  const addCustomTemplate = () => {
    if (!newName.trim() || !newText.trim()) return;
    const template = { id: `custom-${Date.now()}`, label: newName.trim(), text: newText };
    const next = [...customTemplates, template];
    setCustomTemplates(next);
    writeCustomTemplates(next);
    setNewName("");
    setNewText("");
    setShowAdd(false);
  };

  const removeCustomTemplate = (id) => {
    const next = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(next);
    writeCustomTemplates(next);
  };

  return (
    <RibbonMenu icon={FileText} label="Templates" hint="Insert a text template or manage your own" width={340}>
      {(close) => (
        <div className="space-y-2 p-1">
          {!showAdd ? (
            <>
              <MenuLabel>Built-in</MenuLabel>
              <div className="grid gap-1">
                {BUILTIN_TEMPLATES.map((template) => (
                  <MenuItem
                    key={template.id}
                    onClick={() => { insertTemplate(template); close(); }}
                    hint={template.text.slice(0, 80).replace(/\n/g, " ") + "…"}
                  >
                    {template.label}
                  </MenuItem>
                ))}
              </div>
              {customTemplates.length > 0 && (
                <>
                  <MenuLabel>My templates</MenuLabel>
                  <div className="grid gap-1">
                    {customTemplates.map((template) => (
                      <div key={template.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { insertTemplate(template); close(); }}
                          className="flex-1 h-7 truncate rounded-md border border-border/70 px-2 text-left text-[11.5px] text-foreground hover:bg-accent transition"
                        >
                          {template.label}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { removeCustomTemplate(template.id); }}
                          className="h-7 w-7 shrink-0 grid place-items-center rounded-md border border-transparent text-muted-foreground hover:bg-accent hover:text-destructive transition"
                          title="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 h-7 rounded-md border border-dashed border-border text-muted-foreground font-mono text-[10px] transition hover:border-primary/50 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add template…
              </button>
            </>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(e) => { e.preventDefault(); addCustomTemplate(); }}
            >
              <MenuLabel>New template</MenuLabel>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Template name"
                className={FIELD}
              />
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Template text (use \\n for newlines)"
                rows={4}
                className={FIELD + " resize-none font-mono text-[11px]"}
              />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 h-8 rounded-md bg-primary/90 text-[12px] font-medium text-primary-foreground hover:bg-primary">
                  Save
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-8 rounded-md border border-border/70 bg-card/60 text-[12px] font-medium text-foreground hover:bg-accent transition">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </RibbonMenu>
  );
}

/* ---------------------------------- Code ---------------------------------- */

const PREF_KEY = "codeBlockLanguage";

export function CodeTab() {
  const { selection, run, value } = useRibbon();
  const [language, setLanguage] = useState(() => readPref(PREF_KEY, "plain"));
  const [filter, setFilter] = useState("");

  const block = fenceAt(value, selection.start);
  const active = block ? block.lang || "plain" : language;
  const choose = (id) => {
    setLanguage(id);
    writePref(PREF_KEY, id);
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
  const inBlock = Boolean(block);
  const needBlock = "Put the cursor inside a code block first.";

  return (
    <>
      <RibbonGroup label="Code block">
        <RibbonMenu icon={SquareCode} label={`Block: ${fenceLabel(active)}`} hint="Insert a fenced code block; wraps the selection when there is one" width={320} shortcut="Ctrl+Alt+C">
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
          <Btn key={id} label={label} hint={`Insert a ${fenceLabel(id)} code block`} onClick={() => insertFence(id)} showLabel />
        ))}
        <Btn icon={Braces} label="Inline" hint="Inline code" shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
      </RibbonGroup>

      <RibbonGroup label="Block tools">
        <RibbonMenu icon={Replace} label="Language" hint="Change the language of the block under the cursor" disabled={!inBlock} disabledReason={needBlock} width={300}>
          {(close) =>
            FENCE_GROUPS.map((group) => (
              <div key={group.label}>
                <MenuLabel>{group.label}</MenuLabel>
                <div className="grid grid-cols-3 gap-1 p-1">
                  {group.items.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        run(setFenceLanguage(selection, id));
                        close();
                      }}
                      className="h-7 truncate rounded-md border border-border/70 px-2 text-left text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          }
        </RibbonMenu>
        <RibbonMenu icon={SquareTerminal} label="Snippet" hint="Insert a small example block" width={220}>
          {(close) =>
            snippets.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  const text = `\`\`\`${item.id}\n${templateFor(item.id)}\`\`\``;
                  run(insertBlock(selection, text));
                  close();
                }}
              >
                {item.label}
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <Btn icon={PackageOpen} label="Unwrap" hint="Remove the fences and keep the code" disabled={!inBlock} disabledReason={needBlock} edit={unwrapFence} />
        <Btn
          icon={ClipboardCopy}
          label="Copy code"
          hint="Copy the code of this block"
          disabled={!inBlock}
          disabledReason={needBlock}
          onClick={() => copyText(value.slice(block.bodyStart, block.bodyEnd).replace(/\n$/, ""))}
        />
      </RibbonGroup>

      <RibbonGroup label="Edit lines">
        <Btn
          icon={MessageSquareOff}
          label="Comment"
          hint={`Comment or uncomment the selected lines (${fenceLabel(active)} style)`}
          shortcut="Ctrl+/"
          edit={(s) => toggleComment(s, active)}
        />
        <Btn icon={IndentIncrease} hint="Indent lines" edit={(s) => shiftIndent(s, 1)} />
        <Btn icon={IndentDecrease} hint="Outdent lines" edit={(s) => shiftIndent(s, -1)} />
        <Btn icon={CopyPlus} label="Duplicate" hint="Duplicate the current line" edit={(s) => lineMove(s, "duplicate")} />
        <Btn icon={ArrowUp} hint="Move line up" edit={(s) => lineMove(s, "up")} />
        <Btn icon={ArrowDown} hint="Move line down" edit={(s) => lineMove(s, "down")} />
        <Btn icon={Trash2} hint="Delete the current line" edit={(s) => lineMove(s, "delete")} />
      </RibbonGroup>

      <RibbonGroup label="JSON">
        <Btn
          icon={FileJson}
          label="Pretty"
          hint="Format the JSON in the selection or in the block under the cursor"
          edit={(s) => formatJsonSelection(s, "pretty")}
        />
        <Btn icon={Shrink} label="Minify" hint="Squeeze the JSON onto one line" edit={(s) => formatJsonSelection(s, "minify")} />
      </RibbonGroup>
    </>
  );
}
