import { useState } from "react";
import { cn } from "@/lib/utils";
import { OBJECT_TYPES, FRAME_TYPES, SHAPE_TYPES, STICKERS } from "@/lib/canvas/objects";

// Inline icons to avoid extra imports
const icons = {
  Link2: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Trash2: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2m3 0-1 14H6L5 6" />
      <path d="M10 11v5m4-5v5" />
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  ),
  Lock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Unlock: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <line x1="12" y1="16" x2="12" y2="16" />
    </svg>
  ),
  Eye: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Square: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  Type: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  Image: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  FileText: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  ArrowRight: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Minus: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Layers: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  PenLine: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  MousePointer: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  Maximize2: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  RotateCcw: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <polyline points="3 3 3 9 9 9" />
    </svg>
  ),
  ChevronDown: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronUp: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  MinusCircle: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  PlusCircle: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Settings: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

/** Label component for form fields */
function FieldLabel({ children, className }) {
  return (
    <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-1", className)}>
      {children}
    </span>
  );
}

/** Input component */
function Input({ value, onChange, type = "text", placeholder, className, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40", className)}
      {...props}
    />
  );
}

/** Number input */
function NumberInput({ value, onChange, step = "0.1", placeholder, className, ...props }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      placeholder={placeholder}
      className={cn("h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40", className)}
      {...props}
    />
  );
}

/** Select component */
function Select({ value, onChange, options, className, ...props }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 w-full rounded-lg border border-border/80 bg-background/60 px-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/40", className)}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/** Textarea component */
function Textarea({ value, onChange, rows = 3, placeholder, className, ...props }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className={cn("w-full resize-y rounded-lg border border-border/80 bg-background/60 px-2.5 py-2 text-[12.5px] leading-relaxed text-foreground outline-none transition focus:border-primary/40", className)}
      {...props}
    />
  );
}

/** Checkbox component */
function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-foreground cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border/80 text-primary focus:ring-primary/50"
      />
      <span>{label}</span>
    </label>
  );
}

/** Section divider */
function Section({ title, children, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</p>}
      {children}
    </div>
  );
}

/** Collapsible section */
function CollapsibleSection({ title, children, defaultOpen = true, className }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("border-t border-border/60 pt-3", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-1 py-1 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      >
        <span>{title}</span>
        {open ? <icons.ChevronUp className="h-3 w-3" /> : <icons.ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

/** Delete button */
function DeleteButton({ onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/30 text-[12.5px] text-destructive/90 transition hover:bg-destructive/10", className)}
    >
      <icons.Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}

/** Lock toggle button */
function LockButton({ locked, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[12.5px] transition", className, locked ? "border-primary/50 bg-primary/10 text-primary" : "border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground")}
    >
      {locked ? <icons.Unlock className="h-3.5 w-3.5" /> : <icons.Lock className="h-3.5 w-3.5" />}
      <span>{locked ? "Unlock" : "Lock"}</span>
    </button>
  );
}

/** Visibility toggle button */
function VisibilityButton({ visible, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[12.5px] transition", className, visible ? "border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground" : "border-destructive/30 text-destructive/90 hover:bg-destructive/10")}
    >
      {visible ? <icons.Eye className="h-3.5 w-3.5" /> : <icons.EyeOff className="h-3.5 w-3.5" />}
      <span>{visible ? "Hide" : "Show"}</span>
    </button>
  );
}

/** Z-order buttons */
function ZOrderButtons({ object, objects, onUpdate, className }) {
  const maxZ = Math.max(...objects.map((o) => o.zOrder || 0), 0);
  const minZ = Math.min(...objects.map((o) => o.zOrder || 0), 0);
  const isTop = (object.zOrder || 0) >= maxZ;
  const isBottom = (object.zOrder || 0) <= minZ;

  return (
    <div className={cn("flex gap-1", className)}>
      <button
        type="button"
        onClick={() => onUpdate(object.id, { zOrder: maxZ + 1 })}
        disabled={isTop}
        className="flex-1 px-2 py-1 rounded border border-border/80 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
        title="Bring to front"
      >
        <icons.PlusCircle className="h-3 w-3 mx-auto" />
      </button>
      <button
        type="button"
        onClick={() => onUpdate(object.id, { zOrder: minZ - 1 })}
        disabled={isBottom}
        className="flex-1 px-2 py-1 rounded border border-border/80 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
        title="Send to back"
      >
        <icons.MinusCircle className="h-3 w-3 mx-auto" />
      </button>
    </div>
  );
}

/** Common position/size/rotation fields */
function TransformFields({ object, onChange, className }) {
  return (
    <Section title="Transform" className={className}>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <FieldLabel>X</FieldLabel>
          <NumberInput value={object.x} onChange={(v) => onChange(object.id, { x: v })} step="0.1" />
        </label>
        <label>
          <FieldLabel>Y</FieldLabel>
          <NumberInput value={object.y} onChange={(v) => onChange(object.id, { y: v })} step="0.1" />
        </label>
        <label>
          <FieldLabel>Width</FieldLabel>
          <NumberInput value={object.width} onChange={(v) => onChange(object.id, { width: v })} step="0.1" />
        </label>
        <label>
          <FieldLabel>Height</FieldLabel>
          <NumberInput value={object.height} onChange={(v) => onChange(object.id, { height: v })} step="0.1" />
        </label>
        <label className="col-span-2">
          <FieldLabel>Rotation (deg)</FieldLabel>
          <NumberInput value={object.rotation || 0} onChange={(v) => onChange(object.id, { rotation: v })} step="1" />
        </label>
      </div>
    </Section>
  );
}

/** Common visibility/lock/z-order fields */
function DisplayFields({ object, objects, onChange, onDelete, className }) {
  return (
    <Section title="Display" className={className}>
      <div className="flex flex-wrap gap-2">
        <VisibilityButton visible={object.visible} onClick={() => onChange(object.id, { visible: !object.visible })} />
        <LockButton locked={object.locked} onClick={() => onChange(object.id, { locked: !object.locked })} />
      </div>
      <ZOrderButtons object={object} objects={objects} onUpdate={onChange} />
      <DeleteButton onClick={() => onDelete(object.id)} />
    </Section>
  );
}

/** Card inspector */
function CardInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Content">
        <label>
          <FieldLabel>Title</FieldLabel>
          <Input value={object.title} onChange={(v) => onChange(object.id, { title: v })} placeholder="Card title" />
        </label>
        <label>
          <FieldLabel>Body</FieldLabel>
          <Textarea value={object.body} onChange={(v) => onChange(object.id, { body: v })} rows={4} placeholder="Card body (markdown supported)" />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Title Color</FieldLabel>
            <Input value={object.titleColor || "#e9e2d0"} onChange={(v) => onChange(object.id, { titleColor: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Body Color</FieldLabel>
            <Input value={object.bodyColor || "#e9e2d0"} onChange={(v) => onChange(object.id, { bodyColor: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Background</FieldLabel>
            <Input value={object.background || "transparent"} onChange={(v) => onChange(object.id, { background: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Border Color</FieldLabel>
            <Input value={object.borderColor || "#e5b567"} onChange={(v) => onChange(object.id, { borderColor: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Border Width</FieldLabel>
            <NumberInput value={object.borderWidth || 1.5} onChange={(v) => onChange(object.id, { borderWidth: v })} step="0.5" />
          </label>
          <label>
            <FieldLabel>Border Radius</FieldLabel>
            <NumberInput value={object.borderRadius || 8} onChange={(v) => onChange(object.id, { borderRadius: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Padding</FieldLabel>
            <NumberInput value={object.padding || 12} onChange={(v) => onChange(object.id, { padding: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Font Size</FieldLabel>
            <NumberInput value={object.fontSize || 14} onChange={(v) => onChange(object.id, { fontSize: v })} step="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Connector inspector */
function ConnectorInspector({ object, objects, onChange, onDelete, t }) {
  const nonConnectorObjects = objects.filter((o) => o.type !== OBJECT_TYPES.CONNECTOR);
  const objectOptions = nonConnectorObjects.map((o) => ({
    value: o.id,
    label: o.title || o.type || o.id,
  }));

  return (
    <div className="space-y-3">
      <Section title="Connection">
        <label>
          <FieldLabel>From</FieldLabel>
          <Select value={object.from} onChange={(v) => onChange(object.id, { from: v })} options={objectOptions} />
        </label>
        <label>
          <FieldLabel>To</FieldLabel>
          <Select value={object.to} onChange={(v) => onChange(object.id, { to: v })} options={objectOptions} />
        </label>
        <label>
          <FieldLabel>Style</FieldLabel>
          <Select value={object.style} onChange={(v) => onChange(object.id, { style: v })} options={[
            { value: "straight", label: "Straight" },
            { value: "elbow", label: "Elbow" },
            { value: "curved", label: "Curved" },
          ]} />
        </label>
        <div className="flex gap-2">
          <Checkbox checked={object.startArrow} onChange={(v) => onChange(object.id, { startArrow: v })} label="Start Arrow" />
          <Checkbox checked={object.endArrow} onChange={(v) => onChange(object.id, { endArrow: v })} label="End Arrow" />
        </div>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Stroke Color</FieldLabel>
            <Input value={object.stroke || "#e5b567"} onChange={(v) => onChange(object.id, { stroke: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Stroke Width</FieldLabel>
            <NumberInput value={object.strokeWidth || 2} onChange={(v) => onChange(object.id, { strokeWidth: v })} step="0.5" />
          </label>
          <label>
            <FieldLabel>Stroke Style</FieldLabel>
            <Select value={object.strokeDash} onChange={(v) => onChange(object.id, { strokeDash: v })} options={[
              { value: "solid", label: "Solid" },
              { value: "dash", label: "Dashed" },
              { value: "dot", label: "Dotted" },
            ]} />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Frame inspector */
function FrameInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Frame">
        <label>
          <FieldLabel>Name</FieldLabel>
          <Input value={object.name || ""} onChange={(v) => onChange(object.id, { name: v })} placeholder="Page 1" />
        </label>
        <label>
          <FieldLabel>Frame Type</FieldLabel>
          <Select value={object.frameType} onChange={(v) => onChange(object.id, { frameType: v })} options={FRAME_TYPES.map((ft) => ({ value: ft.id, label: ft.label }))} />
        </label>
        <CollapsibleSection title="Paper Settings">
          <div className="grid grid-cols-2 gap-2">
            <label>
              <FieldLabel>Template</FieldLabel>
              <Select value={object.paper?.template || "grid"} onChange={(v) => onChange(object.id, { paper: { ...object.paper, template: v } })} options={[
                { value: "blank", label: "Blank" },
                { value: "ruled", label: "Ruled" },
                { value: "grid", label: "Grid" },
                { value: "dots", label: "Dotted" },
                { value: "stave", label: "Stave" },
                { value: "iso", label: "Isometric" },
              ]} />
            </label>
            <label>
              <FieldLabel>Tone</FieldLabel>
              <Select value={object.paper?.tone || "dark"} onChange={(v) => onChange(object.id, { paper: { ...object.paper, tone: v } })} options={[
                { value: "dark", label: "Slate" },
                { value: "light", label: "Paper" },
              ]} />
            </label>
          </div>
        </CollapsibleSection>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Fill</FieldLabel>
            <Input value={object.fill || "none"} onChange={(v) => onChange(object.id, { fill: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Stroke</FieldLabel>
            <Input value={object.stroke || "#e5b567"} onChange={(v) => onChange(object.id, { stroke: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Stroke Width</FieldLabel>
            <NumberInput value={object.strokeWidth || 2} onChange={(v) => onChange(object.id, { strokeWidth: v })} step="0.5" />
          </label>
          <label>
            <FieldLabel>Stroke Style</FieldLabel>
            <Select value={object.strokeDash} onChange={(v) => onChange(object.id, { strokeDash: v })} options={[
              { value: "solid", label: "Solid" },
              { value: "dash", label: "Dashed" },
              { value: "dot", label: "Dotted" },
            ]} />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Text Frame inspector */
function TextFrameInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Content">
        <label>
          <FieldLabel>Markdown</FieldLabel>
          <Textarea value={object.markdown || ""} onChange={(v) => onChange(object.id, { markdown: v })} rows={6} placeholder="Enter markdown content..." />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Font Size</FieldLabel>
            <NumberInput value={object.fontSize || 16} onChange={(v) => onChange(object.id, { fontSize: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Font Family</FieldLabel>
            <Input value={object.fontFamily || "inherit"} onChange={(v) => onChange(object.id, { fontFamily: v })} placeholder="inherit" />
          </label>
          <label>
            <FieldLabel>Text Color</FieldLabel>
            <Input value={object.color || "#e9e2d0"} onChange={(v) => onChange(object.id, { color: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Background</FieldLabel>
            <Input value={object.background || "transparent"} onChange={(v) => onChange(object.id, { background: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Alignment</FieldLabel>
            <Select value={object.align || "left"} onChange={(v) => onChange(object.id, { align: v })} options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]} />
          </label>
          <label>
            <FieldLabel>Padding</FieldLabel>
            <NumberInput value={object.padding || 8} onChange={(v) => onChange(object.id, { padding: v })} step="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Image inspector */
function ImageInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Image">
        <label>
          <FieldLabel>Source (local:... or URL)</FieldLabel>
          <Input value={object.src || ""} onChange={(v) => onChange(object.id, { src: v })} placeholder="local:abc123 or https://..." />
        </label>
        <label>
          <FieldLabel>Alt Text</FieldLabel>
          <Input value={object.alt || ""} onChange={(v) => onChange(object.id, { alt: v })} placeholder="Accessibility description" />
        </label>
        <label>
          <FieldLabel>Fit Mode</FieldLabel>
          <Select value={object.fit || "cover"} onChange={(v) => onChange(object.id, { fit: v })} options={[
            { value: "cover", label: "Cover" },
            { value: "contain", label: "Contain" },
            { value: "fill", label: "Fill" },
            { value: "none", label: "None" },
          ]} />
        </label>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** PDF Page inspector */
function PdfPageInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="PDF Page">
        <label>
          <FieldLabel>File ID (local:...)</FieldLabel>
          <Input value={object.fileId || ""} onChange={(v) => onChange(object.id, { fileId: v })} placeholder="local:abc123" />
        </label>
        <label>
          <FieldLabel>Page Number</FieldLabel>
          <NumberInput value={object.pageNumber || 1} onChange={(v) => onChange(object.id, { pageNumber: v })} step="1" min="1" />
        </label>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Shape inspector */
function ShapeInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Shape">
        <label>
          <FieldLabel>Shape Type</FieldLabel>
          <Select value={object.shapeType} onChange={(v) => onChange(object.id, { shapeType: v })} options={SHAPE_TYPES.map((s) => ({ value: s.id, label: s.label }))} />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Fill</FieldLabel>
            <Input value={object.fill || "none"} onChange={(v) => onChange(object.id, { fill: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Stroke</FieldLabel>
            <Input value={object.stroke || "#e9e2d0"} onChange={(v) => onChange(object.id, { stroke: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Stroke Width</FieldLabel>
            <NumberInput value={object.strokeWidth || 2} onChange={(v) => onChange(object.id, { strokeWidth: v })} step="0.5" />
          </label>
          <label>
            <FieldLabel>Stroke Style</FieldLabel>
            <Select value={object.strokeDash || "solid"} onChange={(v) => onChange(object.id, { strokeDash: v })} options={[
              { value: "solid", label: "Solid" },
              { value: "dash", label: "Dashed" },
              { value: "dot", label: "Dotted" },
            ]} />
          </label>
          <label>
            <FieldLabel>Opacity</FieldLabel>
            <NumberInput value={object.opacity || 1} onChange={(v) => onChange(object.id, { opacity: v })} step="0.1" min="0" max="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Sticker inspector */
function StickerInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Sticker">
        <label>
          <FieldLabel>Sticker</FieldLabel>
          <Select value={object.stickerId} onChange={(v) => onChange(object.id, { stickerId: v })} options={STICKERS.map((s) => ({ value: s.id, label: s.label }))} />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Color</FieldLabel>
            <Input value={object.color || "#e9e2d0"} onChange={(v) => onChange(object.id, { color: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Opacity</FieldLabel>
            <NumberInput value={object.opacity || 1} onChange={(v) => onChange(object.id, { opacity: v })} step="0.1" min="0" max="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Textbox inspector */
function TextboxInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Text">
        <label>
          <FieldLabel>Content</FieldLabel>
          <Textarea value={object.text || ""} onChange={(v) => onChange(object.id, { text: v })} rows={4} placeholder="Text content" />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Font Size</FieldLabel>
            <NumberInput value={object.fontSize || 16} onChange={(v) => onChange(object.id, { fontSize: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Font Family</FieldLabel>
            <Input value={object.fontFamily || "inherit"} onChange={(v) => onChange(object.id, { fontFamily: v })} placeholder="inherit" />
          </label>
          <label>
            <FieldLabel>Text Color</FieldLabel>
            <Input value={object.color || "#e9e2d0"} onChange={(v) => onChange(object.id, { color: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Background</FieldLabel>
            <Input value={object.background || "transparent"} onChange={(v) => onChange(object.id, { background: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Alignment</FieldLabel>
            <Select value={object.align || "left"} onChange={(v) => onChange(object.id, { align: v })} options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]} />
          </label>
          <label>
            <FieldLabel>Padding</FieldLabel>
            <NumberInput value={object.padding || 8} onChange={(v) => onChange(object.id, { padding: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Opacity</FieldLabel>
            <NumberInput value={object.opacity || 1} onChange={(v) => onChange(object.id, { opacity: v })} step="0.1" min="0" max="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Sticky inspector */
function StickyInspector({ object, objects, onChange, onDelete, t }) {
  return (
    <div className="space-y-3">
      <Section title="Note">
        <label>
          <FieldLabel>Content</FieldLabel>
          <Textarea value={object.text || ""} onChange={(v) => onChange(object.id, { text: v })} rows={5} placeholder="Sticky note content" />
        </label>
      </Section>
      <Section title="Appearance">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <FieldLabel>Font Size</FieldLabel>
            <NumberInput value={object.fontSize || 14} onChange={(v) => onChange(object.id, { fontSize: v })} step="1" />
          </label>
          <label>
            <FieldLabel>Font Family</FieldLabel>
            <Input value={object.fontFamily || "inherit"} onChange={(v) => onChange(object.id, { fontFamily: v })} placeholder="inherit" />
          </label>
          <label>
            <FieldLabel>Text Color</FieldLabel>
            <Input value={object.color || "#111827"} onChange={(v) => onChange(object.id, { color: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Background</FieldLabel>
            <Input value={object.background || "#fef08a"} onChange={(v) => onChange(object.id, { background: v })} type="color" />
          </label>
          <label>
            <FieldLabel>Opacity</FieldLabel>
            <NumberInput value={object.opacity || 1} onChange={(v) => onChange(object.id, { opacity: v })} step="0.1" min="0" max="1" />
          </label>
        </div>
      </Section>
      <TransformFields object={object} onChange={onChange} />
      <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
    </div>
  );
}

/** Main unified inspector */
export default function CanvasInspector({ object, objects = [], onChange, onDelete, t, linking, onStartLink, onCancelLink, onRemoveEdge }) {
  if (!object) {
    return (
      <aside className="rounded-xl border border-border/70 bg-card/30 p-4">
        <p className="nb-label">inspector</p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Select an object to edit its properties.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 font-mono text-[10.5px] text-muted-foreground">
          <dt>objects</dt>
          <dd className="text-right text-foreground/80">{objects.length}</dd>
          <dt>cards</dt>
          <dd className="text-right text-foreground/80">{objects.filter((o) => o.type === OBJECT_TYPES.CARD).length}</dd>
          <dt>connectors</dt>
          <dd className="text-right text-foreground/80">{objects.filter((o) => o.type === OBJECT_TYPES.CONNECTOR).length}</dd>
          <dt>strokes</dt>
          <dd className="text-right text-foreground/80">{objects.filter((o) => o.kind === "stroke").length}</dd>
        </dl>
      </aside>
    );
  }

  // Legacy linking mode for cards
  if (linking && object.type === OBJECT_TYPES.CARD) {
    return (
      <aside className="rounded-xl border border-border/70 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="nb-label">card</p>
          <span className="font-mono text-[10px] text-muted-foreground">{Math.round(object.x)}, {Math.round(object.y)}</span>
        </div>
        <label className="mt-3 block">
          <FieldLabel>title</FieldLabel>
          <Input value={object.title} onChange={(v) => onChange(object.id, { title: v })} placeholder="Card title" />
        </label>
        <label className="mt-3 block">
          <FieldLabel>text</FieldLabel>
          <Textarea value={object.body} onChange={(v) => onChange(object.id, { body: v })} rows={5} placeholder="What is this thought?" />
        </label>
        <button
          type="button"
          onClick={onCancelLink}
          className={cn("mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border text-[12.5px] transition", "border-primary/50 bg-primary/10 text-primary")}
        >
          <icons.Link2 className="h-3.5 w-3.5" />
          Cancel — pick another card
        </button>
        <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
      </aside>
    );
  }

  // Render type-specific inspector
  const renderInspector = () => {
    switch (object.type) {
      case OBJECT_TYPES.CARD:
        return <CardInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.CONNECTOR:
        return <ConnectorInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.FRAME:
        return <FrameInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.TEXT_FRAME:
        return <TextFrameInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.IMAGE:
        return <ImageInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.PDF_PAGE:
        return <PdfPageInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.SHAPE:
        return <ShapeInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.STICKER:
        return <StickerInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.TEXTBOX:
        return <TextboxInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      case OBJECT_TYPES.STICKY:
        return <StickyInspector object={object} objects={objects} onChange={onChange} onDelete={onDelete} t={t} />;
      default:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Type: {object.type}</p>
            <TransformFields object={object} onChange={onChange} />
            <DisplayFields object={object} objects={objects} onChange={onChange} onDelete={onDelete} />
          </div>
        );
    }
  };

  return (
    <aside className="rounded-xl border border-border/70 bg-card/40 p-4">
      <div className="flex items-center justify-between">
        <p className="nb-label capitalize">{object.type.replace(/-/g, " ")}</p>
        <span className="font-mono text-[10px] text-muted-foreground">{Math.round(object.x)}, {Math.round(object.y)}</span>
      </div>
      {renderInspector()}
    </aside>
  );
}