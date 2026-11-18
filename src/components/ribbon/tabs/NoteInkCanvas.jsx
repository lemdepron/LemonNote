import { useState, useCallback } from "react";
import { PenLine, Paperclip, Loader2, Layers, Trash2, BookOpen } from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { RibbonMenu, MenuItem } from "@/components/ribbon/RibbonKit";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import { relativeTime } from "@/lib/vault";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/**
 * Ink canvas inside a note - uses the unified CanvasBoard engine.
 * Mirrors the InkTab API for the ribbon integration.
 */
export default function NoteInkCanvas({ noteInk }) {
  const { t } = useI18n();
  const [legacy, setLegacy] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadLegacy = useCallback(() =>
    noteInk.listAttachable().then(setLegacy).catch(() => setLegacy([])),
    [noteInk]
  );

  const attachMenu = (
    <RibbonMenu
      icon={Paperclip}
      label={t("ink.tab.attachOld")}
      hint={t("ink.tab.attachOldHint")}
      width={300}
      onOpenChange={loadLegacy}
    >
      {(close) =>
        legacy.length === 0 ? (
          <p className="px-2 py-3 font-mono text-[11px] text-muted-foreground">
            {t("ink.tab.noAttachable")}
          </p>
        ) : (
          legacy.map((page) => (
            <MenuItem
              key={page.id}
              onClick={() => {
                noteInk.onAttach(page.id);
                close();
              }}
            >
              <span className="truncate">{page.name || "Untitled page"}</span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {relativeTime(page.updated_date)}
              </span>
            </MenuItem>
          ))
        )
      }
    </RibbonMenu>
  );

  // If no page attached yet, show start/attach UI
  if (!noteInk.hasPage) {
    return (
      <RibbonGroup label={t("ink.tab.handwriting")} priority={70} icon={PenLine}>
        <RibbonButton
          icon={noteInk.starting ? Loader2 : PenLine}
          spinning={noteInk.starting}
          label={t("ink.tab.startInking")}
          hint={t("ink.tab.startInkingHint")}
          onClick={noteInk.onStart}
          keepFocus={false}
          showLabel
          style={{ gridRow: "span 2" }}
          className="h-[54px] flex-col gap-0.5 px-3"
        />
        {attachMenu}
      </RibbonGroup>
    );
  }

  // Page is attached - show the canvas board in a popover/panel
  const statusText =
    noteInk.status === "saving"
      ? t("ink.tab.saving")
      : noteInk.status === "saved"
      ? t("ink.tab.saved")
      : t("ink.tab.autosave");

  // CanvasBoard props from noteInk.board
  const board = noteInk.board;
  const inkApi = noteInk.ink;

  return (
    <>
      {/* Main canvas board - rendered in a popover that expands on click */}
      <RibbonGroup label={t("ink.tab.handwriting")} priority={80} icon={PenLine}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "relative w-full aspect-square rounded-lg border border-border/70 bg-[hsl(var(--paper-outside))] shadow-inner shadow-[hsl(var(--shadow)/0.4)] overflow-hidden transition",
            isExpanded && "ring-2 ring-primary/50"
          )}
          style={{ minWidth: 200, minHeight: 200 }}
          aria-label={t("ink.tab.expandCanvas") || "Expand ink canvas"}
        >
          <CanvasBoard
            kind="ink"
            ref={inkApi?.engine}
            strokes={board?.strokes}
            objects={board?.objects}
            paper={board?.paper}
            tool={board?.tool}
            initialCamera={board?.initialCamera}
            onCommit={board?.onCommit}
            onReplace={board?.onReplace}
            onSelection={board?.onSelection}
            onCamera={board?.onCamera}
            onPickColor={board?.onPickColor}
            onEngine={board?.onEngine}
            onInsertSpaceLimited={board?.onInsertSpaceLimited}
            // Object callbacks from inkApi
            onSelectObject={inkApi?.onSelectObject}
            onUpdateObject={inkApi?.updateObject}
            onDeleteObject={inkApi?.deleteObject}
            onBringToFront={inkApi?.bringToFront}
            onSendToBack={inkApi?.sendToBack}
            editingObjectId={inkApi?.editingObjectId}
            setEditingObjectId={inkApi?.setEditingObjectId}
            selectedObjectIds={inkApi?.selectedObjectIds}
            autoFit
            transparent
          />
          {/* Expand indicator */}
          <div className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur text-[10px] text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>{isExpanded ? t("ink.tab.collapse") : t("ink.tab.expand")}</span>
          </div>
        </button>
      </RibbonGroup>

      {/* Page info and controls */}
      <RibbonGroup label={t("ink.tab.handwritingPage")} priority={50} icon={BookOpen}>
        <div
          className="flex flex-col justify-center px-1 font-mono text-[10px] leading-snug text-muted-foreground"
          style={{ gridRow: "span 2", minWidth: "max-content" }}
        >
          <span>{t("ink.tab.marks", { count: noteInk.markCount })}</span>
          <span>{statusText}</span>
        </div>
        {inkApi?.overlayMode !== undefined && (
          <RibbonButton
            icon={Layers}
            label={inkApi.overlayMode ? t("ink.overlay.fullPage") : t("ink.overlay.inkOverText")}
            hint={inkApi.overlayMode ? t("ink.overlay.fullPageHint") : t("ink.overlay.inkOverTextHint")}
            active={Boolean(inkApi.overlayMode)}
            onClick={inkApi.onToggleOverlayMode}
            keepFocus={false}
          />
        )}
        {attachMenu}
        <RibbonButton
          icon={Trash2}
          label={t("ink.tab.removeInk")}
          hint={t("ink.tab.removeInkHint")}
          onClick={noteInk.onRemove}
          keepFocus={false}
        />
      </RibbonGroup>
    </>
  );
}