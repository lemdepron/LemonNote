export default function ContractList({ title, contracts }) {
  const entries = Object.entries(contracts);

  return (
    <section className="rounded-xl border border-border/70 bg-card/30 p-4">
      <p className="nb-label">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Nothing is published on this channel yet.</p>
      ) : (
        <ul className="mt-2.5 space-y-2.5">
          {entries.map(([name, contract]) => (
            <li key={name}>
              <p className="font-mono text-[11.5px] text-foreground">{name}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{contract.summary}</p>
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{contract.payload || contract.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}