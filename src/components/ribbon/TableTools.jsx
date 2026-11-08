import { useEffect } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Trash2,
} from "lucide-react";
import RibbonButton from "@/components/ribbon/RibbonButton";
import { commit, useEditorSnapshot } from "@/lib/editor-bridge";
import { tableAt, tableOp } from "@/lib/ribbon-actions";
import { shortcutMatches } from "@/lib/shortcuts";

const OPS = [
  {
    id: "row-above",
    pin: "table.addRowAbove",
    icon: ArrowUpToLine,
    label: "Row above",
    hint: "Add a row above this one",
    shortcut: { alt: true, shift: true, key: "ArrowUp" },
  },
  {
    id: "row-below",
    pin: "table.addRowBelow",
    icon: ArrowDownToLine,
    label: "Row below",
    hint: "Add a row below this one",
    shortcut: { alt: true, shift: true, key: "ArrowDown" },
  },
  {
    id: "column-left",
    pin: "table.addColumnLeft",
    icon: ArrowLeftToLine,
    label: "Column left",
    hint: "Add a column to the left",
    shortcut: { alt: true, shift: true, key: "ArrowLeft" },
  },
  {
    id: "column-right",
    pin: "table.addColumnRight",
    icon: ArrowRightToLine,
    label: "Column right",
    hint: "Add a column to the right",
    shortcut: { alt: true, shift: true, key: "ArrowRight" },
  },
  {
    id: "delete-row",
    pin: "table.deleteRow",
    icon: Trash2,
    label: "Delete row",
    hint: "Remove the row the cursor is on",
    shortcut: { alt: true, shift: true, key: "Backspace" },
  },
  {
    id: "delete-column",
    pin: "table.deleteColumn",
    icon: Trash2,
    label: "Delete column",
    hint: "Remove the column the cursor is in",
    shortcut: { alt: true, shift: true, key: "Delete" },
  },
  {
    id: "delete-table",
    pin: "table.deleteTable",
    icon: Trash2,
    label: "Delete table",
    hint: "Remove the whole table",
    shortcut: { mod: true, alt: true, shift: true, key: "x" },
  },
  {
    id: "align-left",
    pin: "table.alignLeft",
    icon: AlignLeft,
    label: "Left",
    hint: "Align this column left",
    shortcut: { mod: true, alt: true, key: "l" },
  },
  {
    id: "align-centre",
    pin: "table.alignCentre",
    icon: AlignCenter,
    label: "Centre",
    hint: "Centre this column",
    shortcut: { mod: true, alt: true, key: "e" },
  },
  {
    id: "align-right",
    pin: "table.alignRight",
    icon: AlignRight,
    label: "Right",
    hint: "Align this column right",
    shortcut: { mod: true, alt: true, key: "r" },
  },
];

/** Row and column tools; they stay off until the cursor sits inside a table. */
export default function TableTools({ body, onChange }) {  const snap = useEditorSnapshot();
  const value = snap.value || body || "";
  const start = snap.value ? Math.min(snap.start, value.length) : value.length;
  const end = snap.value ? Math.min(snap.end, value.length) : value.length;
  const selection = { value, start, end };
  const inside = Boolean(tableAt(value, start));

  useEffect(() => {
    if (!inside) return undefined;
    const onKey = (event) => {
      const hit = OPS.find((op) => shortcutMatches(event, op.shortcut));
      if (!hit) return;
      event.preventDefault();
      commit(tableOp(selection, hit.id), onChange);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return OPS.map(({ id, pin, icon, label, hint, shortcut }) => (
    <RibbonButton
      key={id}
      id={pin}
      icon={icon}
      label={label}
      hint={hint}
      shortcut={shortcut}
      disabled={!inside}
      disabledReason="Put the cursor inside a table first."
      onClick={() => commit(tableOp(selection, id), onChange)}
    />
  ));
}