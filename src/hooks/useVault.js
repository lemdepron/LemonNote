import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/api/localDb";
import { STARTER_NOTES } from "@/lib/vault";
import { listActiveNotes } from "@/lib/notes";

const NOTE_LIMIT = 300;

export default function useVault() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const seeding = useRef(false);

  const load = useCallback(async () => {
    const items = await listActiveNotes({ sort: "-updated_date", limit: NOTE_LIMIT });

    if (!items.length && !seeding.current) {
      const me = await db.auth.me().catch(() => null);
      if (!me?.nc_seeded) {
        seeding.current = true;
        const created = await db.entities.Note.bulkCreate(STARTER_NOTES);
        await db.auth.updateMe({ nc_seeded: true }).catch(() => null);
        setNotes(Array.isArray(created) ? created : []);
        setLoading(false);
        return;
      }
    }

    setNotes(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  return { notes, loading, reload: load };
}