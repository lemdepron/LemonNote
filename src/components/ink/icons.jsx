import { cn } from "@/lib/utils";

const svgns = "http://www.w3.org/2000/svg";

function SvgIcon({ className, children, ...props }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Fountain pen — pressure-sensitive taper */
export function FountainPenIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M9 15v-2" />
      <path d="M15 15v-2" />
      <path d="M12 7v6" />
    </SvgIcon>
  );
}

/** Ballpoint pen — even line */
export function BallpointPenIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M9 15h6" />
      <path d="M12 7v8" />
    </SvgIcon>
  );
}

/** Calligraphy pen — angled nib */
export function CalligraphyPenIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M8 16l4-4" />
      <path d="M12 12l4-4" />
      <path d="M16 12l4-4" />
      <path d="M12 7v5" />
    </SvgIcon>
  );
}

/** Highlighter/Marker — broad translucent tip */
export function HighlighterIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M8 14h8" />
      <path d="M8 16h8" />
      <path d="M12 7v7" />
    </SvgIcon>
  );
}

/** Watercolor brush — soft wet edges */
export function WatercolorBrushIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M9 16c0-2 2-3 4-3s4 1 4 3" />
      <path d="M9 14c0-1.5 1.5-2.5 3.5-2.5S16 12.5 16 14" />
      <path d="M12 7v5" />
    </SvgIcon>
  );
}

/** Pencil — grain and tilt */
export function PencilIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 2C7 2 3 6 3 11v10c0 4.5 3.5 8 8 8s8-3.5 8-8V11c0-5-4-9-9-9Z" />
      <path d="M9 15l2-6 4 2" />
      <path d="M12 7v3" />
    </SvgIcon>
  );
}

/** Eraser — stroke/point mode */
export function EraserIcon({ className, mode = "stroke" }) {
  if (mode === "precision") {
    return (
      <SvgIcon className={className}>
        <path d="M19 3.5l-4.5 4.5" />
        <path d="M15 7l-6 6" />
        <path d="M5 17l-2 2h6v-6l6-6" />
      </SvgIcon>
    );
  }
  return (
    <SvgIcon className={className}>
      <path d="M20 7H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1Z" />
      <path d="M8 10v8" />
      <path d="M12 10v8" />
      <path d="M16 10v8" />
    </SvgIcon>
  );
}

/** Lasso selection */
export function LassoIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M7 3.5L19.5 16" />
      <path d="M19 3.5L6.5 16" />
      <path d="M3.5 19L16 6.5" />
      <path d="M3.5 19L16 6.5" />
    </SvgIcon>
  );
}

/** Pan/hand tool */
export function HandIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </SvgIcon>
  );
}

/** Eyedropper/color picker */
export function EyedropperIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M5 15l6.5-6.5a1.5 1.5 0 0 1 3 0l4 4a1.5 1.5 0 0 1 0 3l-11 11a1.5 1.5 0 0 1-3 0l-4-4a1.5 1.5 0 0 1 0-3Z" />
      <path d="M12 8l-2 2" />
      <path d="M16 12l-4-4" />
    </SvgIcon>
  );
}

/** Shapes tool */
export function ShapesIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <circle cx="18.5" cy="10.5" r="5.5" />
      <path d="M21 21l-4-4" />
      <path d="M14 14l-3 3" />
    </SvgIcon>
  );
}

/** Coordinate graph shape */
export function CoordinateGraphIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="3" x2="3" y2="21" />
      <line x1="6" y1="19" x2="6" y2="22" />
      <line x1="9" y1="19" x2="9" y2="22" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="15" y1="19" x2="15" y2="22" />
      <line x1="18" y1="19" x2="18" y2="22" />
      <line x1="1" y1="18" x2="4" y2="18" />
      <line x1="1" y1="15" x2="4" y2="15" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="6" x2="4" y2="6" />
    </SvgIcon>
  );
}

/** Save current pen as favourite */
export function SavePenIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      <path d="M9 11l1 1 4-4" />
    </SvgIcon>
  );
}

/** Remove favourite pen */
export function RemovePenIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  );
}

/** Insert space tool — drag to add/remove vertical space */
export function InsertSpaceIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <path d="M12 7v10" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </SvgIcon>
  );
}

/** Mouse pointer / select tool */
export function MousePointerIcon({ className }) {
  return (
    <SvgIcon className={className}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </SvgIcon>
  );
}