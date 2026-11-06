/** Languages offered by the Code tab for fenced blocks. The id is what follows the ``` fence. */
export const FENCE_GROUPS = [
  {
    label: "Web",
    items: [
      ["html", "HTML"], ["css", "CSS"], ["scss", "SCSS"], ["javascript", "JavaScript"], ["typescript", "TypeScript"],
      ["jsx", "JSX"], ["tsx", "TSX"], ["vue", "Vue"], ["svelte", "Svelte"], ["php", "PHP"], ["graphql", "GraphQL"],
    ],
  },
  {
    label: "Systems and apps",
    items: [
      ["rust", "Rust"], ["c", "C"], ["cpp", "C++"], ["go", "Go"], ["zig", "Zig"], ["swift", "Swift"], ["kotlin", "Kotlin"],
      ["java", "Java"], ["csharp", "C#"], ["dart", "Dart"], ["scala", "Scala"], ["asm", "Assembly"],
    ],
  },
  {
    label: "Scripting",
    items: [
      ["python", "Python"], ["ruby", "Ruby"], ["perl", "Perl"], ["lua", "Lua"], ["r", "R"], ["julia", "Julia"],
      ["bash", "Bash"], ["powershell", "PowerShell"], ["batch", "Batch"],
    ],
  },
  {
    label: "Data and config",
    items: [
      ["json", "JSON"], ["yaml", "YAML"], ["toml", "TOML"], ["xml", "XML"], ["csv", "CSV"], ["ini", "INI"], ["sql", "SQL"],
      ["dockerfile", "Dockerfile"], ["nginx", "Nginx"], ["makefile", "Makefile"],
    ],
  },
  {
    label: "Text",
    items: [["markdown", "Markdown"], ["latex", "LaTeX"], ["diff", "Diff"], ["regex", "Regex"], ["plain", "Plain text"]],
  },
];

export const QUICK_LANGUAGES = [
  ["javascript", "JS"], ["typescript", "TS"], ["python", "Py"], ["rust", "Rust"], ["bash", "Bash"],
  ["sql", "SQL"], ["json", "JSON"], ["html", "HTML"], ["css", "CSS"], ["yaml", "YAML"],
];

export const ALL_FENCE_LANGUAGES = FENCE_GROUPS.flatMap((group) => group.items);
export const fenceLabel = (id) => ALL_FENCE_LANGUAGES.find(([value]) => value === id)?.[1] || id || "Plain text";
