import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/api/localDb";
import { STARTER_NOTES } from "@/lib/vault";
import { listActiveNotes, listTrashedNotes } from "@/lib/notes";
import { collectFolders, filterNotesByRecent, RECENT_FILTERS } from "@/lib/vault";

const NOTE_LIMIT = 300;

export default function useVault() {
  const [notes, setNotes] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState("");
  const [recentFilter, setRecentFilter] = useState("all");
  const [showFavourites, setShowFavourites] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const seeding = useRef(false);

  const load = useCallback(async () => {
    const [activeItems, trashItems] = await Promise.all([
      listActiveNotes({ sort: "-updated_date", limit: NOTE_LIMIT }),
      listTrashedNotes(),
    ]);

    if (!activeItems.length && !seeding.current) {
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

    setNotes(activeItems);
    setTrashedNotes(trashItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  // Compute folders from active notes
  const folders = collectFolders(notes);

  // Get filtered notes based on folder, recent filter, favourites, and includeDeleted
  const getFilteredNotes = useCallback(() => {
    let result = notes;

    // Filter by folder
    if (activeFolder !== undefined) {
      result = result.filter((note) => {
        const noteFolder = note.folder || "";
        if (activeFolder === "") {
          return noteFolder === "";
        }
        return noteFolder === activeFolder || noteFolder.startsWith(activeFolder + "/");
      });
    }

    // Filter by recent
    result = filterNotesByRecent(result, recentFilter);

    // Filter by favourites
    if (showFavourites) {
      result = result.filter((note) => note.favourite);
    }

    // Include deleted notes if requested
    if (includeDeleted) {
      result = [...result, ...trashedNotes];
    }

    return result;
  }, [notes, trashedNotes, activeFolder, recentFilter, showFavourites, includeDeleted]);

  const filteredNotes = getFilteredNotes();

  return {
    notes,
    trashedNotes,
    filteredNotes,
    folders,
    loading,
    activeFolder,
    setActiveFolder,
    recentFilter,
    setRecentFilter,
    showFavourites,
    setShowFavourites,
    includeDeleted,
    setIncludeDeleted,
    reload: load,
    RECENT_FILTERS,
  };
}