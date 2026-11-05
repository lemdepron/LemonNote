import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import useExtensions from "@/hooks/useExtensions";
import ExtensionRow from "@/components/extensions/ExtensionRow";
import ExtensionEvents from "@/components/extensions/ExtensionEvents";
import ThemeGallery from "@/components/themes/ThemeGallery";
import { readCustomTheme, setCustomTheme } from "@/lib/extensions";
import { HOOK_CONTRACTS, EVENT_CONTRACTS } from "@/lib/plugin-sandbox";

const CUSTOM_THEME_EXAMPLE = `--primary: 205 58% 46%
--link: 190 62% 30%
--ring: 205 58% 46%`;

export default function ExtensionsPage() {
  const extensions = useExtensions();
  const [custom, setCustom] = useState(() => readCustomTheme());
  const [savedAt, setSavedAt] = useState(null);

  const applyCustom = () => {
    setCustomTheme(custom);
    setSavedAt(Date.now());
  };

  const clearCustom = () => {
    setCustom("");
    setCustomTheme("");
    setSavedAt(Date.now());
  };

  const contracts = Object.keys(HOOK_CONTRACTS).length + Object.keys(EVENT_CONTRACTS).length;

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to vault"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="nb-label">extensions</p>
            <h1 className="mt-1 font-display text-[26px] leading-tight tracking-tight">Capabilities, not scripts.</h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          Every extension declares what it may touch — CSS variables, a panel or title-bar slot, a named save hook or
          the event stream. Nothing executes third-party code: handlers get a frozen sandbox, a failure stays inside
          its own plugin, and every run is logged below.
        </p>

        <div className="mt-6">
          <ThemeGallery />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[13px] font-medium tracking-tight">Installed</h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {extensions.filter((extension) => extension.enabled).length} of {extensions.length} active ·{" "}
                {contracts} contracts
              </span>
            </div>

            <ul className="mt-3 space-y-2">
              {extensions.map((extension) => (
                <ExtensionRow key={extension.id} extension={extension} />
              ))}
            </ul>
          </section>

          <div className="space-y-3">
            <section className="rounded-xl border border-border/60 bg-card/25 p-4">
              <p className="nb-label">css variable overrides</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                Values are raw HSL channels applied to the document root in both modes. Disabled extensions keep their
                defaults.
              </p>
              <textarea
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                spellCheck={false}
                rows={7}
                placeholder={CUSTOM_THEME_EXAMPLE}
                className="mt-3 w-full resize-none rounded-lg border border-border/70 bg-background/50 p-2.5 font-mono text-[11.5px] leading-relaxed text-foreground outline-none focus:border-primary/40"
              />
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={applyCustom}
                  className="h-8 rounded-md border border-primary/40 bg-primary/10 px-3 text-[12px] text-primary transition hover:bg-primary/15"
                >
                  Apply overrides
                </button>
                <button
                  type="button"
                  onClick={clearCustom}
                  className="h-8 rounded-md border border-border/70 px-2.5 text-[12px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  Reset
                </button>
                {savedAt && (
                  <span className="ml-auto flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" /> applied
                  </span>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border/60 bg-card/25 p-4">
              <div className="flex items-baseline justify-between">
                <p className="nb-label">runtime log</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">live</span>
              </div>
              <ExtensionEvents limit={8} />
            </section>

            <Link
              to="/spaces"
              className="group flex items-center gap-2 rounded-xl border border-border/60 bg-card/25 p-4 transition hover:border-primary/30 hover:bg-card/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">Tab manifest</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  Routes, entities and the hook surface of all eleven tabs.
                </p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}