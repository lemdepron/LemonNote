# Graph Report - LemonNote  (2026-11-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2391 nodes · 7379 edges · 143 communities (90 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4781a2f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- InkTabs.jsx
- ref_fs
- cn
- ribbon-actions.js
- ref_node_fs
- toast.js
- text-style.js
- scripts/original_NotePane.jsx
- ribbon-registry.js
- InkEngine
- extensions.js
- with
- dependencies
- FilePanel.jsx
- NoteRibbon.jsx
- mirror.js
- canvas/objects.js
- NotePage.jsx
- devDependencies
- theme-presets.js
- InsertTab.jsx
- App.jsx
- readPref
- useI18n
- VaultHeader
- package.json
- TableContextTab.jsx
- check-theme-contrast.mjs
- ink/engine.js
- CanvasPage.jsx
- MarkdownView.jsx
- tauri.conf.json
- lib.rs
- localDb.js
- CanvasInspector.jsx
- db
- code-languages.js
- exportPdf.js
- theme.js
- analyze-themes.mjs
- CodePage.jsx
- query.js
- TasksPage.jsx
- store.js
- test-shapes.mjs
- shapes.js
- i18n.js
- smoke-quick-access.mjs
- smoke-ribbon.mjs
- PDFView.jsx
- accessibility.test.js
- components.json
- tags.js
- pageStep
- ref_path
- i18n-merge.mjs
- extractWikiLinks
- notes.js
- fix_batch18.mjs
- compilerOptions
- i18n-check.mjs
- escapeRegExp
- color.js
- smoothing.js
- fix_i18n_checker.mjs
- fix_batch19.mjs
- check-ribbon-ids.mjs
- generate-theme-presets.mjs
- CardsPage.jsx
- quick-access.js
- check_key.cjs
- test_iso3.cjs
- encryption.test.js
- scripts
- SettingsPage.jsx
- note-insert.js
- check_newfile.cjs
- fix_batch21.mjs
- i18n-sameas-worklist.mjs
- i18n-worklist.mjs
- attachments.js
- prototype-pdf-ink-test.mjs
- test-migration.mjs
- check_chars.cjs
- check_code_parse.cjs
- count-hardcoded.cjs
- i18n-sameas-merge.mjs
- MacroBar.jsx
- test_iso.cjs
- test_iso2.cjs
- check_dup.cjs
- scan-hardcoded.cjs
- fix_ur.cjs
- ref_vitest
- update-theme-tokens-v2.mjs
- useNoteImages.js
- charts.js
- check_raw_fixed.cjs
- debug-parse4.mjs
- fix_ur5.cjs
- apply-color-fixes-targeted.mjs
- CanvasCard.jsx
- validate_json.mjs
- check_context.cjs
- check_fixed_all_code.cjs
- check_fixed_code.cjs
- check_fixed_vault.cjs
- check_reviver.cjs
- check_vault_code.cjs
- add-missing-i18n.mjs
- check-draw.cjs
- check-draw2.cjs
- count-strings.cjs
- find-physical.cjs
- fix-insert-tab.cjs
- fix_batch16_fixed.mjs
- fix_comma.cjs
- manual_parse.cjs
- remove_dup.cjs
- apply-all-fixes.mjs
- apply-color-fixes-only.mjs
- fix-aggressive-distinctiveness.mjs
- fix-distinctiveness.mjs
- fix-final-distinctiveness.mjs
- fix-last-3-distinctiveness.mjs
- fix-last-4-distinctiveness.mjs
- fix-last-one-distinctiveness.mjs
- fix-remaining-distinctiveness.mjs
- fix-very-last-distinctiveness.mjs
- update-theme-tokens.mjs
- default.json
- check_ink2.mjs
- check_json.cjs
- check_second_code.cjs
- debug_path2.cjs
- fix_batch20.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 228 edges
2. `react` - 121 edges
3. `lucide-react` - 93 edges
4. `useI18n()` - 87 edges
5. `readPref()` - 72 edges
6. `t()` - 68 edges
7. `writePref()` - 68 edges
8. `InkEngine` - 67 edges
9. `NotePage()` - 62 edges
10. `NotePane()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `NotePane()` --calls--> `MarkdownEditor()`  [EXTRACTED]
  docs/archive/scripts/original_NotePane.jsx → src/components/vault/MarkdownEditor.jsx
- `NotePane()` --calls--> `AlertDialogFooter()`  [EXTRACTED]
  docs/archive/scripts/original_NotePane.jsx → src/components/ui/alert-dialog.jsx
- `NotePane()` --calls--> `AlertDialogHeader()`  [EXTRACTED]
  docs/archive/scripts/original_NotePane.jsx → src/components/ui/alert-dialog.jsx
- `NotePane()` --calls--> `confirm()`  [EXTRACTED]
  docs/archive/scripts/original_NotePane.jsx → src/components/ui/use-dialog.jsx
- `NotePane()` --calls--> `VaultHeader()`  [EXTRACTED]
  docs/archive/scripts/original_NotePane.jsx → src/components/vault/VaultHeader.jsx

## Import Cycles
- 2-file cycle: `src/lib/canvas/ink/renderers.js -> src/lib/canvas/objects.js -> src/lib/canvas/ink/renderers.js`
- 3-file cycle: `src/lib/canvas/ink/objects.js -> src/lib/canvas/ink/renderers.js -> src/lib/canvas/objects.js -> src/lib/canvas/ink/objects.js`

## Communities (143 total, 53 thin omitted)

### Community 0 - "InkTabs.jsx"
Cohesion: 0.06
Nodes (89): FindBar(), FORMATS, NoteExportPanel(), PrintExportSection(), OPS, TableTools(), ShareTab(), TableContextTab() (+81 more)

### Community 1 - "ref_fs"
Cohesion: 0.05
Nodes (68): AssistStudio(), Toggle(), AudioStudio(), clock(), BEHAVIOUR, BrushStudio(), ColorStudio(), PALETTES (+60 more)

### Community 2 - "cn"
Cohesion: 0.06
Nodes (67): CanvasCard(), CanvasStage(), CardForm(), CodeEditor(), FindReplace(), ACTIONS, AiAssist(), RibbonSelect() (+59 more)

### Community 3 - "ribbon-actions.js"
Cohesion: 0.06
Nodes (62): NoteStatsPanel(), GraphView(), QueryResults(), ResultRow(), TagButton(), TagGroup(), TagFilterPopover(), Highlight() (+54 more)

### Community 4 - "ref_node_fs"
Cohesion: 0.06
Nodes (50): mockBlobUrls, DialogBody, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle (+42 more)

### Community 5 - "toast.js"
Cohesion: 0.13
Nodes (46): NotePane(), ImmersiveReaderView(), OutlineView(), PrintLayoutView(), ExtensionPanels(), NoteInkSurface(), MODES, NotePane() (+38 more)

### Community 6 - "text-style.js"
Cohesion: 0.10
Nodes (48): CodeContextTab(), templateFor(), copyText(), applyAttr(), applyMarks(), changeCase(), clearFormatting(), clearLineTags() (+40 more)

### Community 7 - "scripts/original_NotePane.jsx"
Cohesion: 0.10
Nodes (4): InkBoard(), InkEngine, createEngine(), createMockCanvas()

### Community 8 - "ribbon-registry.js"
Cohesion: 0.04
Nodes (48): runs-on, steps, strategy, timeout-minutes, concurrency, cancel-in-progress, group, GH_TOKEN (+40 more)

### Community 9 - "InkEngine"
Cohesion: 0.13
Nodes (40): FloatingObjects(), STICKY_COLORS, TOOLBAR_FONTS, TOOLBAR_SIZES, DEFAULT_PAPER, DEFAULT_TOOL, EMPTY_RECOGNITION, applyToGroup() (+32 more)

### Community 10 - "extensions.js"
Cohesion: 0.04
Nodes (45): dependencies, cmdk@^1.0.0, embla-carousel-react@^8.5.2, katex@^0.19.1, lucide-react@^0.475.0, @radix-ui/react-accordion@^1.2.3, @radix-ui/react-alert-dialog@^1.1.6, @radix-ui/react-checkbox@^1.1.4 (+37 more)

### Community 11 - "with"
Cohesion: 0.06
Nodes (38): GROUPS, PREVIEW_COLOR_KEYS, PREVIEW_STYLE_KEYS, ThemeGallery(), ThemeMiniPreview(), AA_BODY, ALL_THEMES, auditContrast() (+30 more)

### Community 12 - "dependencies"
Cohesion: 0.17
Nodes (35): @radix-ui/react-alert-dialog, BUILTIN_TEMPLATES, EncryptionSection(), FilePanel(), NewSection(), SettingsSection(), TemplatesSection(), AlertDialogAction (+27 more)

### Community 13 - "FilePanel.jsx"
Cohesion: 0.06
Nodes (39): devDependencies, autoprefixer@^10.4.20, baseline-browser-mapping@^2.8.32, eslint@^9.19.0, @eslint/js@^9.19.0, eslint-plugin-react@^7.37.4, eslint-plugin-react-hooks@^5.0.0, eslint-plugin-react-refresh@^0.4.18 (+31 more)

### Community 14 - "NoteRibbon.jsx"
Cohesion: 0.09
Nodes (31): Btn(), MenuItem(), RibbonContext, RibbonMenu(), RibbonPanelPopoverContext, RibbonPanelPopoverProvider(), Stepper(), Swatches() (+23 more)

### Community 15 - "mirror.js"
Cohesion: 0.09
Nodes (31): App(), CalendarPageWithErrorBoundary, CanvasHomeWithErrorBoundary, CanvasPageWithErrorBoundary, CardsPageWithErrorBoundary, CodeHomeWithErrorBoundary, CodePageWithErrorBoundary, ExtensionsPageWithErrorBoundary (+23 more)

### Community 16 - "canvas/objects.js"
Cohesion: 0.13
Nodes (29): openDated(), CALLOUTS, InsertTab(), getAssetPath(), ALL_FENCE_LANGUAGES, FENCE_GROUPS, fenceLabel(), QUICK_LANGUAGES (+21 more)

### Community 17 - "NotePage.jsx"
Cohesion: 0.15
Nodes (33): RibbonGroup(), CanvasDrawTab(), CanvasFramesTab(), CanvasObjectsTab(), CanvasViewTab(), EraserPopover(), InkTab(), MoreToolsPopover() (+25 more)

### Community 18 - "devDependencies"
Cohesion: 0.08
Nodes (32): ALL_THEMES, BAUHAUS_THEMES, checkGlassContrast(), checkNeumorphicContrast(), CLAYMORPHISM_THEMES, contrastOf(), CYBERPUNK_THEMES, EDITORIAL_THEMES (+24 more)

### Community 19 - "theme-presets.js"
Cohesion: 0.06
Nodes (34): class-variance-authority@^0.7.1, input-otp@^1.4.2, moment@^2.31.0, pdfjs-dist@^6.5.438, @radix-ui/react-avatar@^1.1.3, @radix-ui/react-label@^2.1.2, @radix-ui/react-select@^2.1.6, @radix-ui/react-separator@^1.1.2 (+26 more)

### Community 20 - "InsertTab.jsx"
Cohesion: 0.11
Nodes (26): NavigationPane(), NoteOutlinePanel(), NavigationPane(), RibbonFrame(), RibbonPanel(), RibbonTabLine(), MODES, DropdownMenuCheckboxItem (+18 more)

### Community 21 - "App.jsx"
Cohesion: 0.09
Nodes (29): colorSwatches, fontGroups, watermarkPresets, COLOR_BY_ID, COLORS, DEFAULT_GRID_SIZE, DEFAULT_LINE_HEIGHT, DEFAULT_STYLE (+21 more)

### Community 22 - "readPref"
Cohesion: 0.12
Nodes (15): paintElement(), clamp(), drawPaper(), drawTemplate(), PAGE_SIZES, pageIndexAt(), pageOrigin(), pageStep() (+7 more)

### Community 23 - "useI18n"
Cohesion: 0.14
Nodes (25): Button, useAutoUpdateCheck(), useUpdater(), convertBase64ImagesToAttachments(), getDigits(), get_autostart_state(), get_minimize_to_tray_state(), get_start_minimized_state() (+17 more)

### Community 24 - "VaultHeader"
Cohesion: 0.15
Nodes (28): CANVAS_EXPORT_EXTENSION, CANVAS_EXPORT_MIME, CANVAS_EXPORT_VERSION, createExportDocument(), createImportInput(), exportCanvasDoc(), importCanvasDoc(), triggerImport() (+20 more)

### Community 25 - "package.json"
Cohesion: 0.07
Nodes (29): debugApplicationIdSuffix, app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl (+21 more)

### Community 26 - "TableContextTab.jsx"
Cohesion: 0.10
Nodes (8): create_tray_icon(), DirEntryInfo, mkdir(), read_dir(), read_text_file(), run(), validate_path(), write_text_file()

### Community 27 - "check-theme-contrast.mjs"
Cohesion: 0.17
Nodes (25): useMirror(), blobToBase64(), extractAttachmentRefs(), generateFrontMatter(), getAttachmentsMirrorPath(), getAutoMirror(), getMirrorEnabled(), getMirrorFolder() (+17 more)

### Community 28 - "ink/engine.js"
Cohesion: 0.13
Nodes (24): applyDefaults(), auth, baseEntities, cache, clearDbCache(), clone(), closeDb(), compareBy() (+16 more)

### Community 29 - "CanvasPage.jsx"
Cohesion: 0.17
Nodes (22): angleBetween(), arrowPaths(), average(), deviation(), ellipsePath(), polygonPath(), recognizeShape(), rectPath() (+14 more)

### Community 30 - "MarkdownView.jsx"
Cohesion: 0.34
Nodes (26): CanvasInspector(), CardInspector(), Checkbox(), CollapsibleSection(), ConnectorInspector(), DeleteButton(), DisplayFields(), FieldLabel() (+18 more)

### Community 31 - "tauri.conf.json"
Cohesion: 0.14
Nodes (22): ExtensionRow(), KIND_META, Switch, activeThemeVars(), appliedVars, applyTheme(), bannersFor(), BUILTIN_EXTENSIONS (+14 more)

### Community 32 - "lib.rs"
Cohesion: 0.22
Nodes (18): CardComposer(), CodeBlockPicker(), InputMenu(), ItemsMenu(), LanguagesMenu(), PinChip(), PinnedButton(), QuickAccess() (+10 more)

### Community 33 - "localDb.js"
Cohesion: 0.12
Nodes (20): ACTIONS, CommandPalette(), useVault(), findAttachmentRefs(), cutoffIso(), deleteFolder(), deleteNoteForever(), dropInk() (+12 more)

### Community 34 - "CanvasInspector.jsx"
Cohesion: 0.17
Nodes (20): DUE_STYLES, STYLES, TaskLine(), useTaskReminders(), isJournalTitle(), collectTasks(), CYCLE, filterTasks() (+12 more)

### Community 35 - "db"
Cohesion: 0.13
Nodes (19): ALL_TOOL_MODES, CanvasBoard, CURSORS, getConnectorHint(), CURSORS, INK_TOOL_MODES, inkForTone(), paintText() (+11 more)

### Community 36 - "code-languages.js"
Cohesion: 0.10
Nodes (13): InfoSection(), applyI18n(), formatDate(), formatDateTime(), formatNumber(), getLang(), interpolate(), isRTL() (+5 more)

### Community 37 - "exportPdf.js"
Cohesion: 0.17
Nodes (16): react, NoteContainer(), NoteContainerInner(), NoteTabs(), SplitDivider(), PaneFocusContext, PaneFocusProvider(), usePaneFocus() (+8 more)

### Community 38 - "theme.js"
Cohesion: 0.16
Nodes (19): SpacePulsePanel(), readFavPens(), readHighlighterSettings(), readPenSettings(), readShapeSettings(), useNoteTabs(), readCustomPalette(), readHistory() (+11 more)

### Community 39 - "analyze-themes.mjs"
Cohesion: 0.17
Nodes (18): DIR_AUTO_TAGS, extractTables(), isFileAttachment(), MarkdownAudio(), MarkdownFileAttachment(), MarkdownImage(), REHYPE, REMARK (+10 more)

### Community 40 - "CodePage.jsx"
Cohesion: 0.13
Nodes (17): ch(), contrastOf(), darkThemes, darkTokens(), getPresetColors(), hslToRgb(), lightThemes, lightTokens() (+9 more)

### Community 41 - "query.js"
Cohesion: 0.18
Nodes (19): chunkStrokes(), hashChunk(), MAX_CHUNK_BYTES, strokeBytes(), decodePoints(), decodePressures(), encodePoints(), encodePressures() (+11 more)

### Community 42 - "TasksPage.jsx"
Cohesion: 0.14
Nodes (8): MODES, WordGoalBar(), NoteInkOverlay(), focus, listeners, setFocusMode(), toggleFocusMode(), isIframe

### Community 43 - "store.js"
Cohesion: 0.19
Nodes (15): lucide-react, react-router-dom, db, READ_WIDTHS, StatRow(), VIEW_MODES, ZOOM_PRESETS, SpaceListPage() (+7 more)

### Community 44 - "test-shapes.mjs"
Cohesion: 0.16
Nodes (19): angleBetween(), arrowPaths(), arrowPoints, average(), boundsOf(), circlePoints, deviation(), distToSegment() (+11 more)

### Community 45 - "shapes.js"
Cohesion: 0.17
Nodes (19): clock(), ExtensionEvents(), apis, createRegistry(), dispatchIndexedEvent(), log, logWatchers, messageOf() (+11 more)

### Community 46 - "i18n.js"
Cohesion: 0.18
Nodes (14): ExtensionRuntime(), ContractList(), Line(), SpaceManifestCard(), useExtensions(), listExtensions(), subscribeExtensions(), EVENT_CONTRACTS (+6 more)

### Community 47 - "smoke-quick-access.mjs"
Cohesion: 0.21
Nodes (15): countIn(), isWordChar(), linkBody(), linkIn(), LinkSuggesterPanel(), segments(), chime(), clock() (+7 more)

### Community 48 - "smoke-ribbon.mjs"
Cohesion: 0.26
Nodes (15): checkColorContrast(), checkImagesWithoutAlt(), checkSkippedHeadings(), checkWeakLinks(), runAccessibilityChecks(), assertEqual(), testColorContrast(), testColorContrastOk() (+7 more)

### Community 49 - "PDFView.jsx"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 50 - "accessibility.test.js"
Cohesion: 0.12
Nodes (12): contextualTabs, __dirname, dom, GLOBAL_SHORTCUTS, mainTabs, markdownContext, projectRoot, pythonContext (+4 more)

### Community 51 - "components.json"
Cohesion: 0.11
Nodes (12): buttons, container, __dirname, dom, expectedOrder, fakeCtx, ids, KINDS (+4 more)

### Community 52 - "tags.js"
Cohesion: 0.12
Nodes (9): files, fs, path, files, fs, path, __dirname, LOCALE_FILES (+1 more)

### Community 53 - "pageStep"
Cohesion: 0.13
Nodes (6): CANVAS_TOOL_GROUPS, CANVAS_TOOLS, getToolById(), ObjectInspector(), PEN_COLORS, PEN_WIDTHS

### Community 54 - "ref_path"
Cohesion: 0.12
Nodes (5): fs, fs, fs, fs, fs

### Community 55 - "i18n-merge.mjs"
Cohesion: 0.12
Nodes (15): compilerOptions, allowSyntheticDefaultImports, checkJs, esModuleInterop, jsx, lib, module, moduleResolution (+7 more)

### Community 56 - "extractWikiLinks"
Cohesion: 0.12
Nodes (11): en, enPaths, locales, paths(), scanSourceFiles(), sourceFiles, TEMPLATE_FAMILIES, usedKeys (+3 more)

### Community 57 - "notes.js"
Cohesion: 0.14
Nodes (10): arrStr, firstObjStart, source, startIdx, arrStr, cleanStr, source, startIdx (+2 more)

### Community 58 - "fix_batch18.mjs"
Cohesion: 0.14
Nodes (11): vite@^8.3.3, @vitejs/plugin-react@^6.0.5, vite, @vitejs/plugin-react, files, invalidCapability, missing, missingCapability (+3 more)

### Community 59 - "compilerOptions"
Cohesion: 0.24
Nodes (12): buildDefaultPreset(), buildFamilyArray(), buildModeTokens(), buildStyleLayer(), buildTheme(), buildThemeObject(), DEFAULT_PRESET, escapeForJson() (+4 more)

### Community 60 - "i18n-check.mjs"
Cohesion: 0.30
Nodes (10): putFile(), PDFInkOverlay(), cn(), PDFView(), addInkToPDF(), exportPDF(), extractInkFromPDF(), hasInkAnnotations() (+2 more)

### Community 61 - "escapeRegExp"
Cohesion: 0.38
Nodes (11): CardReview(), addDays(), dueLabel(), isDue(), iso(), newCard(), RATINGS, schedule() (+3 more)

### Community 62 - "color.js"
Cohesion: 0.31
Nodes (13): PinMenu(), addPin(), isPinned(), normalizePins(), QUICK_ACCESS_PREF, readPins(), removePin(), reorderPin() (+5 more)

### Community 63 - "smoothing.js"
Cohesion: 0.23
Nodes (10): createFileObjectUrl(), deleteFile(), getDb(), getFile(), deleteAttachment(), deleteUnusedAttachments(), findAllUsedAttachmentRefs(), getAttachmentInfo() (+2 more)

### Community 64 - "fix_i18n_checker.mjs"
Cohesion: 0.17
Nodes (12): scripts, build, check, check:canvas-keys, check:fonts, dev, lint, lint:fix (+4 more)

### Community 65 - "fix_batch19.mjs"
Cohesion: 0.36
Nodes (8): VersionHistoryPanel(), WordGoalBar(), countWords(), clearSnapshots(), key(), listSnapshots(), pushSnapshot(), SNAPSHOT_INTERVAL

### Community 66 - "check-ribbon-ids.mjs"
Cohesion: 0.32
Nodes (10): codeBlockInsert(), codeSnippet(), editorCaret(), fencedBlocks(), IMAGE_TYPES, insertAtCaret(), MAX_IMAGE_BYTES, prefixLine() (+2 more)

### Community 67 - "generate-theme-presets.mjs"
Cohesion: 0.20
Nodes (9): batchSize, en, enPaths, getValue(), loc, locPaths, paths(), sameAsEnKeys (+1 more)

### Community 68 - "CardsPage.jsx"
Cohesion: 0.18
Nodes (8): batchSize, en, enPaths, loc, locPaths, missingKeys, paths(), workObj

### Community 69 - "quick-access.js"
Cohesion: 0.20
Nodes (5): CONTEXTUAL_TABS, EDITOR_SHORTCUTS, GLOBAL_SHORTCUTS, MAIN_TABS, TabErrorBoundary

### Community 70 - "check_key.cjs"
Cohesion: 0.40
Nodes (8): decrypt(), deriveKey(), encrypt(), isNoteLocked(), looksEncrypted(), assert(), assertThrowsAsync(), runTests()

### Community 71 - "test_iso3.cjs"
Cohesion: 0.20
Nodes (7): defaultChecks, minimalCanvas, minimalCard, minimalConn, minimalDoc, testCanvases, testInkPages

### Community 72 - "encryption.test.js"
Cohesion: 0.22
Nodes (7): compFiles, fs, pagesFiles, path, results, scanDir(), sorted

### Community 73 - "scripts"
Cohesion: 0.22
Nodes (5): en, enPaths, loc, paths(), work

### Community 74 - "SettingsPage.jsx"
Cohesion: 0.22
Nodes (5): en, enPaths, loc, paths(), work

### Community 75 - "note-insert.js"
Cohesion: 0.53
Nodes (7): MacroBar(), appendStep(), applyMacro(), captureStep(), createMacro(), describeMacro(), newId()

### Community 77 - "fix_batch21.mjs"
Cohesion: 0.25
Nodes (7): fs, path, patterns, results, scanDir(), sortedFiles, sourceFiles

### Community 79 - "i18n-worklist.mjs"
Cohesion: 0.25
Nodes (4): canvasFiles, en, enPaths, paths()

### Community 81 - "prototype-pdf-ink-test.mjs"
Cohesion: 0.61
Nodes (7): escapeHtml(), MARGIN, parseTableData(), renderBarChart(), renderChart(), renderLineChart(), renderPieChart()

### Community 82 - "test-migration.mjs"
Cohesion: 0.29
Nodes (6): arrStr, cleanStr, source, startIdx, testMatch, testStr

### Community 83 - "check_chars.cjs"
Cohesion: 0.33
Nodes (5): en, enPath, localeFiles, localesDir, newKeys

### Community 84 - "check_code_parse.cjs"
Cohesion: 0.33
Nodes (5): drawLines, en, fs, keys, lines

### Community 85 - "count-hardcoded.cjs"
Cohesion: 0.33
Nodes (5): drawLines, en, fs, keys, lines

### Community 86 - "i18n-sameas-merge.mjs"
Cohesion: 0.33
Nodes (5): findHardcodedStrings(), fs, path, results, results2

### Community 87 - "MacroBar.jsx"
Cohesion: 0.33
Nodes (5): details, files, findFiles(), fs, path

### Community 88 - "test_iso.cjs"
Cohesion: 0.33
Nodes (5): btnStrings, content, fs, groupLabels, path

### Community 89 - "test_iso2.cjs"
Cohesion: 0.60
Nodes (5): useNoteImages(), getPendingFigureCaption(), figureSnippet(), imageRejection(), imageSnippet()

### Community 90 - "check_dup.cjs"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 92 - "fix_ur.cjs"
Cohesion: 0.50
Nodes (3): content, fs, path

### Community 93 - "ref_vitest"
Cohesion: 0.50
Nodes (3): fontFiles, fontsDir, WOFF2_MAGIC

## Knowledge Gaps
- **1 isolated node(s):** `app`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `exportPdf.js` to `InkTabs.jsx`, `ref_fs`, `cn`, `ribbon-actions.js`, `ref_node_fs`, `toast.js`, `InkEngine`, `extensions.js`, `with`, `dependencies`, `NoteRibbon.jsx`, `mirror.js`, `canvas/objects.js`, `NotePage.jsx`, `theme-presets.js`, `InsertTab.jsx`, `useI18n`, `check-theme-contrast.mjs`, `MarkdownView.jsx`, `tauri.conf.json`, `lib.rs`, `localDb.js`, `CanvasInspector.jsx`, `db`, `code-languages.js`, `theme.js`, `analyze-themes.mjs`, `TasksPage.jsx`, `store.js`, `shapes.js`, `i18n.js`, `smoke-quick-access.mjs`, `pageStep`, `i18n-check.mjs`, `escapeRegExp`, `color.js`, `fix_batch19.mjs`, `quick-access.js`, `note-insert.js`, `attachments.js`, `test_iso2.cjs`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `useI18n()` (e.g. with `formatDate()` and `formatDateTime()`) actually correct?**
  _`useI18n()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `app` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `InkTabs.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056831683168316834 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `InsertTab.jsx` to `InkTabs.jsx`, `ref_fs`, `cn`, `ribbon-actions.js`, `ref_node_fs`, `toast.js`, `scripts/original_NotePane.jsx`, `InkEngine`, `with`, `dependencies`, `NoteRibbon.jsx`, `canvas/objects.js`, `NotePage.jsx`, `useI18n`, `MarkdownView.jsx`, `tauri.conf.json`, `lib.rs`, `localDb.js`, `CanvasInspector.jsx`, `db`, `exportPdf.js`, `TasksPage.jsx`, `shapes.js`, `i18n.js`, `smoke-quick-access.mjs`, `pageStep`, `i18n-check.mjs`, `escapeRegExp`, `fix_batch19.mjs`, `quick-access.js`, `note-insert.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `ref_fs` be split into smaller, more focused modules?**
  _Cohesion score 0.05087719298245614 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `store.js` to `InkTabs.jsx`, `ref_fs`, `cn`, `ribbon-actions.js`, `ref_node_fs`, `toast.js`, `text-style.js`, `InkEngine`, `extensions.js`, `with`, `dependencies`, `NoteRibbon.jsx`, `mirror.js`, `canvas/objects.js`, `NotePage.jsx`, `theme-presets.js`, `InsertTab.jsx`, `App.jsx`, `useI18n`, `tauri.conf.json`, `lib.rs`, `localDb.js`, `CanvasInspector.jsx`, `exportPdf.js`, `analyze-themes.mjs`, `TasksPage.jsx`, `i18n.js`, `smoke-quick-access.mjs`, `pageStep`, `i18n-check.mjs`, `escapeRegExp`, `fix_batch19.mjs`, `quick-access.js`, `note-insert.js`, `attachments.js`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._