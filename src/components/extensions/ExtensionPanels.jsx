import useExtensions from "@/hooks/useExtensions";
import { panelsFor } from "@/lib/extensions";

export default function ExtensionPanels({ note, onEditBody, onVaultChange }) {
  useExtensions(); // re-render when a plugin is toggled
  const panels = panelsFor("vault");

  if (!panels.length) return null;

  return (
    <div className="space-y-2.5">
      {panels.map((extension) => {
        const Panel = extension.panel;
        return (
          <Panel
            key={extension.id}
            note={note}
            onEditBody={onEditBody}
            onVaultChange={onVaultChange}
          />
        );
      })}
    </div>
  );
}