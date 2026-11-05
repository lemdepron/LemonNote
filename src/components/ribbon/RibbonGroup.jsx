/** One section of the single-row ribbon; its name sits under the buttons. */
export default function RibbonGroup({ label, children }) {
  return (
    <div className="flex shrink-0 flex-col justify-center px-2 pb-1 pt-1.5">
      <div className="flex items-center gap-0.5">{children}</div>
      <span className="mt-0.5 select-none font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55">
        {label}
      </span>
    </div>
  );
}