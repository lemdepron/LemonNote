import { useRef, useState } from "react";
import { db } from "@/api/localDb";
import { caret, commit } from "@/lib/editor-bridge";
import { imageRejection, imageSnippet } from "@/lib/note-insert";

/**
 * Uploads images picked from the ribbon, dropped on the editor or pasted into
 * it, then writes a plain markdown image at the caret. The note stores the
 * markdown, so the uploaded file needs a permanent URL to keep rendering.
 */
export default function useNoteImages({ body, onChange }) {
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const insert = async (files) => {
    const list = Array.from(files || []).filter((file) => file && file.type.startsWith("image/"));
    if (!list.length) return;
    const rejection = list.map(imageRejection).find(Boolean);
    if (rejection) {
      setError(rejection);
      return;
    }

    setError("");
    setBusy(true);
    // Taken before the upload so the picture lands where the writer left the caret.
    const at = caret();
    try {
      const parts = [];
      for (const file of list) {
        const { file_url } = await db.integrations.Core.UploadPublicFile({ file });
        parts.push(imageSnippet(file_url, file.name.replace(/\.[^.]+$/, "")));
      }
      const value = at.value || bodyRef.current || "";
      const start = Math.min(at.start ?? value.length, value.length);
      const end = Math.min(at.end ?? start, value.length);
      const text = parts.join("");
      commit(
        {
          start,
          end,
          text,
          caret: start + text.length,
          next: `${value.slice(0, start)}${text}${value.slice(end)}`,
        },
        onChange
      );
    } catch {
      setError("That image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  return { insert, busy, error };
}