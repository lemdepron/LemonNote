import { useState, useRef } from "react";
import {
  AtSign, BarChart, Bookmark, Braces, ChevronsDownUp, Footprints, Hash, ImagePlus, Link, Link2, ListOrdered, ListTree, MessageSquareQuote,
  Minus, Omega, SquareCode, TextQuote, Clock, CornerDownLeft, CalendarPlus, CalendarClock, CalendarCheck, CalendarRange, CalendarDays,
  Calendar, BookOpenCheck, ArrowLeft, ArrowRight, Film, Paperclip, Mic, MicOff, Square, Triangle, Star, Star as StarIcon,
  SquarePen, StickyNote, FileImage, Minus as LineHorizontal, ArrowRight as ArrowRightIcon, Circle as Ellipse, SquareDashed,
  Table, Layers,
} from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import TablePicker from "@/components/ribbon/TablePicker";
import CardComposer from "@/components/ribbon/CardComposer";
import { Btn, MenuItem, MenuLabel, RibbonMenu, TextGrid, useRibbon } from "@/components/ribbon/RibbonKit";
import { useI18n } from "@/lib/i18n";
import {
  fenceAt, footnoteParts, insertBlock, insertBookmark, insertChart, linkWithUrl, outlineOf, toggleWrap, wikiLink, wrapSelectionInFence,
} from "@/lib/format-actions";
import { insertText, tableAt, tableInsert } from "@/lib/ribbon-actions";
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
import { addAttachment } from "@/lib/attachments";
import { toast } from "@/lib/toast";
import { prompt } from "@/components/ui/use-dialog";
import { setPendingFigureCaption } from "@/lib/dialog-state";

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

export function InsertTab({ onPickImage, signals, shortcuts, body, noteId, noteTitle, ink }) {
  const { t } = useI18n();
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
  const needBlock = t("ribbon.insert.needCodeBlock");
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

  // Refs for hidden file inputs
  const gifInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Format file size for display
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle GIF file selection
  const handleGifSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    // Validate file type
    const allowedTypes = ["image/gif", "image/webp", "image/apng"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("ribbon.insert.gifError"));
      return;
    }

    try {
      const attachment = await addAttachment(file);
      const snippet = `\n![${file.name.replace(/\.[^.]+$/, "")}](${attachment.ref})\n\n`;
      const at = selection;
      const start = Math.min(at.start ?? value.length, value.length);
      const end = Math.min(at.end ?? start, value.length);
      run({
        start,
        end,
        text: snippet,
        caret: start + snippet.length,
        next: `${value.slice(0, start)}${snippet}${value.slice(end)}`,
      });
    } catch {
      toast.error(t("ribbon.insert.gifInsertError"));
    }
  };

  // Handle file attachment selection
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    // Check size limit (default 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`File must be under ${formatSize(MAX_SIZE)}.`);
      return;
    }

    try {
      const attachment = await addAttachment(file);
      const snippet = `\n[${file.name} (${formatSize(file.size)})](${attachment.ref})\n\n`;
      const at = selection;
      const start = Math.min(at.start ?? value.length, value.length);
      const end = Math.min(at.end ?? start, value.length);
      run({
        start,
        end,
        text: snippet,
        caret: start + snippet.length,
        next: `${value.slice(0, start)}${snippet}${value.slice(end)}`,
      });
    } catch {
      toast.error(t("ribbon.insert.fileAttachError"));
    }
  };

  // Handle audio recording toggle
  const handleAudioToggle = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingBlob(blob);

        // Save as attachment and insert into note
        try {
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
          const attachment = await addAttachment(file);
          const snippet = `\n![audio](${attachment.ref})\n\n`;
          const at = selection;
          const start = Math.min(at.start ?? value.length, value.length);
          const end = Math.min(at.end ?? start, value.length);
          run({
            start,
            end,
            text: snippet,
            caret: start + snippet.length,
            next: `${value.slice(0, start)}${snippet}${value.slice(end)}`,
          });
        } catch {
          toast.error(t("ribbon.insert.recordingSaveError"));
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      toast.info(t("ribbon.insert.recordingToast"));
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error(t("ribbon.insert.micPermissionError"));
      } else {
        toast.error(t("ribbon.insert.recordingStartError"));
      }
    }
  };

  return (
    <>
      <RibbonGroup label={t("ribbon.insert.pictures")} icon={ImagePlus} priority={10}>
        <Btn id="insert.image" icon={ImagePlus} label={t("ribbon.insert.image")} hint={t("ribbon.insert.imageHint")} shortcut="Ctrl+Alt+I" onClick={onPickImage} />
        <UrlMenu
          id="insert.imageUrl"
          icon={Link}
          label={t("ribbon.insert.imageUrl")} hint={t("ribbon.insert.imageUrlHint")}
          placeholder={t("ribbon.insert.imageUrlPlaceholder")}
          build={(s, url) => insertText(s, `![${s.value.slice(s.start, s.end) || "image"}](${url})`)}
        />
        <Btn
          id="insert.figure"
          icon={FileImage}
          label={t("ribbon.insert.figure")} hint={t("ribbon.insert.figureHint")}
          onClick={async () => {
            const caption = await prompt(t("ribbon.insert.figureCaptionPrompt"));
            if (caption === null) return; // User cancelled
            // Store caption and trigger image picker
            setPendingFigureCaption(caption);
            onPickImage();
          }}
        />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.media")} icon={Film} priority={20}>
        <Btn
          id="insert.gif"
          icon={Film}
          label={t("ribbon.insert.gif")} hint={t("ribbon.insert.gifHint")}
          onClick={() => gifInputRef.current?.click()}
        />
        <Btn
          id="insert.file"
          icon={Paperclip}
          label={t("ribbon.insert.file")} hint={t("ribbon.insert.fileHint")}
          onClick={() => fileInputRef.current?.click()}
        />
        <Btn
          id="insert.audio"
          icon={isRecording ? MicOff : Mic}
          label="Record audio"
          hint={isRecording ? t("ribbon.insert.audioStopHint") : t("ribbon.insert.audioHint")}
          active={isRecording}
          onClick={handleAudioToggle}
        />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.links")} icon={Link2} priority={30}>
        <Btn id="insert.noteLink" icon={Link2} label={t("ribbon.insert.noteLink")} hint={t("ribbon.insert.noteLinkHint")} edit={wikiLink} />
        <Btn id="insert.bookmark" icon={Bookmark} label={t("ribbon.insert.bookmark")} hint={t("ribbon.insert.bookmarkHint")} onClick={async () => {
          const name = await prompt(t("ribbon.insert.bookmarkPrompt"));
          if (!name) return;
          run(insertBookmark(selection, name));
        }} />
        <UrlMenu id="insert.webLink" icon={Link} label={t("ribbon.insert.webLink")} hint={t("ribbon.insert.webLinkHint")} placeholder={t("ribbon.insert.webLinkPlaceholder")} build={linkWithUrl} />
        <UrlMenu
          id="insert.email"
          icon={AtSign}
          label={t("ribbon.insert.email")} hint={t("ribbon.insert.emailHint")}
          placeholder={t("ribbon.insert.emailPlaceholder")}
          build={(s, mail) => linkWithUrl(s, `mailto:${mail}`)}
        />
        <UrlMenu id="insert.tag" icon={Hash} label={t("ribbon.insert.tag")} hint={t("ribbon.insert.tagHint")} placeholder={t("ribbon.insert.tagPlaceholder")} build={(s, tag) => insertText(s, `#${tag.replace(/^#/, "")} `)} />
      </RibbonGroup>

      {/* Bookmarks menu - lists all bookmarks in the current note */}
      <RibbonGroup label={t("ribbon.insert.bookmarks")} icon={Bookmark} priority={40}>
        <RibbonMenu id="insert.bookmarks" icon={Bookmark} label={t("ribbon.insert.bookmarks")} hint="Jump to a bookmark in this note" width={240}>
          {(close) => {
            const bookmarks = [...value.matchAll(/<span id="(bm-[^"]+)"><\/span>/g)].map(m => m[1]);
            if (!bookmarks.length) {
              return (
                <MenuItem disabled className="text-muted-foreground px-2 py-1 text-[11px]">
                  {t("ribbon.insert.noBookmarks")}
                </MenuItem>
              );
            }
            return bookmarks.map((bm) => (
              <MenuItem
                key={bm}
                onClick={() => {
                  const id = bm;
                  const el = document.getElementById(id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  close();
                }}
              >
                {bm.replace(/^bm-/, '')}
              </MenuItem>
            ));
          }}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.blocks")} icon={MessageSquareQuote} priority={50}>
        <Btn id="insert.divider" icon={Minus} label={t("ribbon.insert.divider")} hint={t("ribbon.insert.dividerHint")} edit={(s) => insertBlock(s, "---")} />
        <RibbonMenu id="insert.callout" icon={MessageSquareQuote} label={t("ribbon.insert.callout")} hint={t("ribbon.insert.calloutHint")} width={200}>
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
          label={t("ribbon.insert.collapsible")} hint={t("ribbon.insert.collapsibleHint")}
          edit={(s) => insertBlock(s, "<details>\n<summary>Title</summary>\n\nHidden text\n\n</details>", "<details>\n<summary>".length)}
        />
        <Btn
          id="insert.footnote"
          icon={Footprints}
          label={t("ribbon.insert.footnote")} hint={t("ribbon.insert.footnoteHint")}
          onClick={() => {
            const { ref, definition } = footnoteParts(value);
            const withRef = insertText(selection, ref);
            const next = withRef.next.replace(/\n*$/, "") + `\n\n${definition}`;
            run({ next, start: 0, end: value.length, text: next, caret: next.length });
          }}
        />
        <Btn id="insert.lineBreak" icon={CornerDownLeft} label={t("ribbon.insert.lineBreak")} hint={t("ribbon.insert.lineBreakHint")} edit={(s) => insertText(s, "<br>\n")} />
        <Btn
          id="insert.outline"
          icon={ListTree}
          label={t("ribbon.insert.outline")} hint={t("ribbon.insert.outlineHint")}
          disabled={!outlineOf(value)}
          disabledReason={t("ribbon.insert.outlineDisabled")}
          edit={(s) => insertBlock(s, outlineOf(value))}
        />
        <Btn id="insert.quoteBlock" icon={TextQuote} label={t("ribbon.insert.quoteBlock")} hint={t("ribbon.insert.quoteBlockHint")} edit={(s) => insertBlock(s, "> ", 2)} />
        <Btn
          id="insert.chart"
          icon={BarChart}
          label={t("ribbon.insert.chart")} hint={t("ribbon.insert.chartHint")}
          disabled={!tableAt(value, selection.start)}
          disabledReason={t("ribbon.insert.chartDisabled")}
          onClick={async () => {
            const tableCount = (value.match(/\|.*\|/g) || []).length;
            if (!tableCount) return;
            const type = await prompt(t("ribbon.insert.chartTypePrompt"), "bar");
            if (!type || !['bar', 'line', 'pie'].includes(type)) return;
            const tableIndex = await prompt(`${t("ribbon.insert.chartTablePrompt").replace("{count}", tableCount)}`, '0');
            if (tableIndex === null) return;
            const idx = parseInt(tableIndex, 10);
            if (isNaN(idx) || idx < 0 || idx >= tableCount) return;
            const title = await prompt(t("ribbon.insert.chartTitlePrompt"), '');
            run(insertChart(selection, { type, table: idx, title: title || undefined }));
          }}
        />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.symbols")} icon={Omega} priority={60}>
        <RibbonMenu id="insert.symbols" icon={Omega} label={t("ribbon.insert.symbols")} hint={t("ribbon.insert.symbolsMenuHint")} width={330}>
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

      <RibbonGroup label={t("ribbon.insert.codeBlock")} icon={SquareCode} priority={70}>
        <RibbonMenu id="insert.codeBlock" icon={SquareCode} label={t("ribbon.insert.codeBlockMenu", { label: fenceLabel(active) })} hint={t("ribbon.insert.codeBlockMenuHint")} width={320} shortcut="Ctrl+Alt+C">
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
                            "h-7 truncate rounded-md border px-2 text-start text-[11.5px] transition",
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
          <Btn key={id} id={`insert.fence.${id}`} label={label} hint={t("ribbon.insert.quickLanguageHint", { lang: fenceLabel(id) })} onClick={() => insertFence(id)} showLabel />
        ))}
        <Btn id="insert.inlineCode" icon={Braces} label={t("ribbon.insert.inlineCode")} hint={t("ribbon.insert.inlineCodeHint")} shortcut="Ctrl+E" edit={(s) => toggleWrap(s, "`")} />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.table")} icon={Table} priority={80}>
        <TablePicker
          id="insert.table"
          onInsert={(rows, columns) => run(tableInsert(selection, rows, columns))}
          disabled={false}
          shortcut={shortcutLabel(shortcuts.table)}
          openSignal={signals.table}
        />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.shapes")} icon={Square} priority={90}>
        <Btn id="insert.shape.rect" icon={Square} label={t("ribbon.insert.shapeRect")} hint={t("ribbon.insert.shapeRectHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "rect" })} />
        <Btn id="insert.shape.rounded" icon={SquareDashed} label={t("ribbon.insert.shapeRounded")} hint={t("ribbon.insert.shapeRoundedHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "rounded-rect" })} />
        <Btn id="insert.shape.ellipse" icon={Ellipse} label={t("ribbon.insert.shapeEllipse")} hint={t("ribbon.insert.shapeEllipseHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "ellipse" })} />
        <Btn id="insert.shape.line" icon={LineHorizontal} label={t("ribbon.insert.shapeLine")} hint={t("ribbon.insert.shapeLineHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "line" })} />
        <Btn id="insert.shape.arrow" icon={ArrowRightIcon} label={t("ribbon.insert.shapeArrow")} hint={t("ribbon.insert.shapeArrowHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "arrow" })} />
        <Btn id="insert.shape.triangle" icon={Triangle} label={t("ribbon.insert.shapeTriangle")} hint={t("ribbon.insert.shapeTriangleHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "triangle" })} />
        <Btn id="insert.shape.star" icon={StarIcon} label={t("ribbon.insert.shapeStar")} hint={t("ribbon.insert.shapeStarHint")} onClick={() => ink?.addObject?.("shape", 100, 100, { shapeType: "star" })} />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.stickers")} icon={Star} priority={100}>
        <RibbonMenu id="insert.sticker" icon={Star} label={t("ribbon.insert.stickers")} hint={t("ribbon.insert.stickersMenuHint")} width={320}>
          {(close) => (
            <div className="p-1">
              {ink?.STICKERS?.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    ink?.addObject?.("sticker", 100, 100, { stickerId: sticker.id });
                    close();
                  }}
                  className="h-10 w-10 rounded-md border border-border/70 p-1 transition hover:bg-accent hover:border-primary/50"
                  title={sticker.label}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full text-foreground">
                    {sticker.paths.map((path, i) => <path key={i} d={path} />)}
                  </svg>
                </button>
              ))}
            </div>
          )}
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.textNotes")} icon={SquarePen} priority={110}>
        <Btn id="insert.textbox" icon={SquarePen} label={t("ribbon.insert.textbox")} hint={t("ribbon.insert.textboxHint")} onClick={() => ink?.addObject?.("textbox", 100, 100)} />
        <Btn id="insert.sticky" icon={StickyNote} label={t("ribbon.insert.sticky")} hint={t("ribbon.insert.stickyHint")} onClick={() => ink?.addObject?.("sticky", 100, 100)} />
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.timeCalendar")} icon={Calendar} priority={120}>
        <Btn id="insert.today" icon={CalendarPlus} label={t("ribbon.insert.today")} hint={t("ribbon.insert.todayHint")} shortcut="Ctrl+Alt+D" onClick={() => goTo(today, JOURNAL_TEMPLATE)} />
        <Btn id="insert.yesterday" icon={CalendarClock} label={t("ribbon.insert.yesterday")} hint={t("ribbon.insert.yesterdayHint")} onClick={() => goTo(shiftDay(today, -1), JOURNAL_TEMPLATE)} />
        <Btn id="insert.tomorrow" icon={CalendarCheck} label={t("ribbon.insert.tomorrow")} hint={t("ribbon.insert.tomorrowHint")} onClick={() => goTo(shiftDay(today, 1), JOURNAL_TEMPLATE)} />
        <Btn
          id="insert.prevDay"
          icon={ArrowLeft}
          label={t("ribbon.insert.prevDay")} hint={t("ribbon.insert.prevDayHint")}
          disabled={!prev}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(prev, prev.includes("W") ? weeklyTemplate(prev) : prev.length === 7 ? monthlyTemplate(prev) : JOURNAL_TEMPLATE)}
        />
        <Btn
          id="insert.nextDay"
          icon={ArrowRight}
          label={t("ribbon.insert.nextDay")} hint={t("ribbon.insert.nextDayHint")}
          disabled={!next}
          disabledReason="This note's title is not a date, week (2026-W45) or month (2026-11)"
          onClick={() => goTo(next, next.includes("W") ? weeklyTemplate(next) : next.length === 7 ? monthlyTemplate(next) : JOURNAL_TEMPLATE)}
        />
        <Btn id="insert.thisWeek" icon={CalendarRange} label={t("ribbon.insert.thisWeek")} hint={t("ribbon.insert.thisWeekHint")} onClick={() => goTo(weekKey(now()), weeklyTemplate(weekKey(now())))} />
        <Btn id="insert.thisMonth" icon={Calendar} label={t("ribbon.insert.thisMonth")} hint={t("ribbon.insert.thisMonthHint")} onClick={() => goTo(monthKey(now()), monthlyTemplate(monthKey(now())))} />
        <Btn id="insert.date" icon={CalendarDays} label={t("ribbon.insert.date")} hint={t("ribbon.insert.dateHint")} shortcut="Ctrl+Alt+T" edit={(s) => insertText(s, dateKey())} />
        <Btn id="insert.time" icon={Clock} label={t("ribbon.insert.time")} hint={t("ribbon.insert.timeHint")} edit={(s) => insertText(s, DATE_FORMATS.find((f) => f.id === "time24").make(now()))} />
        <Btn
          id="insert.logEntry"
          icon={ListOrdered}
          label={t("ribbon.insert.logEntry")} hint={t("ribbon.insert.logEntryHint")}
          edit={(s) => insertText(s, `- ${DATE_FORMATS.find((f) => f.id === "time24").make(now())} `)}
        />
        <RibbonMenu id="insert.dateFormats" icon={CalendarClock} label={t("ribbon.insert.dateFormats")} hint={t("ribbon.insert.dateFormatsHint")} width={280}>
          {(close) =>
            DATE_FORMATS.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertText(selection, item.make(now()))); close(); }}>
                <span>{item.label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{item.make(now())}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <RibbonMenu id="insert.linkDay" icon={Calendar} label={t("ribbon.insert.linkDay")} hint={t("ribbon.insert.linkDayHint")} width={200}>
          {(close) =>
            [["Today", 0], ["Yesterday", -1], ["Tomorrow", 1], ["In a week", 7], ["A week ago", -7]].map(([label, n]) => (
              <MenuItem key={label} onClick={() => { run(insertText(selection, `[[${shiftDay(today, n)}]]`)); close(); }}>
                <span>{label}</span>
                <span className="font-mono text-[10.5px] text-muted-foreground">{shiftDay(today, n)}</span>
              </MenuItem>
            ))
          }
        </RibbonMenu>
        <RibbonMenu id="insert.templates" icon={BookOpenCheck} label={t("ribbon.insert.templates")} hint={t("ribbon.insert.templatesHint")} width={240}>
          {(close) =>
            JOURNAL_TEMPLATES.map((item) => (
              <MenuItem key={item.id} onClick={() => { run(insertBlock(selection, item.text.replace(/\n$/, ""))); close(); }}>
                {item.label}
              </MenuItem>
            ))
          }
        </RibbonMenu>
      </RibbonGroup>

      <RibbonGroup label={t("ribbon.insert.cards")} icon={Layers} priority={130}>
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

      {/* Hidden file inputs for GIF and file attachments */}
      <input
        ref={gifInputRef}
        type="file"
        accept="image/gif,image/webp,image/apng"
        className="hidden"
        onChange={handleGifSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
}