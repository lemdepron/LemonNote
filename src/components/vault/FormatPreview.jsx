import { TOKEN_CLASS, tokenize } from "@/lib/code-languages";

/** Read-only, syntax-highlighted rendering of a note written in a code format. */
export default function FormatPreview({ value = "", format }) {
  return (
    <pre className="overflow-x-auto whitespace-pre rounded-xl border border-border/60 bg-card/25 px-4 py-3 font-mono text-[13px] leading-[1.9]">
      {tokenize(value, format).map((token, index) => (
        <span key={index} className={TOKEN_CLASS[token.type]}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}