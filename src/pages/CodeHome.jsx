import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2 } from "lucide-react";
import { db } from "@/api/localDb";
import SpaceListPage from "@/components/shell/SpaceListPage";
import { languageLabel, templateFor } from "@/lib/code-languages";
import { relativeTime } from "@/lib/vault";
import { uid } from "@/lib/table";

const STARTER_FILE = {
  name: "untitled.rs",
  language: "rust",
  body: templateFor("rust"),
};

export default function CodeHome() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    db.entities.CodeFile.list({ sort: "-updated_date", limit: 60 })
      .then((page) => setItems(page?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const file = await db.entities.CodeFile.create({ ...STARTER_FILE, name: `scratch-${uid("f").slice(2, 6)}.rs` });
    navigate(`/code/${file.id}`);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    await db.entities.CodeFile.delete(id);
    load();
  };

  return (
    <SpaceListPage
      eyebrow="Code workspace"
      title="Keep code next to the thinking."
      description="Syntax-highlighted files for the snippets that belong in your notes — a parser draft, a query, a config. Line numbers, tabs, autosave."
      createLabel="New file"
      icon={Code2}
      loading={loading}
      onCreate={create}
      onDelete={remove}
      items={items.map((file) => ({
        id: file.id,
        name: file.name || "Untitled file",
        href: `/code/${file.id}`,
        meta: `${languageLabel(file.language)} · ${(file.body || "").split("\n").length} lines · ${relativeTime(file.updated_date)}`,
      }))}
      emptyTitle="No code files yet."
      emptyHint="New files start from a small template for the language you pick."
    />
  );
}