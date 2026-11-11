# Task List: System Tray and Autostart

## Phase 1: Rust/Cargo Setup
- [x] Task 1: Add tray-icon feature to tauri dependency in Cargo.toml
- [x] Task 2: Add tauri-plugin-autostart to Cargo.toml dependencies
- [x] Task 3: Add tray and autostart permissions to capabilities/default.json
- [x] Task 4: Update src-tauri/src/lib.rs to initialize plugins and create tray icon with menu

## Phase 2: Frontend Dependencies
- [x] Task 5: Add @tauri-apps/plugin-autostart to package.json

## Phase 3: Settings UI
- [x] Task 6: Add translation keys to en.json for Window section
- [x] Task 7: Add translations to all 10 other locale files (ar, de, es, fa, fr, hi, ja, ru, ur, zh)
- [x] Task 8: Add Window section to SettingsPage.jsx with three switches

## Phase 4: Tray Functionality
- [x] Task 9: Handle window close event to hide instead of quit
- [x] Task 10: Add toast notification "LemonNote is still running in the tray" (one-time)
- [x] Task 11: Flush autosave before hiding window

## Phase 5: Verification
- [x] Task 12: Run npm install and npm ci --dry-run
- [x] Task 13: Run npx eslint src --quiet
- [x] Task 14: Run npm run build
- [x] Task 15: Run node scripts/i18n-check.mjs (pre-existing issues in repo, not from this change)

## Checkpoint: Complete
- [x] All acceptance criteria met
- [x] Ready for review