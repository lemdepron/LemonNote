import fs from 'fs';

// Fix ar.json - add missing ribbon.view, ribbon.insert, ribbon.ink, backup, vault.canvas, format.capability, ribbon.macros, ribbon.wordGoal
const arContent = fs.readFileSync('src/lib/locales/ar.json', 'utf8');
const ar = JSON.parse(arContent);

// Add missing ribbon.view keys
ar.ribbon.view = {
  ...ar.ribbon.view,
  "navigation": "التنقل",
  "pageWidth": "عرض الصفحة",
  "onePage": "صفحة واحدة",
  "twoPages": "صفحتين",
  "pageScroll": "تمرير الصفحة",
  "narrow": "ضيق",
  "medium": "متوسط",
  "wide": "واسع",
  "full": "كامل",
  "attachTable": "ربط جدول",
  "importPdf": "استيراد PDF",
  "importPdfHint": "استيراد ملف PDF كملاحظة جديدة",
  "importPdfPrompt": "استيراد هذا PDF كملاحظة جديدة؟",
  "pdfImported": "تم استيراد PDF كملاحظة",
  "pdfImportError": "فشل استيراد PDF",
  "prevPage": "الصفحة السابقة",
  "nextPage": "الصفحة التالية",
  "page": "صفحة {current} من {total}",
  "resetZoom": "إعادة تعيين التكبير",
  "print": "طباعة",
  "download": "تنزيل",
  "loadingPdf": "جاري تحميل PDF…",
  "pdfLoadError": "فشل تحميل PDF",
  "noPdf": "لا يوجد PDF محمل",
  "editorA11y": "المحرر وإمكانية الوصول",
  "annotate": {
    "enter": "تعليق",
    "enterHint": "ارسم على صفحة PDF هذه",
    "exit": "خروج من التعليق",
    "exitHint": "إيقاف الرسم والعودة للعرض",
    "save": "حفظ في PDF",
    "saveHint": "حفظ التعليقات في ملف PDF",
    "saved": "تم حفظ التعليقات في PDF",
    "export": "تصدير PDF",
    "exportHint": "تنزيل نسخة مع أو بدون تعليقات قابلة للتحرير",
    "exportAnnotated": "تصدير مع التعليقات",
    "exportAnnotatedHint": "تنزيل مع التعليقات (قابلة للتحرير عند إعادة الفتح)",
    "exportFlattened": "تصدير مسطح",
    "exportFlattenedHint": "تنزيل مع التعليقات المدمجة (غير قابلة للتحرير)",
    "exported": "تم تصدير PDF",
    "exportedFlattened": "تم تصدير PDF المفلطح"
  }
};

// Add missing ribbon.insert keys
ar.ribbon.insert = {
  ...ar.ribbon.insert,
  "mathBlock": "كتلة رياضية",
  "mathBlockHint": "إدراج كتلة رياضية ($$ … $$)",
  "htmlMath": "الرياضيات (KaTeX)",
  "htmlMathHint": "إدراج ترميز رياضي KaTeX مُعرض مع مرجع CSS محلي (تنسيق HTML فقط)"
};

// Add missing fileMenu keys
ar.fileMenu = {
  ...ar.fileMenu,
  "printExport": {
    ...ar.fileMenu.printExport,
    "htmlEmbedded": "ملف واحد (صور مدمجة)",
    "openAsCanvas": "فتح كلوحة",
    "openAsCanvasHint": "إنشاء لوحة بمحتوى هذه الملاحظة في إطار A4",
    "canvasCreated": "تم إنشاء اللوحة: {name}"
  },
  "migration": {
    "title": "ترحيل تنسيق الملاحظة",
    "message": "يتبسط هذا الإصدار من LemonNote تنسيقات الملاحظات. سيتم تحويل الملاحظات بتنسيقات YAML و XML و JSON و TOML و CSV و INI و CSS و JavaScript و TypeScript و Python و Rust و Bash و SQL إلى Markdown مع كتل كود محاطة، مع الحفاظ على محتواها الدقيق.",
    "backupTitle": "إنشاء نسخة احتياطية قبل الترحيل",
    "backupMessage": "قبل تشغيل الترحيل، سيتم إنشاء نسخة احتياطية كاملة من قبوتك. يوصى بشدة بذلك حتى تتمكن من الاستعادة إذا حدث خطأ ما.",
    "backupButton": "إنشاء نسخة احتياطية والترحيل",
    "skipButton": "تخطي النسخ الاحتياطي (غير مستحسن)",
    "backupSuccess": "تم إنشاء النسخة الاحتياطية بنجاح. بدء الترحيل…",
    "backupFailed": "فشل النسخ الاحتياطي: {error}. تم إلغاء الترحيل لحماية بياناتك.",
    "migrationComplete": "اكتمل الترحيل. تم تحويل {count} ملاحظة.",
    "migrationFailed": "فشل الترحيل: {error}"
  }
};

// Add missing backup keys
ar.backup = {
  ...ar.backup,
  "exportSuccess": "تم تصدير النسخة الاحتياطية بنجاح.",
  "largeWarning": "ملف نسخة احتياطية كبير — فكر في التقسيم أو استخدام تخزين خارجي.",
  "exportFailed": "فشل تصدير النسخة الاحتياطية.",
  "readFailed": "فشل قراءة ملف النسخة الاحتياطية.",
  "importFailed": "فشل استيراد النسخة الاحتياطية.",
  "previewFailed": "فشل معاينة الاستيراد.",
  "selectFilesAgain": "يرجى تحديد الملفات مرة أخرى.",
  "selectFolderAgain": "يرجى تحديد المجلد مرة أخرى.",
  "inFile": "في الملف",
  "willImport": "سيتم استيراد",
  "replaceWarning": "سيؤدي هذا إلى استبدال جميع البيانات الموجودة في الخزنة.",
  "attachmentsWarning": "تحتوي النسخة الاحتياطية على مرفقات ({size}). قد يستغرق الاستيراد بعض الوقت.",
  "confirmFolderImport": "تأكيد استيراد المجلد",
  "confirmFileImport": "تأكيد استيراد الملف",
  "filesFound": "الملفات الموجودة",
  "notesToImport": "الملاحظات المراد استيرادها",
  "duplicatesFound": "تم العثور على تكرارات",
  "duplicateAction": "الإجراء مع التكرارات",
  "andMore": "+{count} المزيد",
  "preserveFolders": "الحفاظ على هيكل المجلدات",
  "wholeVault": "الخزنة الكاملة",
  "exportBackup": "تصدير نسخة احتياطية",
  "importBackup": "استيراد نسخة احتياطية",
  "importFiles": "استيراد ملفات Markdown",
  "importMarkdown": "استيراد ملفات Markdown / نصية",
  "importMarkdownDesc": "اختر ملفات .md أو .markdown أو .txt للاستيراد كملاحظات.",
  "importFilesBtn": "اختيار الملفات",
  "importFolderBtn": "اختيار المجلد",
  "onImport": "عند الاستيراد",
  "keepExisting": "احتفظ بالموجود",
  "replaceEverything": "استبدال كل شيء",
  "confirmImport": "تأكيد الاستيراد"
};

// Add missing vault.canvas keys
ar.vault = {
  ...ar.vault,
  "canvas": {
    ...ar.vault.canvas,
    "addFrame": "إضافة إطار",
    "fitToPage": "ملاءمة للصفحة",
    "fitToWidth": "ملاءمة للعرض",
    "zoomOut": "تصغير",
    "zoomIn": "تكبير",
    "resetView": "إعادة تعيين العرض",
    "export": "تصدير",
    "import": "استيراد",
    "exportTooltip": "تصدير كـ .lemoncanvas",
    "importTooltip": "استيراد ملف .lemoncanvas",
    "importSuccess": "تم استيراد اللوحة بنجاح",
    "exportPdf": "تصدير كـ PDF",
    "exportPng": "تصدير كـ PNG",
    "exportWholeCanvas": "اللوحة الكاملة",
    "exportSelectedFrame": "الإطار المحدد",
    "exportPdfTooltip": "تصدير اللوحة كـ PDF",
    "exportPngTooltip": "تصدير اللوحة كـ PNG",
    "selectFrameFirst": "حدد إطارًا أولاً للتصدير بشكل منفصل",
    "newDesign": "تصميم جديد",
    "modeDesign": "تصميم",
    "kindDesign": "تصميم",
    "frameTypes": {
      "a4": "A4 عمودي",
      "a4-landscape": "A4 أفقي",
      "letter": "Letter",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "مربع",
      "free": "حر"
    },
    "textFrame": {
      "locked": "النص مقفل لأن الحبر مرسوم فوقه",
      "unlock": "إلغاء القفل",
      "unlockWarning": "إلغاء القفل سيسمح بالتحرير، لكن ضربات الحبر قد لا تتطابق مع محتوى النص."
    }
  }
};

// Add format capability
ar.format = {
  "capability": {
    "markdown": {
      "ink": "غير متاح في Markdown",
      "shapes": "غير متاح في Markdown"
    },
    "plain": {
      "richFormat": "غير متاح في نص عادي",
      "codeBlocks": "غير متاح في نص عادي",
      "math": "غير متاح في نص عادي",
      "images": "غير متاح في نص عادي",
      "tables": "غير متاح في نص عادي",
      "ink": "غير متاح في نص عادي",
      "shapes": "غير متاح في نص عادي",
      "insert": "غير متاح في نص عادي",
      "design": "غير متاح في نص عادي",
      "layout": "غير متاح في نص عادي",
      "exportPdf": "غير متاح في نص عادي"
    },
    "html": {
      "ink": "غير متاح في HTML",
      "shapes": "غير متاح في HTML",
      "design": "تصميم HTML يعيش في المصدر",
      "layout": "تصميم HTML يعيش في المصدر"
    },
    "pdf": {
      "editText": "غير متاح في PDF",
      "richFormat": "غير متاح في PDF",
      "codeBlocks": "غير متاح في PDF",
      "math": "غير متاح في PDF",
      "images": "غير متاح في PDF",
      "tables": "غير متاح في PDF",
      "links": "غير متاح في PDF",
      "insert": "غير متاح في PDF",
      "design": "غير متاح في PDF",
      "layout": "غير متاح في PDF"
    },
    "canvas": {}
  }
};

// Add missing ribbon.macros and ribbon.wordGoal
ar.ribbon.macros = "ماكروز";
ar.ribbon.macrosHint = "تسجيل وإعادة تشغيل ماكروات التحرير";

ar.ribbon.wordGoal = {
  "wordGoal": "هدف الكلمات",
  "targetWords": "الكلمات المستهدفة",
  "setGoal": "تحديد الهدف",
  "updateGoal": "تحديث الهدف",
  "editGoal": "تعديل الهدف",
  "clearGoal": "مسح الهدف"
};

// Remove extra keys from ar.json
delete ar.ribbon.view.pageDisplay;
delete ar.ribbon.ink.draw.mode;
delete ar.ribbon.ink.draw.pens;
delete ar.ribbon.ink.draw.favouritePens;
delete ar.ribbon.ink.draw.stroke;
delete ar.ribbon.ink.draw.history;
delete ar.ribbon.ink.draw.view;
delete ar.ribbon.ink.draw.shapes;
delete ar.ribbon.ink.draw.drawMode;
delete ar.ribbon.ink.draw.drawModeHint;
delete ar.ribbon.ink.draw.shapeMode;
delete ar.ribbon.ink.draw.shapeModeHint;
delete ar.ribbon.ink.draw.selectMode;
delete ar.ribbon.ink.draw.selectModeHint;
delete ar.ribbon.ink.draw.lassoMode;
delete ar.ribbon.ink.draw.lassoModeHint;
delete ar.ribbon.ink.draw.eraseMode;
delete ar.ribbon.ink.draw.eraseModeHint;
delete ar.ribbon.ink.draw.panMode;
delete ar.ribbon.ink.draw.panModeHint;
delete ar.ribbon.ink.draw.eyedropperMode;
delete ar.ribbon.ink.draw.eyedropperModeHint;
delete ar.ribbon.ink.draw.insertSpaceMode;
delete ar.ribbon.ink.draw.insertSpaceModeHint;
delete ar.ribbon.ink.draw.brushEngine;
delete ar.ribbon.ink.draw.brushEngineHint;
delete ar.ribbon.ink.draw.eraseStroke;
delete ar.ribbon.ink.draw.eraseStrokeHint;
delete ar.ribbon.ink.draw.erasePrecision;
delete ar.ribbon.ink.draw.erasePrecisionHint;
delete ar.ribbon.ink.draw.eraserSmall;
delete ar.ribbon.ink.draw.eraserMedium;
delete ar.ribbon.ink.draw.eraserLarge;
delete ar.ribbon.ink.draw.eraserRadius;
delete ar.ribbon.ink.draw.undo;
delete ar.ribbon.ink.draw.undoHint;
delete ar.ribbon.ink.draw.redo;
delete ar.ribbon.ink.draw.redoHint;
delete ar.ribbon.ink.draw.zoomOut;
delete ar.ribbon.ink.draw.zoomIn;
delete ar.ribbon.ink.draw.fit;
delete ar.ribbon.ink.draw.fitHint;
delete ar.ribbon.ink.draw.clearPage;
delete ar.ribbon.ink.draw.clearPageHint;
delete ar.ribbon.ink.draw.coordinateGraph;
delete ar.ribbon.ink.draw.coordinateGraphHint;
delete ar.ribbon.ink.draw.addCoordinateGraph;
delete ar.ribbon.ink.draw.insertSpaceToast;
delete ar.ribbon.ink.draw.favPenEmpty;
delete ar.ribbon.ink.draw.strokeWidth;
delete ar.ribbon.ink.draw.strokeOpacity;
delete ar.ribbon.ink.color.current;
delete ar.ribbon.ink.color.hexPlaceholder;
delete ar.ribbon.ink.color.hexAriaLabel;
delete ar.ribbon.ink.color.hexHelpValid;
delete ar.ribbon.ink.color.hexHelpInvalid;
delete ar.ribbon.ink.color.quickInks;
delete ar.ribbon.ink.color.recent;
delete ar.ribbon.ink.color.recentEmpty;
delete ar.ribbon.ink.color.studio;
delete ar.ribbon.ink.color.colorStudio;
delete ar.ribbon.ink.color.colorStudioHint;
delete ar.ribbon.ink.color.pick;
delete ar.ribbon.ink.color.pickHint;
delete ar.ribbon.ink.color.opacity;
delete ar.ribbon.ink.tab.noUnattachedPages;
delete ar.ribbon.ink.tab.about;
delete ar.ribbon.ink.tab.aboutText;
delete ar.ribbon.ink.tab.subtabDraw;
delete ar.ribbon.ink.tab.subtabColor;
delete ar.ribbon.ink.tab.subtabSelect;
delete ar.ribbon.ink.tab.subtabPaper;
delete ar.ribbon.ink.tab.subtabSmart;
delete ar.ribbon.ink.tab.subtabAudio;

// Write back ar.json
fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
console.log('ar.json done!');

// Now fix de.json similarly
const deContent = fs.readFileSync('src/lib/locales/de.json', 'utf8');
const de = JSON.parse(deContent);

// Add missing ribbon.view keys
de.ribbon.view = {
  ...de.ribbon.view,
  "navigation": "Navigation",
  "pageWidth": "Seitenbreite",
  "onePage": "Eine Seite",
  "twoPages": "Zwei Seiten",
  "pageScroll": "Seite & Scrollen",
  "narrow": "Schmal",
  "medium": "Mittel",
  "wide": "Breit",
  "full": "Voll",
  "attachTable": "Tabelle anhängen",
  "importPdf": "PDF importieren",
  "importPdfHint": "PDF-Datei als neue Notiz importieren",
  "importPdfPrompt": "Diesen PDF als neue Notiz importieren?",
  "pdfImported": "PDF als Notiz importiert",
  "pdfImportError": "PDF-Import fehlgeschlagen",
  "prevPage": "Vorherige Seite",
  "nextPage": "Nächste Seite",
  "page": "Seite {current} von {total}",
  "resetZoom": "Zoom zurücksetzen",
  "print": "Drucken",
  "download": "Herunterladen",
  "loadingPdf": "PDF laden…",
  "pdfLoadError": "PDF-Ladefehler",
  "noPdf": "Kein PDF geladen",
  "editorA11y": "Editor & Barrierefreiheit",
  "annotate": {
    "enter": "Annotieren",
    "enterHint": "Auf dieser PDF-Seite zeichnen",
    "exit": "Annotieren beenden",
    "exitHint": "Zeichnen stoppen und zur Ansicht zurückkehren",
    "save": "In PDF speichern",
    "saveHint": "Anmerkungen in PDF-Datei speichern",
    "saved": "Anmerkungen im PDF gespeichert",
    "export": "PDF exportieren",
    "exportHint": "Kopie mit oder ohne bearbeitbare Anmerkungen herunterladen",
    "exportAnnotated": "Annotiert exportieren",
    "exportAnnotatedHint": "Mit Anmerkungen herunterladen (beim erneuten Öffnen bearbeitbar)",
    "exportFlattened": "Aplattiert exportieren",
    "exportFlattenedHint": "Mit eingebrannten Anmerkungen herunterladen (nicht bearbeitbar)",
    "exported": "PDF exportiert",
    "exportedFlattened": "Aplattierter PDF exportiert"
  }
};

// Add missing ribbon.insert keys
de.ribbon.insert = {
  ...de.ribbon.insert,
  "mathBlock": "Mathe-Block",
  "mathBlockHint": "Einen Mathe-Block einfügen ($$ … $$)",
  "htmlMath": "Mathe (KaTeX)",
  "htmlMathHint": "Gerendertes KaTeX-Mathematik-Markup mit lokalem CSS-Verweis einfügen (nur HTML-Format)"
};

// Add missing fileMenu keys
de.fileMenu = {
  ...de.fileMenu,
  "printExport": {
    ...de.fileMenu.printExport,
    "htmlEmbedded": "Einzelne Datei (Bilder eingebettet)",
    "openAsCanvas": "Als Canvas öffnen",
    "openAsCanvasHint": "Canvas mit diesem Notizinhalt in A4-Rahmen erstellen",
    "canvasCreated": "Canvas erstellt: {name}"
  },
  "migration": {
    "title": "Notizformat-Migration",
    "message": "Diese Version von LemonNote vereinfacht Notizformate. Notizen in YAML, XML, JSON, TOML, CSV, INI, CSS, JavaScript, TypeScript, Python, Rust, Bash und SQL werden zu Markdown mit umzäunten Code-Blöcken konvertiert, wobei ihr genauer Inhalt beibehalten wird.",
    "backupTitle": "Backup vor Migration erstellen",
    "backupMessage": "Bevor die Migration läuft, wird ein vollständiges Backup Ihres Tresors erstellt. Dies wird dringend empfohlen, damit Sie im Fehlerfall wiederherstellen können.",
    "backupButton": "Backup erstellen und migrieren",
    "skipButton": "Backup überspringen (nicht empfohlen)",
    "backupSuccess": "Backup erfolgreich erstellt. Migration startet…",
    "backupFailed": "Backup fehlgeschlagen: {error}. Migration abgebrochen zum Schutz Ihrer Daten.",
    "migrationComplete": "Migration abgeschlossen. {count} Notiz(en) konvertiert.",
    "migrationFailed": "Migration fehlgeschlagen: {error}"
  }
};

// Add missing backup keys
de.backup = {
  ...de.backup,
  "exportSuccess": "Backup erfolgreich exportiert.",
  "largeWarning": "Große Backup-Datei — Aufteilung oder externen Speicher in Betracht ziehen.",
  "exportFailed": "Backup-Export fehlgeschlagen.",
  "readFailed": "Backup-Datei konnte nicht gelesen werden.",
  "importFailed": "Backup-Import fehlgeschlagen.",
  "previewFailed": "Import-Vorschau fehlgeschlagen.",
  "selectFilesAgain": "Bitte Dateien erneut auswählen.",
  "selectFolderAgain": "Bitte Ordner erneut auswählen.",
  "inFile": "In Datei",
  "willImport": "Wird importiert",
  "replaceWarning": "Dies ersetzt alle bestehenden Daten im Tresor.",
  "attachmentsWarning": "Backup enthält Anhänge ({size}). Import kann dauern.",
  "confirmFolderImport": "Ordner-Import bestätigen",
  "confirmFileImport": "Datei-Import bestätigen",
  "filesFound": "Gefundene Dateien",
  "notesToImport": "Zu importierende Notizen",
  "duplicatesFound": "Duplikate gefunden",
  "duplicateAction": "Bei Duplikaten",
  "andMore": "+{count} mehr",
  "preserveFolders": "Ordnerstruktur beibehalten",
  "wholeVault": "Gesamter Tresor",
  "exportBackup": "Backup exportieren",
  "importBackup": "Backup importieren",
  "importFiles": "Markdown-Dateien importieren",
  "importMarkdown": "Markdown / Textdateien importieren",
  "importMarkdownDesc": "Wählen Sie .md, .markdown oder .txt Dateien zum Import als Notizen.",
  "importFilesBtn": "Dateien auswählen",
  "importFolderBtn": "Ordner auswählen",
  "onImport": "Beim Import",
  "keepExisting": "Bestehendes behalten",
  "replaceEverything": "Alles ersetzen",
  "confirmImport": "Import bestätigen"
};

// Add missing vault.canvas keys
de.vault = {
  ...de.vault,
  "canvas": {
    ...de.vault.canvas,
    "addFrame": "Rahmen hinzufügen",
    "fitToPage": "An Seite anpassen",
    "fitToWidth": "An Breite anpassen",
    "zoomOut": "Herauszoomen",
    "zoomIn": "Hineinzoomen",
    "resetView": "Ansicht zurücksetzen",
    "export": "Exportieren",
    "import": "Importieren",
    "exportTooltip": "Als .lemoncanvas exportieren",
    "importTooltip": ".lemoncanvas Datei importieren",
    "importSuccess": "Canvas erfolgreich importiert",
    "exportPdf": "Als PDF exportieren",
    "exportPng": "Als PNG exportieren",
    "exportWholeCanvas": "Gesamtes Canvas",
    "exportSelectedFrame": "Ausgewählter Rahmen",
    "exportPdfTooltip": "Canvas als PDF exportieren",
    "exportPngTooltip": "Canvas als PNG exportieren",
    "selectFrameFirst": "Rahmen zuerst auswählen für individuellen Export",
    "newDesign": "Neues Design",
    "modeDesign": "Design",
    "kindDesign": "Design",
    "frameTypes": {
      "a4": "A4 Hochformat",
      "a4-landscape": "A4 Querformat",
      "letter": "Letter",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "Quadrat",
      "free": "Frei"
    },
    "textFrame": {
      "locked": "Text ist gesperrt, weil Tinte darüber gezeichnet wurde",
      "unlock": "Entsperren",
      "unlockWarning": "Entsperren erlaubt Bearbeitung, aber Tintenstriche stimmen möglicherweise nicht mehr mit dem Textinhalt überein."
    }
  }
};

// Add format capability
de.format = {
  "capability": {
    "markdown": {
      "ink": "In Markdown nicht verfügbar",
      "shapes": "In Markdown nicht verfügbar"
    },
    "plain": {
      "richFormat": "In reinem Text nicht verfügbar",
      "codeBlocks": "In reinem Text nicht verfügbar",
      "math": "In reinem Text nicht verfügbar",
      "images": "In reinem Text nicht verfügbar",
      "tables": "In reinem Text nicht verfügbar",
      "ink": "In reinem Text nicht verfügbar",
      "shapes": "In reinem Text nicht verfügbar",
      "insert": "In reinem Text nicht verfügbar",
      "design": "In reinem Text nicht verfügbar",
      "layout": "In reinem Text nicht verfügbar",
      "exportPdf": "In reinem Text nicht verfügbar"
    },
    "html": {
      "ink": "In HTML nicht verfügbar",
      "shapes": "In HTML nicht verfügbar",
      "design": "HTML-Styling lebt in der Quelle",
      "layout": "HTML-Styling lebt in der Quelle"
    },
    "pdf": {
      "editText": "In PDF nicht verfügbar",
      "richFormat": "In PDF nicht verfügbar",
      "codeBlocks": "In PDF nicht verfügbar",
      "math": "In PDF nicht verfügbar",
      "images": "In PDF nicht verfügbar",
      "tables": "In PDF nicht verfügbar",
      "links": "In PDF nicht verfügbar",
      "insert": "In PDF nicht verfügbar",
      "design": "In PDF nicht verfügbar",
      "layout": "In PDF nicht verfügbar"
    },
    "canvas": {}
  }
};

// Add missing ribbon.macros and ribbon.wordGoal
de.ribbon.macros = "Makros";
de.ribbon.macrosHint = "Makros aufzeichnen und wiedergeben";

de.ribbon.wordGoal = {
  "wordGoal": "Wortziel",
  "targetWords": "Zielwörter",
  "setGoal": "Ziel setzen",
  "updateGoal": "Ziel aktualisieren",
  "editGoal": "Ziel bearbeiten",
  "clearGoal": "Ziel löschen"
};

// Remove extra keys from de.json
delete de.ribbon.view.pageDisplay;
delete de.wordGoal.wordGoal;
delete de.wordGoal.targetWords;
delete de.wordGoal.setGoal;
delete de.wordGoal.updateGoal;
delete de.wordGoal.editGoal;
delete de.wordGoal.clearGoal;
delete de.macros;
delete de.macrosHint;
delete de.lang.fa;
delete de.lang.ur;
delete de.vault.shortcuts.cards.heroTitle;
delete de.vault.shortcuts.cards.newCard;
delete de.vault.shortcuts.cards.stats;
delete de.vault.shortcuts.cards.nothingDue;
delete de.vault.shortcuts.cards.noCards;
delete de.vault.shortcuts.cards.nextCard;
delete de.vault.shortcuts.cards.emptyHint;
delete de.vault.shortcuts.cards.allCards;
delete de.vault.shortcuts.cards.reps;
delete de.vault.shortcuts.cards.deleteCard;
delete de.vault.shortcuts.graph.heroTitle;
delete de.vault.shortcuts.graph.subtitle;
delete de.vault.shortcuts.graph.emptyState;
delete de.vault.shortcuts.graph.backToVault;
delete de.vault.shortcuts.canvas.heroTitle;
delete de.vault.shortcuts.canvas.subtitle;
delete de.vault.shortcuts.canvas.emptyState;
delete de.vault.shortcuts.canvas.backToCanvases;
delete de.vault.shortcuts.canvas.cardInspector;
delete de.vault.shortcuts.canvas.canvasGuide;
delete de.vault.shortcuts.canvas.guideText1;
delete de.vault.shortcuts.canvas.guideText2;
delete de.vault.shortcuts.canvas.stats;
delete de.vault.shortcuts.canvas.newCardTitle;
delete de.vault.shortcuts.canvas.addCard;
delete de.vault.shortcuts.canvas.saving;
delete de.vault.shortcuts.canvas.saved;
delete de.vault.shortcuts.canvas.autosaveOn;
delete de.vault.shortcuts.canvas.canvasName;
delete de.vault.shortcuts.canvas.status.saving;
delete de.vault.shortcuts.canvas.status.saved;
delete de.vault.shortcuts.canvas.status.autosaveOn;
delete de.vault.shortcuts.canvas.addFrame;
delete de.vault.shortcuts.canvas.fitToPage;
delete de.vault.shortcuts.canvas.fitToWidth;
delete de.vault.shortcuts.canvas.zoomOut;
delete de.vault.shortcuts.canvas.zoomIn;
delete de.vault.shortcuts.canvas.resetView;
delete de.vault.shortcuts.canvas.export;
delete de.vault.shortcuts.canvas.import;
delete de.vault.shortcuts.canvas.exportTooltip;
delete de.vault.shortcuts.canvas.importTooltip;
delete de.vault.shortcuts.canvas.importSuccess;
delete de.vault.shortcuts.canvas.exportPdf;
delete de.vault.shortcuts.canvas.exportPng;
delete de.vault.shortcuts.canvas.exportWholeCanvas;
delete de.vault.shortcuts.canvas.exportSelectedFrame;
delete de.vault.shortcuts.canvas.exportPdfTooltip;
delete de.vault.shortcuts.canvas.exportPngTooltip;
delete de.vault.shortcuts.canvas.selectFrameFirst;
delete de.vault.shortcuts.canvas.newDesign;
delete de.vault.shortcuts.canvas.modeDesign;
delete de.vault.shortcuts.canvas.kindDesign;
delete de.vault.shortcuts.canvas.frameTypes.a4;
delete de.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete de.vault.shortcuts.canvas.frameTypes.letter;
delete de.vault.shortcuts.canvas.frameTypes["3:4"];
delete de.vault.shortcuts.canvas.frameTypes["4:3"];
delete de.vault.shortcuts.canvas.frameTypes["16:9"];
delete de.vault.shortcuts.canvas.frameTypes.square;
delete de.vault.shortcuts.canvas.frameTypes.free;
delete de.vault.shortcuts.canvas.textFrame.locked;
delete de.vault.shortcuts.canvas.textFrame.unlock;
delete de.vault.shortcuts.canvas.textFrame.unlockWarning;
delete de.vault.shortcuts.tables.heroTitle;
delete de.vault.shortcuts.tables.subtitle;
delete de.vault.shortcuts.tables.emptyState;
delete de.vault.shortcuts.tables.backToTables;
delete de.vault.shortcuts.tables.viewTable;
delete de.vault.shortcuts.tables.viewBoard;
delete de.vault.shortcuts.tables.viewGallery;
delete de.vault.shortcuts.tables.addColumn;
delete de.vault.shortcuts.tables.addRow;
delete de.vault.shortcuts.tables.priorityPlaceholder;
delete de.vault.shortcuts.tables.typePlaceholder;
delete de.vault.shortcuts.tables.optionsPlaceholder;
delete de.vault.shortcuts.tables.tablePickerPlaceholder;
delete de.vault.shortcuts.tables.addButton;
delete de.vault.shortcuts.tables.status.saving;
delete de.vault.shortcuts.tables.status.saved;
delete de.vault.shortcuts.tables.status.autosaveOn;
delete de.vault.shortcuts.tables.stats;
delete de.vault.shortcuts.tables.tableName;
delete de.vault.shortcuts.tables.columnTypes.text;
delete de.vault.shortcuts.tables.columnTypes.number;
delete de.vault.shortcuts.tables.columnTypes.select;
delete de.vault.shortcuts.tables.columnTypes.date;
delete de.vault.shortcuts.tables.columnTypes.checkbox;
delete de.vault.shortcuts.tables.columnTypes.relation;
delete de.vault.shortcuts.tables.typeBadge.text;
delete de.vault.shortcuts.tables.typeBadge.number;
delete de.vault.shortcuts.tables.typeBadge.select;
delete de.vault.shortcuts.tables.typeBadge.date;
delete de.vault.shortcuts.tables.typeBadge.checkbox;
delete de.vault.shortcuts.tables.typeBadge.relation;
delete de.vault.shortcuts.tables.tableGrid.placeholder;
delete de.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete de.vault.shortcuts.tables.tableGrid.renameColumn;
delete de.vault.shortcuts.tables.tableGrid.deleteColumn;
delete de.vault.shortcuts.tables.tableGrid.deleteRow;
delete de.vault.shortcuts.tables.tableGrid.noRows;
delete de.vault.shortcuts.tables.boardView.needsSelect;
delete de.vault.shortcuts.tables.boardView.addSelect;
delete de.vault.shortcuts.tables.boardView.ungrouped;
delete de.vault.shortcuts.tables.galleryView.noRows;
delete de.vault.shortcuts.tables.galleryView.addRow;
delete de.vault.shortcuts.tables.galleryView.checkboxYes;
delete de.vault.shortcuts.code.heroTitle;
delete de.vault.shortcuts.code.subtitle;
delete de.vault.shortcuts.code.emptyState;
delete de.vault.shortcuts.code.backToCode;
delete de.vault.shortcuts.code.fileName;
delete de.vault.shortcuts.code.languagePlaceholder;
delete de.vault.shortcuts.code.findButton;
delete de.vault.shortcuts.code.status.saving;
delete de.vault.shortcuts.code.status.saved;
delete de.vault.shortcuts.code.status.autosaveOn;
delete de.vault.shortcuts.queries.heroTitle;
delete de.vault.shortcuts.queries.description;
delete de.vault.shortcuts.queries.placeholder;
delete de.vault.shortcuts.queries.saveButton;
delete de.vault.shortcuts.queries.resultsLabel;
delete de.vault.shortcuts.queries.indexing;
delete de.vault.shortcuts.queries.notesCount;
delete de.vault.shortcuts.queries.savedQueriesLabel;
delete de.vault.shortcuts.queries.noSavedQueries;
delete de.vault.shortcuts.queries.syntaxLabel;
delete de.vault.shortcuts.extensions.heroTitle;
delete de.vault.shortcuts.extensions.description;
delete de.vault.shortcuts.extensions.installedLabel;
delete de.vault.shortcuts.extensions.activeCount;
delete de.vault.shortcuts.extensions.cssOverridesLabel;
delete de.vault.shortcuts.extensions.cssOverridesDesc;
delete de.vault.shortcuts.extensions.customThemeExample;
delete de.vault.shortcuts.extensions.applyButton;
delete de.vault.shortcuts.extensions.resetButton;
delete de.vault.shortcuts.extensions.appliedStatus;
delete de.vault.shortcuts.extensions.runtimeLogLabel;
delete de.vault.shortcuts.extensions.liveStatus;
delete de.vault.shortcuts.extensions.tabManifestLabel;
delete de.vault.shortcuts.extensions.tabManifestDesc;
delete de.vault.shortcuts.trash.heroTitle;
delete de.vault.shortcuts.trash.description;
delete de.vault.shortcuts.trash.itemCount;
delete de.vault.shortcuts.trash.loading;
delete de.vault.shortcuts.trash.emptyState;
delete de.vault.shortcuts.trash.emptyDescription;
delete de.vault.shortcuts.trash.noteSnippet;
delete de.vault.shortcuts.trash.deletedAgo;
delete de.vault.shortcuts.trash.expiresToday;
delete de.vault.shortcuts.trash.daysLeft;
delete de.vault.shortcuts.trash.restoreButton;
delete de.vault.shortcuts.trash.toastRestored;
delete de.vault.shortcuts.trash.deleteForeverDialog.title;
delete de.vault.shortcuts.trash.deleteForeverDialog.description;
delete de.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete de.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete de.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/de.json', JSON.stringify(de, null, 2) + '\n', 'utf8');
console.log('ar.json and de.json done!');

// Fix fa.json and hi.json - remove extra frameTypes keys
const faContent = fs.readFileSync('src/lib/locales/fa.json', 'utf8');
const fa = JSON.parse(faContent);

const keysToDeleteFa = [
  'vault.shortcuts.canvas.frameTypes.a4-landscape',
  'vault.shortcuts.canvas.frameTypes["3:4"]',
  'vault.shortcuts.canvas.frameTypes["4:3"]',
  'vault.shortcuts.canvas.frameTypes["16:9"]'
];

const keysToDeleteHi = [
  'vault.shortcuts.canvas.frameTypes.a4-landscape',
  'vault.shortcuts.canvas.frameTypes["3:4"]',
  'vault.shortcuts.canvas.frameTypes["4:3"]',
  'vault.shortcuts.canvas.frameTypes["16:9"]'
];

function safeDelete(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current || !current[parts[i]]) return;
    current = current[parts[i]];
  }
  if (current) delete current[parts[parts.length - 1]];
}

keysToDeleteFa.forEach(key => safeDelete(fa, key));
fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
console.log('fa.json done!');

// Fix hi.json
const hiContent = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const hi = JSON.parse(hiContent);
keysToDeleteHi.forEach(key => safeDelete(hi, key));
fs.writeFileSync('src/lib/locales/hi.json', JSON.stringify(hi, null, 2) + '\n', 'utf8');
console.log('hi.json done!');

// Fix ru.json - remove extra vault.shortcuts.code.newFile
const ruContent = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const ru = JSON.parse(ruContent);
delete ru.vault.shortcuts.code.newFile;
fs.writeFileSync('src/lib/locales/ru.json', JSON.stringify(ru, null, 2) + '\n', 'utf8');
console.log('ru.json done!');

console.log('All done!');