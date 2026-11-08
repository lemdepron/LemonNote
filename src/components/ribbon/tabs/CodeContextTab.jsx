import { useState } from "react";
import {
  Replace, SquareTerminal, MessageSquareOff, IndentDecrease, IndentIncrease,
  CopyPlus, ArrowUp, ArrowDown, Trash2, FileJson, Shrink, ClipboardCopy, PackageOpen,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn, MenuItem, MenuLabel, RibbonMenu, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";
import {
  fenceAt, formatJsonSelection, insertBlock, lineMove, setFenceLanguage, shiftIndent,
  toggleComment, unwrapFence, wrapSelectionInFence,
} from "@/lib/format-actions";
import { FENCE_GROUPS, fenceLabel } from "@/lib/code-fence-languages";
import { LANGUAGES, templateFor } from "@/lib/code-languages";
import { readPref, writePref } from "@/lib/preferences";

const PREF_KEY = "codeBlockLanguage";

/* ---------------------------------- Code (Contextual) ---------------------------------- */

export function CodeContextTab() {
  const { selection, run, value } = useRibbon();
  const [language, setLanguage] = useState(() => readPref(PREF_KEY, "plain"));
  const [filter, setFilter] = useState("");

  const block = fenceAt(value, selection.start);
  const active = block ? block.lang || "plain" : language;
  const inBlock = Boolean(block);
  const needBlock = "Put the cursor inside a code block first.";
  const snippets = LANGUAGES.filter((item) => item.template);

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

  return (
    <>
      <RibbonGroup label="Block tools">
        <RibbonMenu id="code.language" icon={Replace} label="Language" hint="Change the language of the block under the cursor" disabled={!inBlock} disabledReason={needBlock} width={300}>
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
        <RibbonMenu id="code.snippet" icon={SquareTerminal} label="Snippet" hint="Insert a small example block" width={220}>
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
        <Btn id="code.unwrap" icon={PackageOpen} label="Unwrap" hint="Remove the fences and keep the code" disabled={!inBlock} disabledReason={needBlock} edit={unwrapFence} />
        <Btn
          id="code.copy"
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
          id="code.comment"
          icon={MessageSquareOff}
          label="Comment"
          hint={`Comment or uncomment the selected lines (${fenceLabel(active)} style)`}
          shortcut="Ctrl+/"
          edit={(s) => toggleComment(s, active)}
        />
        <Btn id="code.indent" icon={IndentIncrease} hint="Indent lines" edit={(s) => shiftIndent(s, 1)} />
        <Btn id="code.outdent" icon={IndentDecrease} hint="Outdent lines" edit={(s) => shiftIndent(s, -1)} />
        <Btn id="code.duplicate" icon={CopyPlus} label="Duplicate" hint="Duplicate the current line" edit={(s) => lineMove(s, "duplicate")} />
        <Btn id="code.moveUp" icon={ArrowUp} hint="Move line up" edit={(s) => lineMove(s, "up")} />
        <Btn id="code.moveDown" icon={ArrowDown} hint="Move line down" edit={(s) => lineMove(s, "down")} />
        <Btn id="code.deleteLine" icon={Trash2} hint="Delete the current line" edit={(s) => lineMove(s, "delete")} />
      </RibbonGroup>

      <RibbonGroup label="JSON">
        <Btn
          id="code.prettyJson"
          icon={FileJson}
          label="Pretty"
          hint="Format the JSON in the selection or in the block under the cursor"
          edit={(s) => formatJsonSelection(s, "pretty")}
        />
        <Btn id="code.minifyJson" icon={Shrink} label="Minify" hint="Squeeze the JSON onto one line" edit={(s) => formatJsonSelection(s, "minify")} />
      </RibbonGroup>
    </>
  );
}