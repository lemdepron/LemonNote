import fs from 'fs';

// Fix fa.json - add missing ribbon.wordGoal and ribbon.macros
const faContent = fs.readFileSync('src/lib/locales/fa.json', 'utf8');
const fa = JSON.parse(faContent);

fa.ribbon.wordGoal = {
  "wordGoal": "هدف کلمات",
  "targetWords": "کلمات هدف",
  "setGoal": "تعیین هدف",
  "updateGoal": "به‌روزرسانی هدف",
  "editGoal": "ویرایش هدف",
  "clearGoal": "پاک کردن هدف"
};

fa.ribbon.macros = "ماکرو";
fa.ribbon.macrosHint = "ثبت و پخش مجدد ماکروهای ویرایش";

// Write back fa.json
fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
console.log('fa.json done!');

// Fix zh.json - remove extra vault.shortcuts keys
const zhContent = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const zh = JSON.parse(zhContent);

// Helper to safely delete nested keys
function safeDelete(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current || !current[parts[i]]) return;
    current = current[parts[i]];
  }
  if (current) delete current[parts[parts.length - 1]];
}

// Cards
safeDelete(zh, 'vault.shortcuts.cards.heroTitle');
safeDelete(zh, 'vault.shortcuts.cards.newCard');
safeDelete(zh, 'vault.shortcuts.cards.stats');
safeDelete(zh, 'vault.shortcuts.cards.nothingDue');
safeDelete(zh, 'vault.shortcuts.cards.noCards');
safeDelete(zh, 'vault.shortcuts.cards.nextCard');
safeDelete(zh, 'vault.shortcuts.cards.emptyHint');
safeDelete(zh, 'vault.shortcuts.cards.allCards');
safeDelete(zh, 'vault.shortcuts.cards.reps');
safeDelete(zh, 'vault.shortcuts.cards.deleteCard');

// Graph
safeDelete(zh, 'vault.shortcuts.graph.heroTitle');
safeDelete(zh, 'vault.shortcuts.graph.subtitle');
safeDelete(zh, 'vault.shortcuts.graph.emptyState');
safeDelete(zh, 'vault.shortcuts.graph.backToVault');

// Canvas - only delete what exists
safeDelete(zh, 'vault.shortcuts.canvas.heroTitle');
safeDelete(zh, 'vault.shortcuts.canvas.subtitle');
safeDelete(zh, 'vault.shortcuts.canvas.emptyState');
safeDelete(zh, 'vault.shortcuts.canvas.backToCanvases');
safeDelete(zh, 'vault.shortcuts.canvas.cardInspector');
safeDelete(zh, 'vault.shortcuts.canvas.canvasGuide');
safeDelete(zh, 'vault.shortcuts.canvas.guideText1');
safeDelete(zh, 'vault.shortcuts.canvas.guideText2');
safeDelete(zh, 'vault.shortcuts.canvas.stats');
safeDelete(zh, 'vault.shortcuts.canvas.newCardTitle');
safeDelete(zh, 'vault.shortcuts.canvas.addCard');
safeDelete(zh, 'vault.shortcuts.canvas.saving');
safeDelete(zh, 'vault.shortcuts.canvas.saved');
safeDelete(zh, 'vault.shortcuts.canvas.autosaveOn');
safeDelete(zh, 'vault.shortcuts.canvas.canvasName');
safeDelete(zh, 'vault.shortcuts.canvas.status.saving');
safeDelete(zh, 'vault.shortcuts.canvas.status.saved');
safeDelete(zh, 'vault.shortcuts.canvas.status.autosaveOn');
safeDelete(zh, 'vault.shortcuts.canvas.addFrame');
safeDelete(zh, 'vault.shortcuts.canvas.fitToPage');
safeDelete(zh, 'vault.shortcuts.canvas.fitToWidth');
safeDelete(zh, 'vault.shortcuts.canvas.zoomOut');
safeDelete(zh, 'vault.shortcuts.canvas.zoomIn');
safeDelete(zh, 'vault.shortcuts.canvas.resetView');
safeDelete(zh, 'vault.shortcuts.canvas.export');
safeDelete(zh, 'vault.shortcuts.canvas.import');
safeDelete(zh, 'vault.shortcuts.canvas.exportTooltip');
safeDelete(zh, 'vault.shortcuts.canvas.importTooltip');
safeDelete(zh, 'vault.shortcuts.canvas.importSuccess');
safeDelete(zh, 'vault.shortcuts.canvas.exportPdf');
safeDelete(zh, 'vault.shortcuts.canvas.exportPng');
safeDelete(zh, 'vault.shortcuts.canvas.exportWholeCanvas');
safeDelete(zh, 'vault.shortcuts.canvas.exportSelectedFrame');
safeDelete(zh, 'vault.shortcuts.canvas.exportPdfTooltip');
safeDelete(zh, 'vault.shortcuts.canvas.exportPngTooltip');
safeDelete(zh, 'vault.shortcuts.canvas.selectFrameFirst');
safeDelete(zh, 'vault.shortcuts.canvas.newDesign');
safeDelete(zh, 'vault.shortcuts.canvas.modeDesign');
safeDelete(zh, 'vault.shortcuts.canvas.kindDesign');

// Tables
safeDelete(zh, 'vault.shortcuts.tables.heroTitle');
safeDelete(zh, 'vault.shortcuts.tables.subtitle');
safeDelete(zh, 'vault.shortcuts.tables.emptyState');
safeDelete(zh, 'vault.shortcuts.tables.backToTables');
safeDelete(zh, 'vault.shortcuts.tables.viewTable');
safeDelete(zh, 'vault.shortcuts.tables.viewBoard');
safeDelete(zh, 'vault.shortcuts.tables.viewGallery');
safeDelete(zh, 'vault.shortcuts.tables.addColumn');
safeDelete(zh, 'vault.shortcuts.tables.addRow');
safeDelete(zh, 'vault.shortcuts.tables.priorityPlaceholder');
safeDelete(zh, 'vault.shortcuts.tables.typePlaceholder');
safeDelete(zh, 'vault.shortcuts.tables.optionsPlaceholder');
safeDelete(zh, 'vault.shortcuts.tables.tablePickerPlaceholder');
safeDelete(zh, 'vault.shortcuts.tables.addButton');
safeDelete(zh, 'vault.shortcuts.tables.status.saving');
safeDelete(zh, 'vault.shortcuts.tables.status.saved');
safeDelete(zh, 'vault.shortcuts.tables.status.autosaveOn');
safeDelete(zh, 'vault.shortcuts.tables.stats');
safeDelete(zh, 'vault.shortcuts.tables.tableName');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.text');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.number');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.select');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.date');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.checkbox');
safeDelete(zh, 'vault.shortcuts.tables.columnTypes.relation');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.text');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.number');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.select');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.date');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.checkbox');
safeDelete(zh, 'vault.shortcuts.tables.typeBadge.relation');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.placeholder');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.numberPlaceholder');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.renameColumn');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.deleteColumn');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.deleteRow');
safeDelete(zh, 'vault.shortcuts.tables.tableGrid.noRows');
safeDelete(zh, 'vault.shortcuts.tables.boardView.needsSelect');
safeDelete(zh, 'vault.shortcuts.tables.boardView.addSelect');
safeDelete(zh, 'vault.shortcuts.tables.boardView.ungrouped');
safeDelete(zh, 'vault.shortcuts.tables.galleryView.noRows');
safeDelete(zh, 'vault.shortcuts.tables.galleryView.addRow');
safeDelete(zh, 'vault.shortcuts.tables.galleryView.checkboxYes');

// Code
safeDelete(zh, 'vault.shortcuts.code.heroTitle');
safeDelete(zh, 'vault.shortcuts.code.subtitle');
safeDelete(zh, 'vault.shortcuts.code.emptyState');
safeDelete(zh, 'vault.shortcuts.code.backToCode');
safeDelete(zh, 'vault.shortcuts.code.fileName');
safeDelete(zh, 'vault.shortcuts.code.languagePlaceholder');
safeDelete(zh, 'vault.shortcuts.code.findButton');
safeDelete(zh, 'vault.shortcuts.code.status.saving');
safeDelete(zh, 'vault.shortcuts.code.status.saved');
safeDelete(zh, 'vault.shortcuts.code.status.autosaveOn');

// Queries
safeDelete(zh, 'vault.shortcuts.queries.heroTitle');
safeDelete(zh, 'vault.shortcuts.queries.description');
safeDelete(zh, 'vault.shortcuts.queries.placeholder');
safeDelete(zh, 'vault.shortcuts.queries.saveButton');
safeDelete(zh, 'vault.shortcuts.queries.resultsLabel');
safeDelete(zh, 'vault.shortcuts.queries.indexing');
safeDelete(zh, 'vault.shortcuts.queries.notesCount');
safeDelete(zh, 'vault.shortcuts.queries.savedQueriesLabel');
safeDelete(zh, 'vault.shortcuts.queries.noSavedQueries');
safeDelete(zh, 'vault.shortcuts.queries.syntaxLabel');

// Extensions
safeDelete(zh, 'vault.shortcuts.extensions.heroTitle');
safeDelete(zh, 'vault.shortcuts.extensions.description');
safeDelete(zh, 'vault.shortcuts.extensions.installedLabel');
safeDelete(zh, 'vault.shortcuts.extensions.activeCount');
safeDelete(zh, 'vault.shortcuts.extensions.cssOverridesLabel');
safeDelete(zh, 'vault.shortcuts.extensions.cssOverridesDesc');
safeDelete(zh, 'vault.shortcuts.extensions.customThemeExample');
safeDelete(zh, 'vault.shortcuts.extensions.applyButton');
safeDelete(zh, 'vault.shortcuts.extensions.resetButton');
safeDelete(zh, 'vault.shortcuts.extensions.appliedStatus');
safeDelete(zh, 'vault.shortcuts.extensions.runtimeLogLabel');
safeDelete(zh, 'vault.shortcuts.extensions.liveStatus');
safeDelete(zh, 'vault.shortcuts.extensions.tabManifestLabel');
safeDelete(zh, 'vault.shortcuts.extensions.tabManifestDesc');

// Trash
safeDelete(zh, 'vault.shortcuts.trash.heroTitle');
safeDelete(zh, 'vault.shortcuts.trash.description');
safeDelete(zh, 'vault.shortcuts.trash.itemCount');
safeDelete(zh, 'vault.shortcuts.trash.loading');
safeDelete(zh, 'vault.shortcuts.trash.emptyState');
safeDelete(zh, 'vault.shortcuts.trash.emptyDescription');
safeDelete(zh, 'vault.shortcuts.trash.noteSnippet');
safeDelete(zh, 'vault.shortcuts.trash.deletedAgo');
safeDelete(zh, 'vault.shortcuts.trash.expiresToday');
safeDelete(zh, 'vault.shortcuts.trash.daysLeft');
safeDelete(zh, 'vault.shortcuts.trash.restoreButton');
safeDelete(zh, 'vault.shortcuts.trash.toastRestored');
safeDelete(zh, 'vault.shortcuts.trash.deleteForeverDialog.title');
safeDelete(zh, 'vault.shortcuts.trash.deleteForeverDialog.description');
safeDelete(zh, 'vault.shortcuts.trash.deleteForeverDialog.keepButton');
safeDelete(zh, 'vault.shortcuts.trash.deleteForeverDialog.deleteButton');
safeDelete(zh, 'vault.shortcuts.trash.ariaDeleteForever');

// Write back zh.json
fs.writeFileSync('src/lib/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('zh.json done!');

console.log('Done!');