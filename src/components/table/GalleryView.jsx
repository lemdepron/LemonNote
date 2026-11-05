import { labelColumn, rowLabel } from "@/lib/table";

export default function GalleryView({ columns, rows }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-14 text-center">
        <p className="text-[14px]">No rows yet.</p>
        <p className="mt-1 text-[13px] text-muted-foreground">Add a row to see it as a card.</p>
      </div>
    );
  }

  const title = labelColumn({ columns });
  const fields = columns.filter((column) => column.id !== title?.id).slice(0, 5);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-border/70 bg-card/40 p-3.5">
          <p className="text-[13.5px] leading-snug text-foreground">{rowLabel({ columns }, row)}</p>
          <dl className="mt-3 space-y-1.5">
            {fields.map((column) => {
              const value = row.cells?.[column.id];
              if (value === undefined || value === null || value === "" || value === false) return null;
              return (
                <div key={column.id} className="flex items-baseline gap-2">
                  <dt className="w-[74px] shrink-0 truncate font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    {column.name}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">
                    {column.type === "checkbox" ? "yes" : String(value)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </article>
      ))}
    </div>
  );
}