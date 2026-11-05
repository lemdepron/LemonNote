import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Chip, Section } from "@/components/ink/StudioSection";
import { PAPER_SIZES, PAPER_TEMPLATES, PAPER_TONES } from "@/lib/ink/paper";

export default function PaperStudio({ paper, onPaper, pageIndex = 0, onPage, onClear }) {
  return (
    <div className="space-y-4">
      <Section label="Template" hint="Templates tile across every page of the infinite canvas.">
        <div className="grid grid-cols-3 gap-1">
          {PAPER_TEMPLATES.map((template) => (
            <Chip
              key={template.id}
              active={(paper?.template || "grid") === template.id}
              onClick={() => onPaper({ template: template.id })}
              className="w-full"
            >
              {template.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section label="Page">
        <div className="flex gap-1">
          {PAPER_SIZES.map((size) => (
            <Chip
              key={size.id}
              active={(paper?.size || "a4") === size.id}
              onClick={() => onPaper({ size: size.id })}
              className="flex-1"
            >
              {size.label}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-1 py-1">
          <button
            type="button"
            onClick={() => onPage(-1)}
            disabled={pageIndex <= 0}
            aria-label="Previous page"
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">page {pageIndex + 1}</span>
          <button
            type="button"
            onClick={() => onPage(1)}
            aria-label="Next page"
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground transition hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Section>

      <Section label="Tone">
        <div className="flex gap-1">
          {PAPER_TONES.map((tone) => (
            <Chip key={tone.id} active={(paper?.tone || "dark") === tone.id} onClick={() => onPaper({ tone: tone.id })} className="flex-1">
              {tone.label}
            </Chip>
          ))}
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-muted-foreground/70">
          Highlighter multiplies ink on paper tone and screens on slate.
        </p>
      </Section>

      <Section label="Danger zone">
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> clear every stroke
        </button>
      </Section>
    </div>
  );
}