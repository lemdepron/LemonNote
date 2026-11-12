// Fix HIGH_CONTRAST_THEMES array
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/lib/theme-presets.js", "utf8");

// Find the HIGH_CONTRAST_THEMES array and replace it entirely
const hcStart = source.indexOf('const HIGH_CONTRAST_THEMES = [');
if (hcStart === -1) {
  console.log("HIGH_CONTRAST_THEMES not found");
  process.exit(1);
}

// Find the end of the array
let bracketCount = 0;
let hcEnd = -1;
for (let i = hcStart; i < source.length; i++) {
  if (source[i] === '[') bracketCount++;
  else if (source[i] === ']') {
    bracketCount--;
    if (bracketCount === 0) {
      hcEnd = i;
      break;
    }
  }
}

if (hcEnd === -1) {
  console.log("Could not find end of HIGH_CONTRAST_THEMES");
  process.exit(1);
}

const newHcThemes = `const HIGH_CONTRAST_THEMES = [
  // HC Dark Warm — WCAG AAA, warm tones
  {
    id: "hc-dark-warm",
    name: "High Contrast Warm",
    surface: "plain",
    light: {
      "--background": "40 20% 98%",
      "--foreground": "40 30% 5%",
      "--card": "40 20% 96%",
      "--card-foreground": "40 30% 5%",
      "--popover": "40 20% 99%",
      "--popover-foreground": "40 30% 5%",
      "--primary": "40 40% 15%",
      "--primary-foreground": "40 20% 98%",
      "--secondary": "40 15% 90%",
      "--secondary-foreground": "40 25% 8%",
      "--muted": "40 12% 85%",
      "--muted-foreground": "40 20% 25%",
      "--accent": "40 15% 82%",
      "--accent-foreground": "40 25% 8%",
      "--destructive": "15 80% 35%",
      "--destructive-foreground": "40 20% 98%",
      "--border": "40 30% 10%",
      "--input": "40 30% 12%",
      "--ring": "30 60% 70%",  // Contrasting ring
      "--link": "30 60% 20%",
      "--chart-1": "40 40% 15%",
      "--chart-2": "30 60% 20%",
      "--chart-3": "100 55% 30%",
      "--chart-4": "200 70% 35%",
      "--chart-5": "330 80% 40%",
      "--shadow": "40 30% 8%",
      "--scrim": "40 25% 6%",
      "--canvas": "40 18% 94%",
      "--canvas-dot": "40 20% 30%",
      "--edge": "30 64% 25%",
      "--node": "40 20% 97%",
      "--node-ring": "40 40% 15%",
      "--ink": "40 30% 5%",
      "--ink-light": "40 25% 90%",
      "--paper-outside": "40 18% 90%",
      "--paper-page-slate": "40 25% 8%",
      "--paper-page-paper": "40 25% 98%",
      "--surface-a": "40 35% 35%",
      "--surface-b": "30 50% 45%",
      "--surface-c": "100 55% 55%",
            // Style layer
      "--r-control": "0.25rem",
      "--r-card": "0.25rem",
      "--r-pill": "9999px",
      "--r-tab": "0.25rem",
      "--border-width": "1px",
      "--shadow-style": "none",
      "--shadow-card": "none",
      "--shadow-pop": "none",
      "--blur": "0",
      "--surface-opacity": "1",
      "--font-heading": "system-ui, sans-serif",
      "--font-body": "system-ui, sans-serif",
      "--tab-style": "underline",
      "--button-style": "outline",
      "--bg-gradient": "none",
      "--bg-pattern": "none",
    },
    dark: {
      "--background": "40 15% 4%",
      "--foreground": "40 10% 98%",
      "--card": "40 12% 6%",
      "--card-foreground": "40 10% 98%",
      "--popover": "40 12% 8%",
      "--popover-foreground": "40 10% 98%",
      "--primary": "40 35% 90%",
      "--primary-foreground": "40 30% 4%",
      "--secondary": "40 10% 18%",
      "--secondary-foreground": "40 8% 95%",
      "--muted": "40 10% 12%",
      "--muted-foreground": "40 8% 75%",
      "--accent": "40 10% 22%",
      "--accent-foreground": "40 8% 98%",
      "--destructive": "15 75% 60%",
      "--destructive-foreground": "40 30% 4%",
      "--border": "40 10% 90%",
      "--input": "40 10% 88%",
      "--ring": "30 55% 30%",  // Darker ring
      "--link": "30 55% 80%",
      "--chart-1": "40 35% 90%",
      "--chart-2": "30 55% 80%",
      "--chart-3": "100 50% 70%",
      "--chart-4": "200 65% 72%",
      "--chart-5": "330 75% 75%",
      "--shadow": "40 35% 5%",
      "--scrim": "40 25% 4%",
      "--canvas": "40 12% 5%",
      "--canvas-dot": "40 10% 30%",
      "--edge": "30 50% 80%",
      "--node": "40 10% 10%",
      "--node-ring": "40 35% 90%",
      "--ink": "40 20% 18%",
      "--ink-light": "40 15% 92%",
      "--paper-outside": "40 10% 4%",
      "--paper-page-slate": "40 12% 6%",
      "--paper-page-paper": "40 20% 96%",
      "--surface-a": "40 30% 70%",
      "--surface-b": "30 45% 55%",
      "--surface-c": "100 50% 65%",
            // Style layer
      "--r-control": "0.25rem",
      "--r-card": "0.25rem",
      "--r-pill": "9999px",
      "--r-tab": "0.25rem",
      "--border-width": "1px",
      "--shadow-style": "none",
      "--shadow-card": "none",
      "--shadow-pop": "none",
      "--blur": "0",
      "--surface-opacity": "1",
      "--font-heading": "system-ui, sans-serif",
      "--font-body": "system-ui, sans-serif",
      "--tab-style": "underline",
      "--button-style": "outline",
      "--bg-gradient-dark": "none",
      "--bg-pattern": "none",
    },
  },
];`;

const result = source.slice(0, hcStart) + newHcThemes + source.slice(hcEnd + 1);
writeFileSync("src/lib/theme-presets.js", result);
console.log("Fixed HIGH_CONTRAST_THEMES!");