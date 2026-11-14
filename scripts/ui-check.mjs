/**
 * Quick UI check for Design tab ribbon groups
 * Run with: node scripts/ui-check.mjs
 * Opens the dev server and checks Design tab structure
 */

import { spawn } from "child_process";
import http from "http";

const PORT = 5173;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(check, 500);
      }).on("error", () => {
        if (Date.now() - start > timeout) reject(new Error("Server timeout"));
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

async function main() {
  console.log("Starting dev server...");
  const dev = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });

  try {
    await waitForServer(URL);
    console.log(`\n✓ Dev server running at ${URL}`);
    console.log("\n=== MANUAL TEST CHECKLIST ===");
    console.log("1. Open http://localhost:5173 in browser");
    console.log("2. Create or open a Markdown note");
    console.log("3. Click the 'Design' tab (4th tab)");
    console.log("4. Verify each group appears in order:");
    console.log("   - Page Style (Grid icon) - pageStyle select + conditional steppers");
    console.log("   - Style Sets (LayoutTemplate icon) - 8 preset cards");
    console.log("   - Themes (Palette icon) - themePreset menu + 3 in '...'");
    console.log("   - Paragraph Spacing (Type icon) - preset select + 2 steppers in '...'");
    console.log("   - Page Appearance (Square icon) - pageColor, pageBorder, watermark, title style");
    console.log("   - Language + Defaults (Globe icon) - language select + 3 buttons in '...'");
    console.log("5. Test each control:");
    console.log("   - Page Style: switch between default/grid/lines/dots");
    console.log("   - Grid spacing stepper appears only for 'grid'");
    console.log("   - Line spacing stepper appears only for 'lines'");
    console.log("   - Style Sets: click each preset, verify typography updates");
    console.log("   - Theme Preset: select light/dark themes, clear works");
    console.log("   - Accent color: picker, hex input, swatches all work");
    console.log("   - Theme fonts: heading/body font selects work");
    console.log("   - Paragraph preset: select preset, gap/lineHeight update");
    console.log("   - Gap/Line height steppers: adjust, preset clears");
    console.log("   - Page color: picker, hex, swatches work");
    console.log("   - Page border: select style, border color appears conditionally");
    console.log("   - Hide title: toggles Eye/EyeOff icon");
    console.log("   - Watermark: text input, presets, clear; color/opacity/angle appear conditionally");
    console.log("   - Title font/size/alignment: all work");
    console.log("   - Language select: works");
    console.log("   - Save as default / Load default / Reset: toasts appear");
    console.log("6. Check '...' popovers open for groups with >5 items");
    console.log("7. Verify RTL: switch app to Arabic, check layout direction");
    console.log("8. Verify reduced motion: enable in OS, panel animation disabled");
    console.log("\nPress Ctrl+C to stop dev server");
    await new Promise(() => {}); // wait forever
  } catch (e) {
    console.error("Error:", e.message);
    dev.kill();
    process.exit(1);
  }
}

main();