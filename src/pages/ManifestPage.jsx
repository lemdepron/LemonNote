import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import SpaceManifestCard from "@/components/spaces/SpaceManifestCard";
import ContractList from "@/components/spaces/ContractList";
import useExtensions from "@/hooks/useExtensions";
import { SPACES } from "@/lib/spaces";
import { EVENT_CONTRACTS, HOOK_CONTRACTS } from "@/lib/plugin-sandbox";

export default function ManifestPage() {
  const extensions = useExtensions();
  const active = extensions.filter((extension) => extension.enabled);

  const stats = [
    `${SPACES.length} tabs`,
    `${Object.keys(HOOK_CONTRACTS).length} hooks`,
    `${Object.keys(EVENT_CONTRACTS).length} events`,
    `${SPACES.filter((space) => space.panel).length} panel slots`,
    `${active.length} plugins on`,
  ];

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/extensions"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to extensions"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="nb-label">manifest</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">Eleven tabs, one contract.</h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Each tab declares its routes, the entities it stores and the only hook and event names a plugin may bind to.
          Navigation reads this same manifest, so what is listed here is what the runtime enforces. A tab with no hook or
          event listed is a read-only surface for plugins today.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {stats.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SPACES.map((space) => (
            <SpaceManifestCard
              key={space.id}
              space={space}
              attached={active.filter((extension) => extension.panel && extension.spaces.includes(space.id)).length}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ContractList title="hook contracts" contracts={HOOK_CONTRACTS} />
          <ContractList title="event contracts" contracts={EVENT_CONTRACTS} />
        </div>

        <Link
          to="/extensions"
          className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-primary transition hover:underline"
        >
          plugin runtime <ArrowUpRight className="h-3 w-3" />
        </Link>
      </main>
    </div>
  );
}