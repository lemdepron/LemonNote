import {
  FileText,
  Columns,
  Type,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  GripVertical,
  MoreHorizontal,
  Move,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Group,
  Ungroup,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ChevronRight,
  Trash2,
  Square,
  Star,
  MessageSquareQuote,
  List,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  Layers,
  Redo2,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { RibbonSelect, Stepper, Btn, RibbonMenu, MenuItem, useRibbon } from "@/components/ribbon/RibbonKit";
import {
  PAGE_SIZES,
  PAGE_ORIENTATIONS,
  MARGINS,
  COLUMN_COUNTS,
  COLUMN_GAPS,
} from "@/lib/text-style";
import { insertPageBreak, insertColumnBreak } from "@/lib/format-actions";
import { useEditorSnapshot } from "@/lib/editor-bridge";
import { cn } from "@/lib/utils";
import {
  groupObjects,
  ungroupObjects,
} from "@/lib/ink/objects";

function pageSizeLabel(size) {
  const found = PAGE_SIZES.find((s) => s.id === size);
  return found ? found.label : size;
}

function marginLabel(margin) {
  const found = MARGINS.find((m) => m.id === margin);
  return found ? found.label : margin;
}

// Position presets for a page (794 x 1123 px at 96dpi A4)
const POSITION_PRESETS = [
  { id: "top-left", label: "Top Left", x: 72, y: 72 },
  { id: "top-center", label: "Top Center", x: "center", y: 72 },
  { id: "top-right", label: "Top Right", x: "right", y: 72 },
  { id: "middle-left", label: "Middle Left", x: 72, y: "center" },
  { id: "center", label: "Center", x: "center", y: "center" },
  { id: "middle-right", label: "Middle Right", x: "right", y: "center" },
  { id: "bottom-left", label: "Bottom Left", x: 72, y: "bottom" },
  { id: "bottom-center", label: "Bottom Center", x: "center", y: "bottom" },
  { id: "bottom-right", label: "Bottom Right", x: "right", y: "bottom" },
];

const WRAP_OPTIONS = [
  { value: "inline", label: "In Line with Text", hint: "Object flows with text like a character" },
  { value: "square", label: "Square", hint: "Text wraps around the object's bounding box" },
  { value: "behind", label: "Behind Text", hint: "Object sits behind the text" },
  { value: "front", label: "In Front of Text", hint: "Object sits in front of the text" },
];

export function LayoutTab({ ink }) {
  const { typography: t, setTypography, selection, run, markdown } = useRibbon();
  const snap = useEditorSnapshot();
  const value = snap.value || "";
  const start = snap.value ? Math.min(snap.start, value.length) : value.length;
  const end = snap.value ? Math.min(snap.end, value.length) : value.length;

  const patch = (next) => setTypography({ ...t, ...next });
  const drop = (key) => {
    const next = { ...t };
    delete next[key];
    setTypography(next);
  };

  // Page size options (without "custom" - handled separately)
  const pageSizeOptions = PAGE_SIZES.filter((s) => s.id !== "custom").map((s) => ({ value: s.id, label: s.label }));
  const orientationOptions = PAGE_ORIENTATIONS.map((o) => ({ value: o.id, label: o.label }));
  const marginOptions = MARGINS.filter((m) => m.id !== "custom").map((m) => ({ value: m.id, label: m.label }));

  const handlePageBreak = () => {
    const sel = { value, start, end };
    run(insertPageBreak(sel));
  };

  const handleColumnBreak = () => {
    const sel = { value, start, end };
    run(insertColumnBreak(sel));
  };

  // Paragraph indent/spacing steppers (0.5em steps)
  const indentLeft = t.il !== undefined ? t.il : 0;
  const indentRight = t.ir !== undefined ? t.ir : 0;
  const spacingBefore = t.sb !== undefined ? t.sb : 0;
  const spacingAfter = t.sa !== undefined ? t.sa : 0;

  const stepIndentLeft = (direction) => {
    const next = Math.max(0, Math.round((indentLeft + direction * 0.5) * 10) / 10);
    patch({ il: next || undefined });
  };
  const stepIndentRight = (direction) => {
    const next = Math.max(0, Math.round((indentRight + direction * 0.5) * 10) / 10);
    patch({ ir: next || undefined });
  };
  const stepSpacingBefore = (direction) => {
    const next = Math.max(0, Math.round((spacingBefore + direction * 0.5) * 10) / 10);
    patch({ sb: next || undefined });
  };
  const stepSpacingAfter = (direction) => {
    const next = Math.max(0, Math.round((spacingAfter + direction * 0.5) * 10) / 10);
    patch({ sa: next || undefined });
  };

  const isDisabled = !markdown;

  // Floating object state from ink
  const objects = ink?.objects || [];
  const selectedObjectIds = ink?.selectedObjectIds || [];
  const selectedObjects = objects.filter((o) => selectedObjectIds.includes(o.id));
  const selectedObject = selectedObjects[0]; // Primary selected object (first in selection)
  const hasSelection = selectedObjects.length > 0;
  const updateObject = ink?.updateObject;
  const bringToFront = ink?.bringToFront;
  const sendToBack = ink?.sendToBack;
  const onSelectObject = ink?.onSelectObject;
  const onUndo = ink?.onUndo;
  const onRedo = ink?.onRedo;
  const canUndo = ink?.canUndo;
  const canRedo = ink?.canRedo;

  // Page dimensions for position calculations (A4 at 96dpi: 794 x 1123)
  const pageWidth = 794;
  const pageHeight = 1123;
  const margin = 72; // 1 inch = 72px

  // Sorted objects for selection pane (by z-order back to front)
  const sortedObjects = useMemo(
    () => [...objects].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0)),
    [objects]
  );

  // Calculate position for presets
  const getPresetPosition = (preset, obj) => {
    const w = obj?.width || 100;
    const h = obj?.height || 100;
    let x, y;

    if (preset.x === "center") {
      x = (pageWidth - w) / 2;
    } else if (preset.x === "right") {
      x = pageWidth - margin - w;
    } else {
      x = preset.x;
    }

    if (preset.y === "center") {
      y = (pageHeight - h) / 2;
    } else if (preset.y === "bottom") {
      y = pageHeight - margin - h;
    } else {
      y = preset.y;
    }

    return { x: Math.round(x), y: Math.round(y) };
  };

  // Bring forward/backward (by 1 z-order step)
  const handleBringForward = useCallback(() => {
    if (!hasSelection || !updateObject) return;
    selectedObjects.forEach((selectedObject) => {
      const currentObjects = objects;
      const currentZ = selectedObject.zOrder || 0;
      const nextZ = Math.min(
        ...currentObjects
          .filter((o) => (o.zOrder || 0) > currentZ)
          .map((o) => o.zOrder || 0),
        currentZ + 1
      );
      if (nextZ > currentZ) {
        updateObject(selectedObject.id, { zOrder: nextZ }, { history: true });
      } else {
        bringToFront?.(selectedObject.id);
      }
    });
  }, [hasSelection, selectedObjects, objects, updateObject, bringToFront]);

  const handleSendBackward = useCallback(() => {
    if (!hasSelection || !updateObject) return;
    selectedObjects.forEach((selectedObject) => {
      const currentObjects = objects;
      const currentZ = selectedObject.zOrder || 0;
      const prevZ = Math.max(
        ...currentObjects
          .filter((o) => (o.zOrder || 0) < currentZ)
          .map((o) => o.zOrder || 0),
        currentZ - 1
      );
      if (prevZ < currentZ) {
        updateObject(selectedObject.id, { zOrder: prevZ }, { history: true });
      } else {
        sendToBack?.(selectedObject.id);
      }
    });
  }, [hasSelection, selectedObjects, objects, updateObject, sendToBack]);

  const handleBringToFront = useCallback(() => {
    if (!hasSelection || !bringToFront) return;
    selectedObjects.forEach((obj) => bringToFront(obj.id));
  }, [hasSelection, selectedObjects, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (!hasSelection || !sendToBack) return;
    selectedObjects.forEach((obj) => sendToBack(obj.id));
  }, [hasSelection, selectedObjects, sendToBack]);

  // Align selected objects
  const handleAlign = useCallback((alignment) => {
    if (!hasSelection || !updateObject) return;
    const selected = selectedObjects;
    if (selected.length === 0) return;

    selected.forEach((obj) => {
      let changes = {};

      switch (alignment) {
        case "left":
          changes.x = margin;
          break;
        case "center":
          changes.x = (pageWidth - obj.width) / 2;
          break;
        case "right":
          changes.x = pageWidth - margin - obj.width;
          break;
        case "top":
          changes.y = margin;
          break;
        case "middle":
          changes.y = (pageHeight - obj.height) / 2;
          break;
        case "bottom":
          changes.y = pageHeight - margin - obj.height;
          break;
      }

      if (Object.keys(changes).length > 0) {
        updateObject(obj.id, { ...changes, x: Math.round(changes.x), y: Math.round(changes.y) }, { history: true });
      }
    });
  }, [hasSelection, selectedObjects, updateObject]);

  // Distribute (not implemented for single selection)
  const handleDistribute = useCallback((direction) => {
    // Would need multi-select
    if (!hasSelection || !updateObject) return;
  }, [hasSelection, updateObject]);

  // Rotate
  const handleRotate = useCallback((degrees) => {
    if (!hasSelection || !updateObject) return;
    const radians = degrees * (Math.PI / 180);
    selectedObjects.forEach((obj) => {
      const currentRotation = obj.rotation || 0;
      const newRotation = currentRotation + radians;
      updateObject(obj.id, { rotation: Number(newRotation.toFixed(4)) }, { history: true });
    });
  }, [hasSelection, selectedObjects, updateObject]);

  const handleFlip = useCallback((axis) => {
    if (!hasSelection || !updateObject) return;
    // Flip by adding 180 degrees rotation around the axis
    // For horizontal flip, we'd need to scale X by -1 (not supported yet)
    // For now, rotate 180 degrees
    selectedObjects.forEach((obj) => {
      const currentRotation = obj.rotation || 0;
      const newRotation = currentRotation + Math.PI;
      updateObject(obj.id, { rotation: Number(newRotation.toFixed(4)) }, { history: true });
    });
  }, [hasSelection, selectedObjects, updateObject]);

  // Wrap text
  const handleWrapChange = useCallback((wrap) => {
    if (!hasSelection || !updateObject) return;
    selectedObjects.forEach((obj) => {
      updateObject(obj.id, { wrap }, { history: true });
    });
  }, [hasSelection, selectedObjects, updateObject]);

  // Selection pane state
  const [showSelectionPane, setShowSelectionPane] = useState(false);

  // Group/Ungroup (works on multiple selected objects)
  const handleGroup = useCallback(() => {
    if (!hasSelection || !updateObject) return;
    // Group all selected objects
    const groupedObjects = groupObjects(objects, selectedObjectIds);
    // Apply updates for each grouped object
    groupedObjects.forEach((obj) => {
      if (selectedObjectIds.includes(obj.id) && obj.groupId) {
        updateObject(obj.id, { groupId: obj.groupId }, { history: true });
      }
    });
  }, [hasSelection, selectedObjectIds, objects, updateObject]);

  const handleUngroup = useCallback(() => {
    if (!hasSelection || !updateObject) return;
    // Find groupId from any selected object
    const groupId = selectedObjects.find((o) => o.groupId)?.groupId;
    if (!groupId) return;
    // Get the original grouped object IDs before ungrouping
    const groupedObjectIds = objects.filter((o) => o.groupId === groupId).map((o) => o.id);
    // Ungroup all objects in that group
    const ungroupedObjects = ungroupObjects(objects, groupId);
    ungroupedObjects.forEach((obj) => {
      if (obj.groupId === null && groupedObjectIds.includes(obj.id)) {
        updateObject(obj.id, { groupId: null }, { history: true });
      }
    });
  }, [hasSelection, selectedObjects, objects, updateObject]);

  // Toggle visibility/lock in selection pane
  const handleToggleVisibility = useCallback((id) => {
    if (!updateObject) return;
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      updateObject(id, { visible: obj.visible !== false }, { history: true });
    }
  }, [objects, updateObject]);

  const handleToggleLock = useCallback((id) => {
    if (!updateObject) return;
    const obj = objects.find((o) => o.id === id);
    if (obj) {
      updateObject(id, { locked: obj.locked === true }, { history: true });
    }
  }, [objects, updateObject]);

  // Select object from selection pane
  const handleSelectObject = useCallback((id) => {
    onSelectObject?.(id);
    setShowSelectionPane(false);
  }, [onSelectObject]);

  // Delete object from selection pane
  const handleDeleteObject = useCallback((id) => {
    ink?.deleteObject?.(id);
    setShowSelectionPane(false);
  }, [ink]);

  // Reorder objects in selection pane (drag to reorder changes zOrder)
  const handleReorder = useCallback((fromIndex, toIndex) => {
    if (!updateObject) return;
    const sortedObjects = [...objects].sort((a, b) => (a.zOrder || 0) - (b.zOrder || 0));
    const [moved] = sortedObjects.splice(fromIndex, 1);
    sortedObjects.splice(toIndex, 0, moved);
    // Reassign zOrder based on new order
    sortedObjects.forEach((obj, index) => {
      if (obj.zOrder !== index) {
        updateObject(obj.id, { zOrder: index }, { history: false });
      }
    });
  }, [objects, updateObject]);

  return (
    <>
      {/* 1. Page Setup */}
      <RibbonGroup label="Page setup" icon={FileText} priority={70} more={
        <>
          <Stepper
            id="layout.pageWidth"
            title="Custom page width (mm)"
            value={t.pageWidth || 210}
            min={50}
            max={1000}
            step={1}
            onChange={(pageWidth) => patch({ pageSize: "custom", pageWidth })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
          <Stepper
            id="layout.pageHeight"
            title="Custom page height (mm)"
            value={t.pageHeight || 297}
            min={50}
            max={1000}
            step={1}
            onChange={(pageHeight) => patch({ pageSize: "custom", pageHeight })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
          <Stepper
            id="layout.marginTop"
            title="Top margin (mm)"
            value={t.marginTop !== undefined ? t.marginTop : 25.4}
            min={0}
            max={200}
            step={0.1}
            onChange={(marginTop) => patch({ pageMargins: "custom", marginTop })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
          <Stepper
            id="layout.marginRight"
            title="Right margin (mm)"
            value={t.marginRight !== undefined ? t.marginRight : 25.4}
            min={0}
            max={200}
            step={0.1}
            onChange={(marginRight) => patch({ pageMargins: "custom", marginRight })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
          <Stepper
            id="layout.marginBottom"
            title="Bottom margin (mm)"
            value={t.marginBottom !== undefined ? t.marginBottom : 25.4}
            min={0}
            max={200}
            step={0.1}
            onChange={(marginBottom) => patch({ pageMargins: "custom", marginBottom })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
          <Stepper
            id="layout.marginLeft"
            title="Left margin (mm)"
            value={t.marginLeft !== undefined ? t.marginLeft : 25.4}
            min={0}
            max={200}
            step={0.1}
            onChange={(marginLeft) => patch({ pageMargins: "custom", marginLeft })}
            format={(n) => `${n}mm`}
            disabled={isDisabled}
          />
        </>
      }>
        <RibbonSelect
          id="layout.pageSize"
          title="Paper size for printing and PDF export"
          placeholder="Page size"
          options={pageSizeOptions}
          value={t.pageSize || "a4"}
          onChange={(value) => patch({ pageSize: value })}
          disabled={isDisabled}
        />
        <RibbonSelect
          id="layout.pageOrientation"
          title="Page orientation"
          placeholder="Orientation"
          options={orientationOptions}
          value={t.pageOrientation || "portrait"}
          onChange={(value) => patch({ pageOrientation: value })}
          disabled={isDisabled}
        />
        <RibbonSelect
          id="layout.pageMargins"
          title="Page margins"
          placeholder="Margins"
          options={marginOptions}
          value={t.pageMargins || "normal"}
          onChange={(value) => patch({ pageMargins: value })}
          disabled={isDisabled}
        />
      </RibbonGroup>

      {/* 2. Columns */}
      <RibbonGroup label="Columns" icon={Columns} priority={60}>
        <RibbonSelect
          id="layout.columnCount"
          title="Number of columns in the reader (CSS columns)"
          placeholder="Columns"
          options={COLUMN_COUNTS.map((n) => ({ value: String(n), label: `${n} column${n > 1 ? "s" : ""}` }))}
          value={t.columnCount ? String(t.columnCount) : ""}
          onChange={(value) => (value ? patch({ columnCount: Number(value) }) : drop("columnCount"))}
          disabled={isDisabled}
        />
        <RibbonSelect
          id="layout.columnGap"
          title="Gap between columns (em)"
          placeholder="Column gap"
          options={COLUMN_GAPS.map((n) => ({ value: String(n), label: `${n}em` }))}
          value={t.columnGap ? String(t.columnGap) : ""}
          onChange={(value) => (value ? patch({ columnGap: Number(value) }) : drop("columnGap"))}
          disabled={isDisabled}
        />
        <Btn
          id="layout.columnBreak"
          icon={GripVertical}
          label="Column break"
          hint="Insert a column break at the cursor (forces next content to next column)"
          onClick={handleColumnBreak}
          disabled={isDisabled}
        />
        <Btn
          id="layout.pageBreak"
          icon={FileText}
          label="Page break"
          hint="Insert a page break at the cursor (forces next content to next page when printing)"
          onClick={handlePageBreak}
          disabled={isDisabled}
        />
      </RibbonGroup>

      {/* 3. Editor */}
      <RibbonGroup label="Editor" icon={Type} priority={50}>
        <Btn
          id="layout.lineNumbers"
          icon={Maximize2}
          label="Line numbers"
          hint="Show line numbers in the writing box (gutter that scrolls with the text)"
          active={Boolean(t.showLineNumbers)}
          onClick={() => patch({ showLineNumbers: !t.showLineNumbers })}
          disabled={isDisabled}
        />
        <RibbonSelect
          id="layout.hyphens"
          title="Hyphenation in the reader and editor"
          placeholder="Hyphenation"
          options={[
            { value: "auto", label: "Auto (CSS hyphens: auto)" },
            { value: "none", label: "None" },
          ]}
          value={t.hyphens || "none"}
          onChange={(value) => (value && value !== "none" ? patch({ hyphens: value }) : drop("hyphens"))}
          disabled={isDisabled}
        />
      </RibbonGroup>

      {/* 4. Paragraph (Indent & Spacing) */}
      <RibbonGroup label="Paragraph" icon={AlignLeft} priority={40} more={
        <>
          <Btn
            id="layout.alignCenter"
            icon={AlignCenter}
            label="Centre"
            hint="Centre selected paragraphs"
            active={t.a === "center"}
            onClick={() => (t.a === "center" ? drop("a") : patch({ a: "center" }))}
            disabled={isDisabled}
          />
          <Btn
            id="layout.alignRight"
            icon={AlignRight}
            label="Align right"
            hint="Align selected paragraphs right"
            active={t.a === "right"}
            onClick={() => (t.a === "right" ? drop("a") : patch({ a: "right" }))}
            disabled={isDisabled}
          />
          <Btn
            id="layout.alignJustify"
            icon={AlignJustify}
            label="Justify"
            hint="Justify selected paragraphs"
            active={t.a === "justify"}
            onClick={() => (t.a === "justify" ? drop("a") : patch({ a: "justify" }))}
            disabled={isDisabled}
          />
        </>
      }>
        <Stepper
          id="layout.indentLeft"
          title="Indent left (em) — 0.5em steps"
          value={indentLeft}
          min={0}
          max={20}
          step={0.5}
          onChange={(il) => patch({ il: il || undefined })}
          format={(n) => `${n}em`}
          disabled={isDisabled}
        />
        <Stepper
          id="layout.indentRight"
          title="Indent right (em) — 0.5em steps"
          value={indentRight}
          min={0}
          max={20}
          step={0.5}
          onChange={(ir) => patch({ ir: ir || undefined })}
          format={(n) => `${n}em`}
          disabled={isDisabled}
        />
        <Stepper
          id="layout.spacingBefore"
          title="Spacing before (em) — 0.5em steps"
          value={spacingBefore}
          min={0}
          max={20}
          step={0.5}
          onChange={(sb) => patch({ sb: sb || undefined })}
          format={(n) => `${n}em`}
          disabled={isDisabled}
        />
        <Stepper
          id="layout.spacingAfter"
          title="Spacing after (em) — 0.5em steps"
          value={spacingAfter}
          min={0}
          max={20}
          step={0.5}
          onChange={(sa) => patch({ sa: sa || undefined })}
          format={(n) => `${n}em`}
          disabled={isDisabled}
        />
        <Btn
          id="layout.alignLeft"
          icon={AlignLeft}
          label="Align left"
          hint="Align selected paragraphs left"
          active={t.a === "left"}
          onClick={() => (t.a === "left" ? drop("a") : patch({ a: "left" }))}
          disabled={isDisabled}
        />
      </RibbonGroup>

      {/* 5. Floating Objects */}
      <RibbonGroup label="Floating objects" icon={MoreHorizontal} priority={30} more={
        <>
          <Btn
            id="layout.sendToBack"
            icon={Layers}
            label="Send to Back"
            hint="Move the selected object to the back layer"
            onClick={handleSendToBack}
            disabled={!hasSelection}
          />
          <Btn
            id="layout.selectionPane"
            icon={List}
            label="Selection Pane"
            hint="Show a panel listing all floating objects with visibility and lock controls"
            active={showSelectionPane}
            onClick={() => setShowSelectionPane((prev) => !prev)}
            disabled={objects.length === 0}
          />
          <RibbonMenu
            id="layout.align"
            icon={AlignHorizontalDistributeCenter}
            label="Align"
            hint="Align the selected object relative to the page"
            width={200}
            disabled={!hasSelection}
          >
            {(close) => (
              <div className="p-1">
                {[
                  { id: "left", label: "Align Left", icon: AlignLeft },
                  { id: "center", label: "Align Center", icon: AlignCenter },
                  { id: "right", label: "Align Right", icon: AlignRight },
                  { id: "top", label: "Align Top", icon: Move },
                  { id: "middle", label: "Align Middle", icon: Move },
                  { id: "bottom", label: "Align Bottom", icon: Move },
                ].map((opt) => (
                  <MenuItem
                    key={opt.id}
                    onClick={() => {
                      handleAlign(opt.id);
                      close();
                    }}
                  >
                    <opt.icon className="h-3.5 w-3.5 mr-1" />
                    {opt.label}
                  </MenuItem>
                ))}
                <MenuItem disabled className="border-t border-border/50 my-1" />
                {[
                  { id: "h-distribute", label: "Distribute Horizontally", icon: AlignHorizontalDistributeCenter },
                  { id: "v-distribute", label: "Distribute Vertically", icon: AlignVerticalDistributeCenter },
                ].map((opt) => (
                  <MenuItem
                    key={opt.id}
                    onClick={() => {
                      handleDistribute(opt.id);
                      close();
                    }}
                    disabled={true}
                    title="Requires multiple objects selected"
                  >
                    <opt.icon className="h-3.5 w-3.5 mr-1" />
                    {opt.label}
                  </MenuItem>
                ))}
              </div>
            )}
          </RibbonMenu>
          <RibbonMenu
            id="layout.group"
            icon={Group}
            label="Group"
            hint="Group or ungroup selected objects"
            width={180}
            disabled={!hasSelection}
          >
            {(close) => (
              <div className="p-1">
                <MenuItem
                  onClick={() => {
                    handleGroup();
                    close();
                  }}
                  disabled={selectedObject?.groupId}
                >
                  <Group className="h-3.5 w-3.5 mr-1" />
                  Group
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleUngroup();
                    close();
                  }}
                  disabled={!selectedObject?.groupId}
                >
                  <Ungroup className="h-3.5 w-3.5 mr-1" />
                  Ungroup
                </MenuItem>
              </div>
            )}
          </RibbonMenu>
          <RibbonMenu
            id="layout.rotate"
            icon={RotateCw}
            label="Rotate"
            hint="Rotate or flip the selected object"
            width={220}
            disabled={!hasSelection}
          >
            {(close) => (
              <div className="p-1 space-y-1">
                <MenuItem
                  onClick={() => {
                    handleRotate(-90);
                    close();
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Rotate Right 90°
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleRotate(90);
                    close();
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1" />
                  Rotate Left 90°
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleRotate(180);
                    close();
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1 rotate-180" />
                  Rotate 180°
                </MenuItem>
                <hr className="border-border/50 my-1" />
                <MenuItem
                  onClick={() => {
                    handleFlip("horizontal");
                    close();
                  }}
                >
                  <FlipHorizontal className="h-3.5 w-3.5 mr-1" />
                  Flip Horizontal
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleFlip("vertical");
                    close();
                  }}
                >
                  <FlipVertical className="h-3.5 w-3.5 mr-1" />
                  Flip Vertical
                </MenuItem>
                <hr className="border-border/50 my-1" />
                <MenuItem className="p-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    placeholder="Custom angle (degrees)"
                    value={selectedObject?.rotation ? Math.round(selectedObject.rotation * 180 / Math.PI) : 0}
                    onChange={(e) => {
                      if (!selectedObject || !updateObject) return;
                      const degrees = parseFloat(e.target.value) || 0;
                      const radians = degrees * (Math.PI / 180);
                      updateObject(selectedObject.id, { rotation: Number(radians.toFixed(4)) }, { history: true });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") close();
                      e.stopPropagation();
                    }}
                    className="w-full h-8 px-2 text-[11px] rounded border border-border/70 bg-card/60 outline-none focus:border-primary/40"
                  />
                </MenuItem>
              </div>
            )}
          </RibbonMenu>
          <Btn
            id="layout.undo"
            icon={RotateCcw}
            label="Undo"
            hint="Undo last floating object change (Ctrl+Z)"
            onClick={onUndo}
            disabled={!canUndo}
          />
          <Btn
            id="layout.redo"
            icon={Redo2}
            label="Redo"
            hint="Redo last floating object change (Ctrl+Shift+Z)"
            onClick={onRedo}
            disabled={!canRedo}
          />
        </>
      }>
        {/* Position */}
        <RibbonMenu
          id="layout.position"
          icon={Move}
          label="Position"
          hint="Move the selected object to a preset position on the page"
          width={220}
          disabled={!hasSelection}
        >
          {(close) => (
            <div className="p-1">
              {POSITION_PRESETS.map((preset) => (
                <MenuItem
                  key={preset.id}
                  onClick={() => {
                    if (!selectedObject || !updateObject) return;
                    const pos = getPresetPosition(preset, selectedObject);
                    updateObject(selectedObject.id, pos, { history: true });
                    close();
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="font-mono text-[10px] text-muted-foreground w-20">{preset.label}</span>
                  <div className="flex-1 h-1 bg-border/50" />
                </MenuItem>
              ))}
            </div>
          )}
        </RibbonMenu>

        {/* Wrap Text */}
        <RibbonMenu
          id="layout.wrapText"
          icon={MoveHorizontal}
          label="Wrap Text"
          hint="Choose how text wraps around the selected object"
          width={260}
          disabled={!hasSelection}
        >
          {(close) => (
            <div className="p-1">
              {WRAP_OPTIONS.map((opt) => (
                <MenuItem
                  key={opt.value}
                  onClick={() => {
                    handleWrapChange(opt.value);
                    close();
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{opt.hint}</span>
                </MenuItem>
              ))}
            </div>
          )}
        </RibbonMenu>

        {/* Bring Forward */}
        <Btn
          id="layout.bringForward"
          icon={ArrowUp}
          label="Bring Forward"
          hint="Move the selected object one layer forward"
          onClick={handleBringForward}
          disabled={!hasSelection}
        />

        {/* Send Backward */}
        <Btn
          id="layout.sendBackward"
          icon={ArrowDown}
          label="Send Backward"
          hint="Move the selected object one layer backward"
          onClick={handleSendBackward}
          disabled={!hasSelection}
        />

        {/* Bring to Front */}
        <Btn
          id="layout.bringToFront"
          icon={Layers}
          label="Bring to Front"
          hint="Move the selected object to the front layer"
          onClick={handleBringToFront}
          disabled={!hasSelection}
        />
      </RibbonGroup>

      {/* Selection Pane Panel */}
      {showSelectionPane && objects.length > 0 && (
        <div
          className="fixed bottom-0 right-0 z-50 w-72 max-h-[60vh] bg-card border border-border/80 shadow-xl flex flex-col"
          style={{ borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}
          role="dialog"
          aria-label="Selection Pane"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="font-mono text-[11px] font-medium">Selection Pane</span>
            <button
              type="button"
              onClick={() => setShowSelectionPane(false)}
              className="p-1 rounded hover:bg-accent transition"
              aria-label="Close selection pane"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Objects listed in z-order (back to front) */}
            {sortedObjects.map((obj, index) => {
                const isSelected = selectedObjectIds.includes(obj.id);
                const typeIcons = {
                  shape: <Square className="h-3.5 w-3.5" />,
                  sticker: <Star className="h-3.5 w-3.5" />,
                  textbox: <FileText className="h-3.5 w-3.5" />,
                  sticky: <MessageSquareQuote className="h-3.5 w-3.5" />,
                };
                const TypeIcon = typeIcons[obj.type] || <FileText className="h-3.5 w-3.5" />;

                return (
                  <div
                    key={obj.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded transition",
                      isSelected ? "bg-primary/15" : "hover:bg-accent"
                    )}
                    onClick={() => handleSelectObject(obj.id)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(index));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
                      if (fromIndex !== index) {
                        handleReorder(fromIndex, index);
                      }
                    }}
                  >
                    {/* Visibility */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleVisibility(obj.id); }}
                      className="p-0.5 rounded hover:bg-accent transition text-muted-foreground"
                      aria-label={obj.visible !== false ? "Hide object" : "Show object"}
                      title={obj.visible !== false ? "Visible (click to hide)" : "Hidden (click to show)"}
                    >
                      {obj.visible !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>

                    {/* Lock */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(obj.id); }}
                      className="p-0.5 rounded hover:bg-accent transition text-muted-foreground"
                      aria-label={obj.locked ? "Unlock object" : "Lock object"}
                      title={obj.locked ? "Locked (click to unlock)" : "Unlocked (click to lock)"}
                    >
                      {obj.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                    </button>

                    {/* Type icon */}
                    <span className="text-muted-foreground">{TypeIcon}</span>

                    {/* Name */}
                    <span className="flex-1 truncate text-[12px]">{obj.type === "textbox" ? (obj.text || "Text box") : obj.type === "sticky" ? (obj.text || "Sticky note") : obj.type === "sticker" ? `Sticker: ${obj.stickerId}` : `Shape: ${obj.shapeType}`}</span>

                    {/* Z-order indicator */}
                    <span className="font-mono text-[10px] text-muted-foreground/60">{obj.zOrder ?? index}</span>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteObject(obj.id); }}
                      className="p-0.5 rounded hover:bg-accent transition text-muted-foreground"
                      aria-label="Delete object"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
              );
            })}
          </div>

          <div className="border-t border-border p-2 text-[10px] text-muted-foreground font-mono">
            Drag to reorder (changes layer order). Click to select. Eye = visibility, Lock = prevent selection.
          </div>
        </div>
      )}
    </>
  );
}