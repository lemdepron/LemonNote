import { Table2, Type } from "lucide-react";
import RibbonGroup from "@/components/ribbon/RibbonGroup";
import { Btn, useRibbon } from "@/components/ribbon/RibbonKit";
import { copyText } from "@/lib/editor-bridge";

export function ShareTab() {
  const { body } = useRibbon();

  return (
    <>
      <RibbonGroup label="Copy note">
        <Btn id="share.copyMarkdown" icon={Table2} label="As Markdown" hint="Copy the whole note text" onClick={() => copyText(body)} />
        <Btn
          id="share.copyPlainText"
          icon={Type}
          label="As plain text"
          hint="Copy the note without markdown symbols"
          onClick={() =>
            copyText(
              body
                .replace(/<\/?[a-z][^>]*>/gi, "")
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/(\*\*|__|~~|`)/g, "")
                .replace(/\[\[([^\]]+)\]\]/g, "$1")
                .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            )
          }
        />
      </RibbonGroup>

      <RibbonGroup label="Export">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>

      <RibbonGroup label="Share">
        <p className="self-center px-3 font-mono text-[10.5px] text-muted-foreground">More coming</p>
      </RibbonGroup>
    </>
  );
}