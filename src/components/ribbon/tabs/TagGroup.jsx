import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn } from "@/components/ribbon/RibbonKit";
import TagButton from "@/components/ribbon/tabs/TagButton";
import { BUILTIN_TAGS, toggleLineTag, clearLineTags } from "@/lib/tags";
import { useRibbon } from "@/components/ribbon/RibbonKit";
import { Tag } from "lucide-react";

/**
 * Tag group for the Home ribbon tab.
 * Shows buttons for all 8 built-in tags, plus a "Clear tags" button.
 */
export function TagGroup({ format }) {
  const ctx = useRibbon();
  const { selection, markdown, run } = ctx;

  // Only show for markdown notes
  if (!markdown) return null;

  // Sort built-in tags by order
  const sortedTags = [...BUILTIN_TAGS].sort((a, b) => a.order - b.order);

  // Check if the current selection has a specific tag
  const hasTag = (tagId) => {
    const { value, start, end } = selection;
    if (start === end) return false; // Collapsed caret - check whole line at caret
    const lines = value.slice(start, end).split("\n");
    return lines.some((line) => {
      const extracted = extractLineTag(line);
      return extracted && extracted.tagId === tagId;
    });
  };

  // Extract tag from a line (copied from tags.js to avoid circular import)
  function extractLineTag(line) {
    const match = /^(\s*)\{tag:([a-zA-Z][a-zA-Z0-9_-]*)\}/.exec(line);
    if (!match) return null;
    return { tagId: match[2].toLowerCase() };
  }

  const handleTagClick = (tagId) => {
    run(toggleLineTag(selection, tagId));
  };

  const handleClearTags = () => {
    run(clearLineTags(selection));
  };

  return (
    <RibbonGroup label="Tags" icon={Tag}>
      {sortedTags.map((tagDef) => (
        <TagButton
          key={tagDef.id}
          tagDef={tagDef}
          active={hasTag(tagDef.id)}
          onClick={() => handleTagClick(tagDef.id)}
        />
      ))}
      <Btn
        id="home.clearTags"
        icon={Tag}
        label="Clear"
        hint="Remove all line tags from the selection (or the whole note)"
        onClick={handleClearTags}
      />
    </RibbonGroup>
  );
}