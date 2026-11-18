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

// Remove extra vault.shortcuts keys that don't exist in en.json
delete zh.vault.shortcuts.cards.heroTitle;
delete zh.vault.shortcuts.cards.newCard;
delete zh.vault.shortcuts.cards.stats;
delete zh.vault.shortcuts.cards.nothingDue;
delete zh.vault.shortcuts.cards.noCards;
delete zh.vault.shortcuts.cards.nextCard;
delete zh.vault.shortcuts.cards.emptyHint;
delete zh.vault.shortcuts.cards.allCards;
delete zh.vault.shortcuts.cards.reps;
delete zh.vault.shortcuts.cards.deleteCard;
delete zh.vault.shortcuts.graph.heroTitle;
delete zh.vault.shortcuts.graph.subtitle;
delete zh.vault.shortcuts.graph.emptyState;
delete zh.vault.shortcuts.graph.backToVault;
delete zh.vault.shortcuts.canvas.heroTitle;
delete zh.vault.shortcuts.canvas.subtitle;
delete zh.vault.shortcuts.canvas.emptyState;
delete zh.vault.shortcuts.canvas.backToCanvases;
delete zh.vault.shortcuts.canvas.cardInspector;
delete zh.vault.shortcuts.canvas.canvasGuide;
delete zh.vault.shortcuts.canvas.guideText1;
delete zh.vault.shortcuts.canvas.guideText2;
delete zh.vault.shortcuts.canvas.stats;
delete zh.vault.shortcuts.canvas.newCardTitle;
delete zh.vault.shortcuts.canvas.addCard;
delete zh.vault.shortcuts.canvas.saving;
delete zh.vault.shortcuts.canvas.saved;
delete zh.vault.shortcuts.canvas.autosaveOn;
delete zh.vault.shortcuts.canvas.canvasName;
delete zh.vault.shortcuts.canvas.status.saving;
delete zh.vault.shortcuts.canvas.status.saved;
delete zh.vault.shortcuts.canvas.status.autosaveOn;
delete zh.vault.shortcuts.canvas.addFrame;
delete zh.vault.shortcuts.canvas.fitToPage;
delete zh.vault.shortcuts.canvas.fitToWidth;
delete zh.vault.shortcuts.canvas.zoomOut;
delete zh.vault.shortcuts.canvas.zoomIn;
delete zh.vault.shortcuts.canvas.resetView;
delete zh.vault.shortcuts.canvas.export;
delete zh.vault.shortcuts.canvas.import;
delete zh.vault.shortcuts.canvas.exportTooltip;
delete zh.vault.shortcuts.canvas.importTooltip;
delete zh.vault.shortcuts.canvas.importSuccess;
delete zh.vault.shortcuts.canvas.exportPdf;
delete zh.vault.shortcuts.canvas.exportPng;
delete zh.vault.shortcuts.canvas.exportWholeCanvas;
delete zh.vault.shortcuts.canvas.exportSelectedFrame;
delete zh.vault.shortcuts.canvas.exportPdfTooltip;
delete zh.vault.shortcuts.canvas.exportPngTooltip;
delete zh.vault.shortcuts.canvas.selectFrameFirst;
delete zh.vault.shortcuts.canvas.newDesign;
delete zh.vault.shortcuts.canvas.modeDesign;
delete zh.vault.shortcuts.canvas.kindDesign;
delete zh.vault.shortcuts.canvas.frameTypes.a4;
delete zh.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete zh.vault.shortcuts.canvas.frameTypes.letter;
delete zh.vault.shortcuts.canvas.frameTypes["3:4"];
delete zh.vault.shortcuts.canvas.frameTypes["4:3"];
delete zh.vault.shortcuts.canvas.frameTypes["16:9"];
delete zh.vault.shortcuts.canvas.frameTypes.square;
delete zh.vault.shortcuts.canvas.frameTypes.free;
delete zh.vault.shortcuts.canvas.textFrame.locked;
delete zh.vault.shortcuts.canvas.textFrame.unlock;
delete zh.vault.shortcuts.canvas.textFrame.unlockWarning;
delete zh.vault.shortcuts.tables.heroTitle;
delete zh.vault.shortcuts.tables.subtitle;
delete zh.vault.shortcuts.tables.emptyState;
delete zh.vault.shortcuts.tables.backToTables;
delete zh.vault.shortcuts.tables.viewTable;
delete zh.vault.shortcuts.tables.viewBoard;
delete zh.vault.shortcuts.tables.viewGallery;
delete zh.vault.shortcuts.tables.addColumn;
delete zh.vault.shortcuts.tables.addRow;
delete zh.vault.shortcuts.tables.priorityPlaceholder;
delete zh.vault.shortcuts.tables.typePlaceholder;
delete zh.vault.shortcuts.tables.optionsPlaceholder;
delete zh.vault.shortcuts.tables.tablePickerPlaceholder;
delete zh.vault.shortcuts.tables.addButton;
delete zh.vault.shortcuts.tables.status.saving;
delete zh.vault.shortcuts.tables.status.saved;
delete zh.vault.shortcuts.tables.status.autosaveOn;
delete zh.vault.shortcuts.tables.stats;
delete zh.vault.shortcuts.tables.tableName;
delete zh.vault.shortcuts.tables.columnTypes.text;
delete zh.vault.shortcuts.tables.columnTypes.number;
delete zh.vault.shortcuts.tables.columnTypes.select;
delete zh.vault.shortcuts.tables.columnTypes.date;
delete zh.vault.shortcuts.tables.columnTypes.checkbox;
delete zh.vault.shortcuts.tables.columnTypes.relation;
delete zh.vault.shortcuts.tables.typeBadge.text;
delete zh.vault.shortcuts.tables.typeBadge.number;
delete zh.vault.shortcuts.tables.typeBadge.select;
delete zh.vault.shortcuts.tables.typeBadge.date;
delete zh.vault.shortcuts.tables.typeBadge.checkbox;
delete zh.vault.shortcuts.tables.typeBadge.relation;
delete zh.vault.shortcuts.tables.tableGrid.placeholder;
delete zh.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete zh.vault.shortcuts.tables.tableGrid.renameColumn;
delete zh.vault.shortcuts.tables.tableGrid.deleteColumn;
delete zh.vault.shortcuts.tables.tableGrid.deleteRow;
delete zh.vault.shortcuts.tables.tableGrid.noRows;
delete zh.vault.shortcuts.tables.boardView.needsSelect;
delete zh.vault.shortcuts.tables.boardView.addSelect;
delete zh.vault.shortcuts.tables.boardView.ungrouped;
delete zh.vault.shortcuts.tables.galleryView.noRows;
delete zh.vault.shortcuts.tables.galleryView.addRow;
delete zh.vault.shortcuts.tables.galleryView.checkboxYes;
delete zh.vault.shortcuts.code.heroTitle;
delete zh.vault.shortcuts.code.subtitle;
delete zh.vault.shortcuts.code.emptyState;
delete zh.vault.shortcuts.code.backToCode;
delete zh.vault.shortcuts.code.fileName;
delete zh.vault.shortcuts.code.languagePlaceholder;
delete zh.vault.shortcuts.code.findButton;
delete zh.vault.shortcuts.code.status.saving;
delete zh.vault.shortcuts.code.status.saved;
delete zh.vault.shortcuts.code.status.autosaveOn;
delete zh.vault.shortcuts.queries.heroTitle;
delete zh.vault.shortcuts.queries.description;
delete zh.vault.shortcuts.queries.placeholder;
delete zh.vault.shortcuts.queries.saveButton;
delete zh.vault.shortcuts.queries.resultsLabel;
delete zh.vault.shortcuts.queries.indexing;
delete zh.vault.shortcuts.queries.notesCount;
delete zh.vault.shortcuts.queries.savedQueriesLabel;
delete zh.vault.shortcuts.queries.noSavedQueries;
delete zh.vault.shortcuts.queries.syntaxLabel;
delete zh.vault.shortcuts.extensions.heroTitle;
delete zh.vault.shortcuts.extensions.description;
delete zh.vault.shortcuts.extensions.installedLabel;
delete zh.vault.shortcuts.extensions.activeCount;
delete zh.vault.shortcuts.extensions.cssOverridesLabel;
delete zh.vault.shortcuts.extensions.cssOverridesDesc;
delete zh.vault.shortcuts.extensions.customThemeExample;
delete zh.vault.shortcuts.extensions.applyButton;
delete zh.vault.shortcuts.extensions.resetButton;
delete zh.vault.shortcuts.extensions.appliedStatus;
delete zh.vault.shortcuts.extensions.runtimeLogLabel;
delete zh.vault.shortcuts.extensions.liveStatus;
delete zh.vault.shortcuts.extensions.tabManifestLabel;
delete zh.vault.shortcuts.extensions.tabManifestDesc;
delete zh.vault.shortcuts.trash.heroTitle;
delete zh.vault.shortcuts.trash.description;
delete zh.vault.shortcuts.trash.itemCount;
delete zh.vault.shortcuts.trash.loading;
delete zh.vault.shortcuts.trash.emptyState;
delete zh.vault.shortcuts.trash.emptyDescription;
delete zh.vault.shortcuts.trash.noteSnippet;
delete zh.vault.shortcuts.trash.deletedAgo;
delete zh.vault.shortcuts.trash.expiresToday;
delete zh.vault.shortcuts.trash.daysLeft;
delete zh.vault.shortcuts.trash.restoreButton;
delete zh.vault.shortcuts.trash.toastRestored;
delete zh.vault.shortcuts.trash.deleteForeverDialog.title;
delete zh.vault.shortcuts.trash.deleteForeverDialog.description;
delete zh.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete zh.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete zh.vault.shortcuts.trash.ariaDeleteForever;

// Write back zh.json
fs.writeFileSync('src/lib/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('zh.json done!');

console.log('Done!');