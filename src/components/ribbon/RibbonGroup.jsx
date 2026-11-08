/** One section of the ribbon; controls flow in columns 2 rows high, name below. */
export default function RibbonGroup({ label, children }) {
  const gridStyle = {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateRows: 'repeat(2, 32px)',
    gridAutoColumns: 'max-content',
    gap: '4px',
    alignItems: 'center',
  };

  return (
    <div className="flex shrink-0 flex-col px-2 pb-1 pt-1.5" style={{ minWidth: 'max-content' }}>
      <div style={gridStyle} role="group" aria-label={label}>
        {children}
      </div>
      <span className="mt-0.5 select-none font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/55 text-center">
        {label}
      </span>
    </div>
  );
}