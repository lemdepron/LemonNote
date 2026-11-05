import { highlightParts } from "@/lib/vault";

export default function Highlight({ text = "", query = "" }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-[3px] bg-primary/25 px-0.5 text-primary">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}