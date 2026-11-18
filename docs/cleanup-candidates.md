# Cleanup candidates (18 Nov 2026)

List of files in the repo that are not part of the app. For each file: what it is, whether anything imports or runs it, and whether it is safe to delete. **Nothing is deleted in this task.**

---

## Root folder — debug / fix / test `.cjs` files

| File | What it is | Imported / run? | Safe to delete |
|------|------------|-----------------|----------------|
| `verify_vault.cjs` | One-off vault verification script | No (grep finds 0 refs) | Yes |
| `validate_json.cjs` | One-off JSON validation script | No (grep finds 0 refs) | Yes |
| `test_iso.cjs` | ISO test script | No (grep finds 0 refs) | Yes |
| `test_iso2.cjs` | ISO test script | No (grep finds 0 refs) | Yes |
| `test_iso3.cjs` | ISO test script | No (grep finds 0 refs) | Yes |
| `check_fixed.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` (14 scripts do) | **No** — used by other cleanup scripts |
| `check_fixed2.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_fixed3.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_fixed_code.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_fixed_all_code.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_fixed_final.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_fixed_vault.cjs` | Checks ru.json.fixed | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_err.cjs` | Error check script | No (grep finds 0 refs) | Yes |
| `check_dup.cjs` | Duplicate check script | No (grep finds 0 refs) | Yes |
| `check_direct.cjs` | Direct check script | No (grep finds 0 refs) | Yes |
| `check_context.cjs` | Context check script | No (grep finds 0 refs) | Yes |
| `check_code_parse.cjs` | Code parse check | No (grep finds 0 refs) | Yes |
| `check_code.cjs` | Code check script | No (grep finds 0 refs) | Yes |
| `check_chars.cjs` | Character check script | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_bytes.cjs` | Byte check script | No (grep finds 0 refs) | Yes |
| `check_json.cjs` | JSON check script | No (grep finds 0 refs) | Yes |
| `check_vault_keys.cjs` | Vault keys check | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_vault_code.cjs` | Vault code check | No (grep finds 0 refs) | Yes |
| `check_parse.cjs` | Parse check script | No (grep finds 0 refs) | Yes |
| `check_reviver.cjs` | Reviver check script | No (grep finds 0 refs) | Yes |
| `check_newfile.cjs` | New file check | No (grep finds 0 refs) | Yes |
| `check_key.cjs` | Key check script | No (grep finds 0 refs) | Yes |
| `check_raw_fixed.cjs` | Raw fixed check | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `check_second_code.cjs` | Second code check | No (grep finds 0 refs) | Yes |
| `check_ru.cjs` | Russian locale check | No (grep finds 0 refs) | Yes |
| `check_raw_fixed.cjs` | Raw fixed check | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `debug_path2.cjs` | Debug path script | No (grep finds 0 refs) | Yes |
| `debug_path.cjs` | Debug path script | Not found in glob | N/A |
| `find_second_code_end.cjs` | Find code end script | No (grep finds 0 refs) | Yes |
| `find_structure.cjs` | Find structure script | No (grep finds 0 refs) | Yes |
| `fix_ur.cjs` | Fix UR script | No (grep finds 0 refs) | Yes |
| `fix_ur2.cjs` | Fix UR script | No (grep finds 0 refs) | Yes |
| `fix_ur3.cjs` | Fix UR script | No (grep finds 0 refs) | Yes |
| `fix_ur4.cjs` | Fix UR script | No (grep finds 0 refs) | Yes |
| `fix_ur5.cjs` | Fix UR script | No (grep finds 0 refs) | Yes |
| `fix_ru.cjs` | Fix RU script | No (grep finds 0 refs) | Yes |
| `fix_root.cjs` | Fix root script | No (grep finds 0 refs) | Yes |
| `fix_comma.cjs` | Fix comma script | No (grep finds 0 refs) | Yes |
| `fix_comma2.cjs` | Fix comma script | No (grep finds 0 refs) | Yes |
| `fix_note_pane.cjs` | Fix note pane script | No (grep finds 0 refs) | Yes |
| `fix_note_pane2.cjs` | Fix note pane script | No (grep finds 0 refs) | Yes |
| `fix_note_pane3.cjs` | Fix note pane script | No (grep finds 0 refs) | Yes |
| `parse_vault_str.cjs` | Parse vault string | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `parse_vault_obj.cjs` | Parse vault object | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `save_fixed.cjs` | Save fixed file | Writes `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `remove_dup.cjs` | Remove duplicates | No (grep finds 0 refs) | Yes |
| `compare_structure.cjs` | Compare structure | No (grep finds 0 refs) | Yes |
| `manual_parse.cjs` | Manual parse script | Reads `src/lib/locales/ru.json.fixed` | **No** — used by other cleanup scripts |
| `ru_appearance.json` | Russian appearance JSON | No (grep finds 0 refs) | Yes |
| `ru_additions.json` | Russian additions JSON | No (grep finds 0 refs) | Yes |
| `ru_code.json` | Russian code JSON | No (grep finds 0 refs) | Yes |

---

## Root folder — `.patch` files

| File | What it is | Imported / run? | Safe to delete |
|------|------------|-----------------|----------------|
| `lemonnote-fix-home-design-ink.patch` | Git patch file | No (grep finds 0 refs) | Yes |
| `lemonnote-fix-ribbon-layout-themes.patch` | Git patch file | No (grep finds 0 refs) | Yes |
| `lemonnote-fix-sticky-stack.patch` | Git patch file | No (grep finds 0 refs) | Yes |

---

## Root folder — backup / stray files

| File | What it is | Imported / run? | Safe to delete |
|------|------------|-----------------|----------------|
| `original_NotePane.jsx` | Backup copy of NotePane.jsx | No (grep finds 0 refs) | Yes |

---

## `src/lib/locales/` — stray file

| File | What it is | Imported / run? | Safe to delete |
|------|------------|-----------------|----------------|
| `ru.json.fixed` | Fixed Russian locale (generated by save_fixed.cjs) | **Yes** — read by 14 root `.cjs` scripts (check_fixed*.cjs, check_chars.cjs, check_vault_keys.cjs, check_raw_fixed.cjs, parse_vault_str.cjs, parse_vault_obj.cjs, manual_parse.cjs) and written by save_fixed.cjs | **No** — still used by the cleanup scripts |

---

## `scripts/` — debug and fix scripts (names starting with `debug-`, `fix-`, `apply-`, `update-`, `remove-`, `final-`, `check-`)

| File | What it is | Imported / run? (package.json) | Safe to delete |
|------|------------|--------------------------------|----------------|
| `debug-json.mjs` | Debug JSON | No | Yes |
| `debug-json2.mjs` | Debug JSON | No | Yes |
| `debug-json3.mjs` | Debug JSON | No | Yes |
| `debug-json4.mjs` | Debug JSON | No | Yes |
| `debug-json5.mjs` | Debug JSON | No | Yes |
| `debug-json6.mjs` | Debug JSON | No | Yes |
| `debug-json7.mjs` | Debug JSON | No | Yes |
| `debug-json8.mjs` | Debug JSON | No | Yes |
| `debug-json9.mjs` | Debug JSON | No | Yes |
| `debug-exports.mjs` | Debug exports | No | Yes |
| `debug-exports-v2.mjs` | Debug exports | No | Yes |
| `debug-exports-v3.mjs` | Debug exports | No | Yes |
| `debug-exports-v4.mjs` | Debug exports | No | Yes |
| `debug-path.mjs` | Debug path | Not in glob | N/A |
| `fix-aggressive-distinctiveness.mjs` | Fix theme distinctiveness | No | Yes |
| `fix-bg-pattern-all.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-auto.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-careful.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-escaping.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-escaping-v2.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-exact.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-final.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-from-json.mjs` | Fix background patterns | No | Yes |
| `fix-bg-pattern-smart.mjs` | Fix background patterns | No | Yes |
| `fix-distinctiveness.mjs` | Fix theme distinctiveness | No | Yes |
| `fix-exports.mjs` | Fix exports | No | Yes |
| `fix-exports-complete.mjs` | Fix exports | No | Yes |
| `fix-exports-final.mjs` | Fix exports | No | Yes |
| `fix-exports-final-fix.mjs` | Fix exports | No | Yes |
| `fix-exports-flexible.mjs` | Fix exports | No | Yes |
| `fix-exports-json.mjs` | Fix exports | No | Yes |
| `fix-exports-v2.mjs` | Fix exports | No | Yes |
| `fix-exports-v3.mjs` | Fix exports | No | Yes |
| `fix-final-4.mjs` | Fix final | No | Yes |
| `fix-final-colors.mjs` | Fix final colors | No | Yes |
| `fix-final-distinctiveness.mjs` | Fix final distinctiveness | No | Yes |
| `fix-font-quotes.mjs` | Fix font quotes | No | Yes |
| `fix-font-quotes-final.mjs` | Fix font quotes | No | Yes |
| `fix-generator.mjs` | Fix generator | No | Yes |
| `fix-hc-themes.mjs` | Fix high contrast themes | No | Yes |
| `fix-last-3-distinctiveness.mjs` | Fix last distinctiveness | No | Yes |
| `fix-last-4-distinctiveness.mjs` | Fix last distinctiveness | No | Yes |
| `fix-last-one.mjs` | Fix last one | No | Yes |
| `fix-last-one-distinctiveness.mjs` | Fix last one distinctiveness | No | Yes |
| `fix-line-1410.mjs` | Fix line 1410 | No | Yes |
| `fix-neumorphism.mjs` | Fix neumorphism | No | Yes |
| `fix-neumorphism-v2.mjs` | Fix neumorphism | No | Yes |
| `fix-neumorphism-v3.mjs` | Fix neumorphism | No | Yes |
| `fix-remaining-bg-patterns.mjs` | Fix remaining bg patterns | No | Yes |
| `fix-remaining-colors.mjs` | Fix remaining colors | No | Yes |
| `fix-remaining-distinctiveness.mjs` | Fix remaining distinctiveness | No | Yes |
| `fix-specific-bg-patterns.mjs` | Fix specific bg patterns | No | Yes |
| `fix-stray-dark.mjs` | Fix stray dark | No | Yes |
| `fix-syntax-final.mjs` | Fix syntax final | No | Yes |
| `fix-theme-colors.mjs` | Fix theme colors | No | Yes |
| `fix-very-last-distinctiveness.mjs` | Fix very last distinctiveness | No | Yes |
| `apply-all-fixes.mjs` | Apply all fixes | No | Yes |
| `apply-color-fixes-only.mjs` | Apply color fixes | No | Yes |
| `apply-color-fixes-targeted.mjs` | Apply color fixes | No | Yes |
| `update-theme-tokens.mjs` | Update theme tokens | No | Yes |
| `update-theme-tokens-v2.mjs` | Update theme tokens | No | Yes |
| `update-theme-tokens-v3.mjs` | Update theme tokens | No | Yes |
| `update-theme-tokens-v4.mjs` | Update theme tokens | No | Yes |
| `update-theme-tokens-v5.mjs` | Update theme tokens | No | Yes |
| `remove-themes-careful.mjs` | Remove themes | No | Yes |
| `remove-themes-final.mjs` | Remove themes | No | Yes |
| `remove-old-rail-settings.mjs` | Remove old rail settings | No | Yes |
| `final-theme-fix.mjs` | Final theme fix | No | Yes |
| `check-theme-contrast.mjs` | **Check theme contrast** | **Yes** — `npm run check` runs this | **No** — used in CI |
| `check-braces.mjs` | Check braces | No | Yes |
| `check-braces2.mjs` | Check braces | No | Yes |
| `check-json.mjs` | Check JSON | No | Yes |
| `check-ribbon-ids.mjs` | Check ribbon IDs | No | Yes |
| `i18n-add-home-keys.mjs` | Add i18n home keys | No | Yes |
| `i18n-check.mjs` | **Check i18n** | **Yes** — `npm run check` runs this | **No** — used in CI |
| `i18n-merge.mjs` | Merge i18n | No | Yes |
| `i18n-worklist.mjs` | i18n worklist | No | Yes |
| `generate-theme-presets.mjs` | Generate theme presets | No | Yes |
| `generate-logo.js` | Generate logo | No | Yes |
| `smoke-ribbon.mjs` | **Smoke test ribbon** | **Yes** — `npm run smoke` runs this | **No** — used in CI |
| `smoke-quick-access.mjs` | Smoke test quick access | No | Yes |
| `test-layout-tab.mjs` | Test layout tab | No | Yes |
| `ui-check.mjs` | UI check | No | Yes |
| `bg-pattern-fixes.json` | BG pattern fixes data | No | Yes |

---

## Summary

**Files used by the app / CI (do NOT delete):**
- `scripts/check-theme-contrast.mjs` — run by `npm run check`
- `scripts/i18n-check.mjs` — run by `npm run check`
- `scripts/smoke-ribbon.mjs` — run by `npm run smoke`
- `src/lib/locales/ru.json.fixed` — read by 14 root `.cjs` cleanup scripts

**All other listed files are safe to delete** (no imports, no package.json references, not part of the app). They are one-off debug, fix, test, or backup files created during development.