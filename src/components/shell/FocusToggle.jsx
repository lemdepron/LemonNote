import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusMode } from "@/lib/focusMode";

export default function FocusToggle({ className }) {
  const { focus, toggle } = useFocusMode();
  const Icon = focus ? Minimize2 : Maximize2;
  const label = focus ? "Exit full-screen view" : "Full-screen view";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={focus}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md border px-2 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-[transform,opacity,background-color,border-color,color] duration-200 ease-out transform-gpu active:scale-95",
        focus
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{focus ? "exit" : "full screen"}</span>
    </button>
  );
}