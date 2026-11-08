import { useState } from "react";
import { Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { MenuItem, MenuLabel, RibbonMenu, TextGrid, useRibbon } from "@/components/ribbon/RibbonKit";
import TablePicker from "@/components/ribbon/TablePicker";
import CardComposer from "@/components/ribbon/CardComposer";
import { getRibbonAction, runCodeFence } from "@/lib/ribbon-registry";
import { removePin, reorderPin, useQuickPins } from "@/lib/quick-access";
import { db } from "@/api/localDb";
import { JOURNAL_TEMPLATE, dateKey, shiftDay } from "@/lib/journal";
import { monthKey, monthlyTemplate, neighbourTitle, weekKey, weeklyTemplate } from "@/lib/journal-tools";
import { SYMBOLS } from "@/lib/text-style";
import { fenceAt, setFenceLanguage } from "@/lib/format-actions";
import { insertText, tableInsert } from "@/lib/ribbon-actions";
import { FENCE_GROUPS } from "@/lib/code-fence-languages";
import { readPref } from "@/lib/preferences";
import { shortcutLabel } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

const FIELD =
  "h-8 w-full rounded-md border border-border/80 bg-background/60 px-2 text-[12.5px] text-foreground outline-none focus:border-primary/40";

/** Opens (or creates) a journal / period note, then navigates to it. Same rule as the Insert tab. */
async function openDated(navigate, target, noteTitle) {
  const findOrCreate = async (title, template, tag = "journal") => {
    const found = await db.entities.Note.filter({ title, trashed: { $ne: true } }, { limit: 1 });
    const note = found?.items?.[0] || (await db.entities.Note.create({ title, body: template, tags: [tag] }));
    navigate(`/note/${note.id}`);
  };
  const today = dateKey();
  if (target === "today") return findOrCreate(today, JOURNAL_TEMPLATE);
  if (target === "yesterday") return findOrCreate(shiftDay(today, -1), JOURNAL_TEMPLATE);
  if (target === "tomorrow") return findOrCreate(shiftDay(today, 1), JOURNAL_TEMPLATE);
  if (target === "thisWeek") return findOrCreate(weekKey(new Date()), weeklyTemplate(weekKey(new Date())));
  if (target === "thisMonth") return findOrCreate(monthKey(new Date()), monthlyTemplate(monthKey(new Date())));
  const title = neighbourTitle(noteTitle, target === "next" ? 1 : -1);
  if (!title) return;
  const template = title.includes("W") ? weeklyTemplate(title) : title.length === 7 ? monthlyTemplate(title) : JOURNAL_TEMPLATE;
  return findOrCreate(title, template);
}

/* Popover contents for pinned menu buttons ---------------------------------------------- */

function InputMenu({ menu, ctx, close }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="space-y-2 p-1"
      onSubmit={(event) => {
        event.preventDefault();
        const text = value.trim();
        if (!text) return;
        ctx.run(menu.build(ctx.selection, text));
        setValue("");
        close();
      }}
    >
      <input autoFocus type="text" value={value} onChange={(event) => setValue(event.target.value)} placeholder={menu.placeholder} className={FIELD} />
      <button type="submit" className="h-8 w-full rounded-md bg-primary/90 text-[12px] font-medium text-primary-foreground hover:bg-primary">
        Insert
      </button>
    </form>
  );
}

function ItemsMenu({ menu, ctx, close }) {
  return (
    <>
      {menu.heading && <MenuLabel>{menu.heading}</MenuLabel>}
      {menu.items.map((item) => (
        <MenuItem
          key={item.label}
          onClick={() => {
            ctx.run(item.make(ctx.selection));
            close();
          }}
        >
          <span>{item.label}</span>
          {item.sub && (
            <span className="font-mono text-[10.5px] text-muted-foreground">{typeof item.sub === "function" ? item.sub() : item.sub}</span>
          )}
        </MenuItem>
      ))}
    </>
  );
}

function SymbolsMenu({ ctx, close }) {
  return SYMBOLS.map((group) => (
    <div key={group.group}>
      <MenuLabel>{group.group}</MenuLabel>
      <TextGrid
        items={group.items}
        columns={9}
        onPick={(symbol) => {
          ctx.run(insertText(ctx.selection, symbol));
          close();
        }}
      />
    </div>
  ));
}

/** The "insert a fenced code block" menu: search box plus the language groups. */
function LanguagesMenu({ ctx, close }) {
  const [filter, setFilter] = useState("");
  const block = fenceAt(ctx.value, ctx.selection.start);
  const active = block ? block.lang || "plain" : readPref("codeBlockLanguage", "plain");
  const matches = (id, label) => !filter || `${label} ${id}`.toLowerCase().includes(filter.toLowerCase());
  return (
    <>
      <input
        autoFocus
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Search languages…"
        className={cn(FIELD, "mb-1")}
      />
      {FENCE_GROUPS.map((group) => {
        const items = group.items.filter(([id, label]) => matches(id, label));
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
                    runCodeFence(ctx, id);
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
  );
}

/** The "change the block's language" menu. */
function SetLanguageMenu({ ctx, close }) {
  return FENCE_GROUPS.map((group) => (
    <div key={group.label}>
      <MenuLabel>{group.label}</MenuLabel>
      <div className="grid grid-cols-3 gap-1 p-1">
        {group.items.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              ctx.run(setFenceLanguage(ctx.selection, id));
              close();
            }}
            className="h-7 truncate rounded-md border border-border/70 px-2 text-left text-[11.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  ));
}

/* One pinned button, rendered outside the tabs ------------------------------------------ */

/** Renders a registry entry as a working button. Uses RibbonContext, so the pinned
 * copy edits the same note through the same editor bridge as the original. */
function PinnedButton({ id }) {
  const ctx = useRibbon();
  const navigate = useNavigate();
  const entry = getRibbonAction(id);
  if (!entry) return null;

  if (entry.kind === "widget") {
    if (entry.widget === "tablePicker") {
      return (
        <TablePicker
          onInsert={(rows, columns) => ctx.run(tableInsert(ctx.selection, rows, columns))}
          disabled={!ctx.markdown}
          disabledReason={ctx.offReason}
          shortcut={shortcutLabel({ mod: true, alt: true, key: "m" })}
          openSignal={0}
        />
      );
    }
    if (entry.widget === "cardComposer") {
      return (
        <CardComposer
          body={ctx.body}
          noteId={ctx.noteId}
          noteTitle={ctx.noteTitle}
          disabled={false}
          shortcut={shortcutLabel({ mod: true, alt: true, key: "k" })}
          openSignal={0}
        />
      );
    }
    return null;
  }

  if (entry.kind === "menu") {
    const off = entry.enabled ? !entry.enabled(ctx) : false;
    const reason = typeof entry.disabledReason === "function" ? entry.disabledReason(ctx) : entry.disabledReason;
    return (
      <RibbonMenu
        id={id}
        icon={entry.icon}
        label={entry.label}
        hint={entry.hint}
        shortcut={entry.shortcut}
        width={entry.width}
        disabled={off || undefined}
        disabledReason={reason}
      >
        {(close) => {
          const type = entry.menu.type;
          if (type === "input") return <InputMenu menu={entry.menu} ctx={ctx} close={close} />;
          if (type === "items") return <ItemsMenu menu={entry.menu} ctx={ctx} close={close} />;
          if (type === "symbols") return <SymbolsMenu ctx={ctx} close={close} />;
          if (type === "languages") return <LanguagesMenu ctx={ctx} close={close} />;
          if (type === "setLanguage") return <SetLanguageMenu ctx={ctx} close={close} />;
          return null;
        }}
      </RibbonMenu>
    );
  }

  const off = entry.enabled ? !entry.enabled(ctx) : entry.kind === "edit" ? !ctx.markdown : false;
  const reason = off
    ? entry.enabled
      ? typeof entry.disabledReason === "function"
        ? entry.disabledReason(ctx)
        : entry.disabledReason
      : ctx.offReason
    : undefined;
  const Icon = entry.icon;

  return (
    <RibbonButton
      id={id}
      icon={Icon}
      label={entry.label}
      hint={entry.hint || entry.label}
      shortcut={entry.shortcut}
      active={entry.active ? entry.active(ctx) : undefined}
      disabled={off}
      disabledReason={reason}
      showLabel={!Icon}
      onClick={() => {
        if (entry.kind === "edit") ctx.run(entry.make(ctx.selection, ctx));
        else if (entry.kind === "navigate") openDated(navigate, entry.target, ctx.noteTitle);
        else entry.fn(ctx, { navigate });
      }}
    />
  );
}

/* Star button, popup and inline strip --------------------------------------------------- */

/** One chip in the popup. In Customize mode it drags to reorder and shows an X to remove. */
function PinChip({ id, index, customizing }) {
  const entry = getRibbonAction(id);
  const [over, setOver] = useState(false);
  if (!entry) return null;

  if (!customizing) return <PinnedButton id={id} />;

  const Icon = entry.icon;
  return (
    <span
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", id)}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        const dragged = event.dataTransfer.getData("text/plain");
        if (dragged && getRibbonAction(dragged)) reorderPin(dragged, index);
        setOver(false);
      }}
      title={`${entry.label} — drag onto another pin to reorder`}
      className={cn(
        "relative flex h-8 w-8 cursor-grab select-none items-center justify-center rounded-md border text-muted-foreground",
        over ? "border-primary/60 bg-primary/10" : "border-border/60 bg-card"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="font-mono text-[10px]">{entry.label}</span>}
      <button
        type="button"
        aria-label={`Remove ${entry.label} from Quick Access`}
        title={`Remove ${entry.label} from Quick Access`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => removePin(id)}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-destructive"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

/**
 * The Quick Access area at the left of the ribbon tab row: a star button that
 * opens the pinned buttons popup, plus the first six pins shown inline when
 * the ribbon is wide. Pins are managed by right-clicking any ribbon button.
 */
export default function QuickAccess() {
  const pins = useQuickPins();
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  return (
    <div className="mr-1 flex shrink-0 items-center gap-1 border-r border-border pr-1.5">
      <div className="hidden items-center gap-0.5 lg:flex">
        {pins.slice(0, 6).map((id) => (
          <PinnedButton key={id} id={id} />
        ))}
      </div>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setCustomizing(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Quick Access"
            aria-label="Quick Access — your pinned ribbon buttons"
            aria-expanded={open}
            onMouseDown={(event) => event.preventDefault()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Star className={cn("h-3.5 w-3.5", open && "fill-primary text-primary")} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-80 p-2">
          <p className="nb-label">quick access</p>
          <div className="flex flex-wrap gap-1 p-1">
            {pins.map((id, index) => (
              <PinChip key={id} id={id} index={index} customizing={customizing} />
            ))}
            {!pins.length && (
              <p className="px-1 pb-1 text-[12px] leading-snug text-muted-foreground">
                Right-click any ribbon button and choose “Add to Quick Access”.
              </p>
            )}
          </div>
          {Boolean(pins.length) && (
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <span className="font-mono text-[9.5px] text-muted-foreground">
                {customizing ? "drag a pin onto another one to reorder" : `${pins.length} pinned`}
              </span>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setCustomizing((value) => !value)}
                className="h-7 rounded-md border border-border/70 px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {customizing ? "Done" : "Customize"}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
