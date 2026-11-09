import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VaultHeader from "@/components/vault/VaultHeader";
import GraphView from "@/components/graph/GraphView";
import { noteLinks } from "@/lib/vault";
import { listActiveNotes } from "@/lib/notes";

export default function GraphPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listActiveNotes({ sort: "-updated_date", limit: 300 })
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const linkCount = notes.reduce((total, note) => total + noteLinks(note).length, 0);

  return (
    <div className="nb-shell min-h-screen">
      <VaultHeader />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to vault"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-tight tracking-tight">The vault as a network</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {notes.length} notes · {linkCount} links · drag to rearrange · click to open
            </p>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="h-[62vh] min-h-[380px] animate-pulse rounded-2xl border border-border/60 bg-card/30" />
          ) : notes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center text-[13px] text-muted-foreground">
              Write a note and link another with <span className="font-mono text-foreground">[[double brackets]]</span> to grow the graph.
            </p>
          ) : (
            <GraphView notes={notes} onOpen={(note) => navigate(`/note/${note.id}`)} />
          )}
        </div>
      </main>
    </div>
  );
}