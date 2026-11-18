import fs from 'fs';

// Fix es.json - add missing ribbon.wordGoal and ribbon.macros
const esContent = fs.readFileSync('src/lib/locales/es.json', 'utf8');
const es = JSON.parse(esContent);

es.ribbon.wordGoal = {
  "wordGoal": "Objetivo de palabras",
  "targetWords": "Palabras objetivo",
  "setGoal": "Establecer objetivo",
  "updateGoal": "Actualizar objetivo",
  "editGoal": "Editar objetivo",
  "clearGoal": "Borrar objetivo"
};

es.ribbon.macros = "Macros";
es.ribbon.macrosHint = "Grabar y reproducir macros de edición";

fs.writeFileSync('src/lib/locales/es.json', JSON.stringify(es, null, 2) + '\n', 'utf8');
console.log('es.json done!');

// Fix ar.json - add top-level ink key and remove extra ribbon.ink keys
const arContent = fs.readFileSync('src/lib/locales/ar.json', 'utf8');
const ar = JSON.parse(arContent);

// Add top-level ink key (matching en.json structure)
ar.ink = {
  "groups": {
    "draw": "رسم",
    "color": "لون",
    "history": "التاريخ",
    "view": "عرض",
    "more": "المزيد"
  },
  "more": {
    "label": "المزيد",
    "hint": "أدوات نادرة الاستخدام",
    "modes": "الأوضاع",
    "eraser": "إعدادات الممحاة",
    "brushEngine": "محرك الفرشاة",
    "brushEngineHint": "سلوك القلم، محرك الممحاة، الأشكال والمساطر المساعدة",
    "shapes": "الأشكال",
    "coordinateGraph": "الرسم البياني الإحداثي",
    "paper": "الورق",
    "paperStudio": "استوديو الورق",
    "smartInk": "الحبر الذكي",
    "handwriting": "التعرف على الخط اليدوي",
    "equation": "المعادلة",
    "resultsSearch": "النتائج والبحث",
    "audio": "الصوت",
    "record": "تسجيل",
    "stop": "إيقاف",
    "play": "تشغيل",
    "pause": "إيقاف مؤقت",
    "replayInk": "إعادة تشغيل الحبر",
    "removeAudio": "إزالة الصوت",
    "overlay": "التراكب",
    "fullPage": "صفحة كاملة",
    "inkOverText": "الحبر فوق النص",
    "destructive": "تدميري",
    "removeInk": "إزالة الحبر",
    "attachOld": "إرفاق صفحة قديمة",
    "disabled": "حدد الخطوط أولاً باستخدام اللاسو"
  },
  "draw": {
    "pen": "قلم",
    "penHint": "اختر قلمًا",
    "eraser": "ممحاة",
    "eraserHint": "مسح الخطوط",
    "lasso": "اللاسو",
    "lassoHint": "تحديد الخطوط بتطويقها",
    "width": "العرض",
    "saveFavPen": "حفظ القلم الحالي كمفضل",
    "removeFavPen": "إزالة القلم المفضل",
    "noFavPens": "احفظ إعدادات أقلامك المفضلة هنا (الحد الأقصى 8)"
  },
  "color": {
    "picker": "اللون",
    "pickerHint": "فتح خلاط الألوان، لوحات الألوان والتاريخ"
  },
  "mode": {
    "select": "تحديد",
    "shape": "الأشكال",
    "pan": "التحريك",
    "pick": "الاختيار",
    "insertSpace": "إدراج مسافة"
  },
  "groups": {
    "draw": "رسم",
    "color": "لون",
    "history": "التاريخ",
    "view": "عرض",
    "more": "المزيد",
    "select": "تحديد",
    "object": "كائن",
    "strokes": "السكتات",
    "transform": "تحويل",
    "template": "قالب",
    "pageSize": "حجم الصفحة",
    "pages": "الصفحات",
    "paperStudio": "استوديو الورق",
    "recognise": "التعرف",
    "results": "النتائج",
    "record": "تسجيل",
    "playback": "التشغيل",
    "manage": "إدارة"
  },
  "history": {
    "undo": "تراجع",
    "undoHint": "تراجع عن العلامة الأخيرة",
    "redo": "إعادة",
    "redoHint": "إعادة"
  },
  "view": {
    "zoomOut": "تصغير",
    "zoomIn": "تكبير",
    "fit": "ملاءمة",
    "fitHint": "ملاءمة الصفحة للحبر"
  },
  "select": {
    "select": "تحديد",
    "selectHint": "تحديد، نقل، تغيير الحجم، تدوير الكائنات",
    "lasso": "اللاسو",
    "lassoHint": "تحديد الخطوط بتطويقها"
  },
  "object": {
    "delete": "حذف",
    "deleteHint": "حذف الكائن المحدد",
    "front": "الأمام",
    "frontHint": "إحضار للأمام",
    "back": "الخلف",
    "backHint": "إرسال للخلف"
  },
  "strokes": {
    "apply": "تطبيق",
    "applyHint": "تأكيد الحركة، المقياس أو الدوران",
    "recolor": "إعادة تلوين",
    "recolorHint": "إعادة تلوين التحديد بالحبر الحالي",
    "delete": "حذف",
    "deleteHint": "حذف الخطوط المحددة",
    "deselect": "إلغاء التحديد",
    "deselectHint": "مسح التحديد"
  },
  "transform": {
    "studio": "استوديو التحديد",
    "studioHint": "نقل، تغيير حجم، وتدوير التحديد بدقة",
    "disabled": "حدد الخطوط أولاً باستخدام اللاسو"
  },
  "paper": {
    "template": "قالب الورق",
    "tone": "لون الورق",
    "size": "حجم الصفحة",
    "studio": "استوديو الورق",
    "studioHint": "جميع خيارات الورق في مكان واحد",
    "clear": "مسح الصفحة",
    "clearHint": "إزالة كل العلامات على هذه الصفحة"
  },
  "pages": {
    "prev": "الصفحة السابقة",
    "next": "الصفحة التالية",
    "page": "صفحة {num}"
  },
  "smart": {
    "handwriting": "الكتابة اليدوية",
    "handwritingHint": "تحويل تحديد اللاسو، أو الصفحة المعروضة، إلى نص",
    "equation": "المعادلة",
    "equationHint": "تحويل الرياضيات المكتوبة بخط اليد إلى LaTeX",
    "results": "النتائج والبحث",
    "resultsHint": "النص المعترف به، أدخله في الصفحة، ابحث في كل الكتابة اليدوية"
  },
  "audio": {
    "record": "تسجيل",
    "recordHint": "تسجيل الصوت أثناء الكتابة؛ كل ضربة لها طابع زمني",
    "stop": "إيقاف",
    "play": "تشغيل",
    "playHint": "تشغيل التسجيل وإعادة رسم الصفحة كما كُتبت",
    "pause": "إيقاف مؤقت",
    "replayInk": "إعادة تشغيل الحبر",
    "replayInkHint": "إعادة تشغيل الخطوط بدون صوت",
    "noRecording": "لا يوجد تسجيل",
    "studio": "استوديو الصوت",
    "studioHint": "التنقل خلال التسجيل",
    "remove": "إزالة الصوت",
    "removeHint": "إزالة التسجيل من هذه الصفحة",
    "recording": "جاري التسجيل…"
  },
  "overlay": {
    "fullPage": "صفحة كاملة",
    "inkOverText": "الحبر فوق النص",
    "fullPageHint": "التبديل إلى سطح حبر الصفحة الكاملة",
    "inkOverTextHint": "إظهار الحبر فوق نص الملاحظة في عرض القراءة"
  },
  "tab": {
    "handwriting": "الكتابة اليدوية",
    "startInking": "بدء الحبر",
    "startInkingHint": "إضافة صفحة كتابة يدوية لهذه الملاحظة",
    "attachOldPage": "إرفاق صفحة قديمة",
    "attachOldPageHint": "جلب صفحة كتابة يدوية من قبل انتقال Ink داخل الملاحظات",
    "noAttachable": "لا توجد صفحات حبر غير مرفقة.",
    "ink": "الحبر",
    "overlay": "التراكب",
    "handwritingPage": "صفحة الكتابة اليدوية",
    "marks": "{count} علامات",
    "saving": "جاري الحفظ...",
    "saved": "تم الحفظ",
    "autosave": "الحفظ التلقائي مفعل",
    "attachOld": "إرفاق صفحة سابقة",
    "attachOldHint": "إرفاق صفحة حبر سابقة بهذه الملاحظة",
    "statusSaving": "جاري الحفظ…",
    "statusSaved": "تم الحفظ",
    "statusAutosave": "الحفظ التلقائي مفعل",
    "removeInk": "إزالة الحبر",
    "removeInkHint": "حذف كل الكتابة اليدوية في هذه الملاحظة"
  }
};

// Remove extra ribbon.ink keys that don't match en.json structure
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

fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
console.log('ar.json done!');

// Fix de.json - add top-level ink key and remove extra ribbon.ink keys
const deContent = fs.readFileSync('src/lib/locales/de.json', 'utf8');
const de = JSON.parse(deContent);

de.ink = {
  "groups": {
    "draw": "Zeichnen",
    "color": "Farbe",
    "history": "Verlauf",
    "view": "Ansicht",
    "more": "Mehr"
  },
  "more": {
    "label": "Mehr",
    "hint": "Selten verwendete Werkzeuge",
    "modes": "Modi",
    "eraser": "Radierer-Einstellungen",
    "brushEngine": "Pinsel-Engine",
    "brushEngineHint": "Stiftverhalten, Radierer-Engine, Formen und Lineal-Assistenten",
    "shapes": "Formen",
    "coordinateGraph": "Koordinatengraph",
    "paper": "Papier",
    "paperStudio": "Papier-Studio",
    "smartInk": "Intelligente Tinte",
    "handwriting": "Handschrifterkennung",
    "equation": "Gleichung",
    "resultsSearch": "Ergebnisse & Suche",
    "audio": "Audio",
    "record": "Aufnehmen",
    "stop": "Stopp",
    "play": "Abspielen",
    "pause": "Pause",
    "replayInk": "Tinte wiederholen",
    "removeAudio": "Audio entfernen",
    "overlay": "Overlay",
    "fullPage": "Ganze Seite",
    "inkOverText": "Tinte über Text",
    "destructive": "Zerstörerisch",
    "removeInk": "Tinte entfernen",
    "attachOld": "Alte Seite anhängen",
    "disabled": "Zuerst Striche mit Lasso auswählen"
  },
  "draw": {
    "pen": "Stift",
    "penHint": "Stift wählen",
    "eraser": "Radierer",
    "eraserHint": "Striche löschen",
    "lasso": "Lasso",
    "lassoHint": "Striche durch Einkreisen auswählen",
    "width": "Breite",
    "saveFavPen": "Aktuellen Stift als Favorit speichern",
    "removeFavPen": "Favoriten-Stift entfernen",
    "noFavPens": "speichern Sie Ihre Lieblingsstift-Einstellungen hier (max. 8)"
  },
  "color": {
    "picker": "Farbe",
    "pickerHint": "Farb-Mixer, Paletten und Verlauf öffnen"
  },
  "mode": {
    "select": "Auswählen",
    "shape": "Formen",
    "pan": "Verschieben",
    "pick": "Pipette",
    "insertSpace": "Platz einfügen"
  },
  "groups": {
    "draw": "Zeichnen",
    "color": "Farbe",
    "history": "Verlauf",
    "view": "Ansicht",
    "more": "Mehr",
    "select": "Auswählen",
    "object": "Objekt",
    "strokes": "Striche",
    "transform": "Transformieren",
    "template": "Vorlage",
    "pageSize": "Seitengröße",
    "pages": "Seiten",
    "paperStudio": "Papier-Studio",
    "recognise": "Erkennen",
    "results": "Ergebnisse",
    "record": "Aufnahme",
    "playback": "Wiedergabe",
    "manage": "Verwalten"
  },
  "history": {
    "undo": "Rückgängig",
    "undoHint": "Letzten Strich rückgängig machen",
    "redo": "Wiederholen",
    "redoHint": "Wiederholen"
  },
  "view": {
    "zoomOut": "Herauszoomen",
    "zoomIn": "Hineinzoomen",
    "fit": "Anpassen",
    "fitHint": "Seite an Tinte anpassen"
  },
  "select": {
    "select": "Auswählen",
    "selectHint": "Objekte auswählen, verschieben, skalieren und drehen",
    "lasso": "Lasso",
    "lassoHint": "Striche durch Einkreisen auswählen"
  },
  "object": {
    "delete": "Löschen",
    "deleteHint": "Ausgewähltes Objekt löschen",
    "front": "Vordergrund",
    "frontHint": "In den Vordergrund",
    "back": "Hintergrund",
    "backHint": "In den Hintergrund"
  },
  "strokes": {
    "apply": "Anwenden",
    "applyHint": "Verschiebung, Skalierung oder Rotation bestätigen",
    "recolor": "Umfärben",
    "recolorHint": "Auswahl mit aktueller Tinte neu färben",
    "delete": "Löschen",
    "deleteHint": "Ausgewählte Striche löschen",
    "deselect": "Abwählen",
    "deselectHint": "Auswahl aufheben"
  },
  "transform": {
    "studio": "Auswahl-Studio",
    "studioHint": "Auswahl präzise verschieben, skalieren und drehen",
    "disabled": "Zuerst Striche mit Lasso auswählen"
  },
  "paper": {
    "template": "Papiervorlage",
    "tone": "Papierton",
    "size": "Seitengröße",
    "studio": "Papier-Studio",
    "studioHint": "Alle Papieroptionen an einem Ort",
    "clear": "Seite leeren",
    "clearHint": "Alle Striche auf dieser Seite entfernen"
  },
  "pages": {
    "prev": "Vorherige Seite",
    "next": "Nächste Seite",
    "page": "Seite {num}"
  },
  "smart": {
    "handwriting": "Handschrifterkennung",
    "handwritingHint": "Lasso-Auswahl oder sichtbare Seite in Text umwandeln",
    "equation": "Gleichung",
    "equationHint": "Handgeschriebene Mathematik in LaTeX umwandeln",
    "results": "Ergebnisse & Suche",
    "resultsHint": "Erkannter Text, auf Seite einfügen, gesamte Handschrift durchsuchen"
  },
  "audio": {
    "record": "Aufnehmen",
    "recordHint": "Audio beim Schreiben aufnehmen; jeder Strich wird zeitgestempelt",
    "stop": "Stopp",
    "play": "Abspielen",
    "playHint": "Aufnahme abspielen und Seite neu zeichnen wie sie geschrieben wurde",
    "pause": "Pause",
    "replayInk": "Tinte wiederholen",
    "replayInkHint": "Striche ohne Ton wiederholen",
    "noRecording": "keine Aufnahme",
    "studio": "Audio-Studio",
    "studioHint": "Durch Aufnahme navigieren",
    "remove": "Audio entfernen",
    "removeHint": "Aufnahme von dieser Seite entfernen",
    "recording": "Aufnahme…"
  },
  "overlay": {
    "fullPage": "Ganze Seite",
    "inkOverText": "Tinte über Text",
    "fullPageHint": "Zu Vollbild-Tintenoberfläche wechseln",
    "inkOverTextHint": "Tinte über Notiztext in Lesemodus anzeigen"
  },
  "tab": {
    "handwriting": "Handschrift",
    "startInking": "Inking starten",
    "startInkingHint": "Handschrift-Seite zu dieser Notiz hinzufügen",
    "attachOldPage": "Alte Seite anhängen",
    "attachOldPageHint": "Handschrift-Seite von vor dem Umzug von Ink in Notizen hinzufügen",
    "noAttachable": "Keine unbehafteten Tinten-Seiten.",
    "ink": "Tinte",
    "overlay": "Overlay",
    "handwritingPage": "Handschrift-Seite",
    "marks": "{count} Markierungen",
    "saving": "Speichern…",
    "saved": "Gespeichert",
    "autosave": "Autosave an",
    "attachOld": "Frühere Seite anhängen",
    "attachOldHint": "Früher erstellte Handschrift-Seite an diese Notiz anhängen",
    "statusSaving": "speichern…",
    "statusSaved": "gespeichert",
    "statusAutosave": "autosave an",
    "removeInk": "Tinte entfernen",
    "removeInkHint": "Gesamte Handschrift in dieser Notiz löschen"
  }
};

// Remove extra ribbon.ink keys that don't match en.json structure
delete de.ribbon.ink.color.colorStudio;
delete de.ribbon.ink.color.colorStudioHint;
delete de.ribbon.ink.color.current;
delete de.ribbon.ink.color.hexAriaLabel;
delete de.ribbon.ink.color.hexHelpInvalid;
delete de.ribbon.ink.color.hexHelpValid;
delete de.ribbon.ink.color.hexPlaceholder;
delete de.ribbon.ink.color.opacity;
delete de.ribbon.ink.color.pick;
delete de.ribbon.ink.color.pickHint;
delete de.ribbon.ink.color.quickInks;
delete de.ribbon.ink.color.recent;
delete de.ribbon.ink.color.recentEmpty;
delete de.ribbon.ink.color.studio;
delete de.ribbon.ink.draw.addCoordinateGraph;
delete de.ribbon.ink.draw.brushEngine;
delete de.ribbon.ink.draw.brushEngineHint;
delete de.ribbon.ink.draw.clearPage;
delete de.ribbon.ink.draw.clearPageHint;
delete de.ribbon.ink.draw.coordinateGraph;
delete de.ribbon.ink.draw.coordinateGraphHint;
delete de.ribbon.ink.draw.drawMode;
delete de.ribbon.ink.draw.drawModeHint;
delete de.ribbon.ink.draw.eraseMode;
delete de.ribbon.ink.draw.eraseModeHint;
delete de.ribbon.ink.draw.erasePrecision;
delete de.ribbon.ink.draw.erasePrecisionHint;
delete de.ribbon.ink.draw.eraseStroke;
delete de.ribbon.ink.draw.eraseStrokeHint;
delete de.ribbon.ink.draw.eraserLarge;
delete de.ribbon.ink.draw.eraserMedium;
delete de.ribbon.ink.draw.eraserRadius;
delete de.ribbon.ink.draw.eraserSmall;
delete de.ribbon.ink.draw.eyedropperMode;
delete de.ribbon.ink.draw.eyedropperModeHint;
delete de.ribbon.ink.draw.favPenEmpty;
delete de.ribbon.ink.draw.favouritePens;
delete de.ribbon.ink.draw.fit;
delete de.ribbon.ink.draw.fitHint;
delete de.ribbon.ink.draw.history;
delete de.ribbon.ink.draw.insertSpaceMode;
delete de.ribbon.ink.draw.insertSpaceModeHint;
delete de.ribbon.ink.draw.insertSpaceToast;
delete de.ribbon.ink.draw.lassoMode;
delete de.ribbon.ink.draw.lassoModeHint;
delete de.ribbon.ink.draw.mode;
delete de.ribbon.ink.draw.panMode;
delete de.ribbon.ink.draw.panModeHint;
delete de.ribbon.ink.draw.pens;
delete de.ribbon.ink.draw.redo;
delete de.ribbon.ink.draw.redoHint;
delete de.ribbon.ink.draw.selectMode;
delete de.ribbon.ink.draw.selectModeHint;
delete de.ribbon.ink.draw.shapeMode;
delete de.ribbon.ink.draw.shapeModeHint;
delete de.ribbon.ink.draw.shapes;
delete de.ribbon.ink.draw.stroke;
delete de.ribbon.ink.draw.strokeOpacity;
delete de.ribbon.ink.draw.strokeWidth;
delete de.ribbon.ink.draw.undo;
delete de.ribbon.ink.draw.undoHint;
delete de.ribbon.ink.draw.view;
delete de.ribbon.ink.draw.zoomIn;
delete de.ribbon.ink.draw.zoomOut;
delete de.ribbon.ink.tab.about;
delete de.ribbon.ink.tab.aboutText;
delete de.ribbon.ink.tab.noUnattachedPages;
delete de.ribbon.ink.tab.subtabAudio;
delete de.ribbon.ink.tab.subtabColor;
delete de.ribbon.ink.tab.subtabDraw;
delete de.ribbon.ink.tab.subtabPaper;
delete de.ribbon.ink.tab.subtabSelect;
delete de.ribbon.ink.tab.subtabSmart;

fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/de.json', JSON.stringify(de, null, 2) + '\n', 'utf8');
console.log('ar.json and de.json done!');

// Fix fa.json and hi.json - remove extra vault.shortcuts.canvas keys
const faContent = fs.readFileSync('src/lib/locales/fa.json', 'utf8');
const fa = JSON.parse(faContent);

const keysToDeleteFa = [
  'vault.shortcuts.canvas.addFrame',
  'vault.shortcuts.canvas.fitToPage',
  'vault.shortcuts.canvas.fitToWidth',
  'vault.shortcuts.canvas.zoomOut',
  'vault.shortcuts.canvas.zoomIn',
  'vault.shortcuts.canvas.resetView',
  'vault.shortcuts.canvas.export',
  'vault.shortcuts.canvas.import',
  'vault.shortcuts.canvas.exportTooltip',
  'vault.shortcuts.canvas.importTooltip',
  'vault.shortcuts.canvas.importSuccess',
  'vault.shortcuts.canvas.exportPdf',
  'vault.shortcuts.canvas.exportPng',
  'vault.shortcuts.canvas.exportWholeCanvas',
  'vault.shortcuts.canvas.exportSelectedFrame',
  'vault.shortcuts.canvas.exportPdfTooltip',
  'vault.shortcuts.canvas.exportPngTooltip',
  'vault.shortcuts.canvas.selectFrameFirst',
  'vault.shortcuts.canvas.newDesign',
  'vault.shortcuts.canvas.modeDesign',
  'vault.shortcuts.canvas.kindDesign',
  'vault.shortcuts.canvas.frameTypes.a4',
  'vault.shortcuts.canvas.frameTypes["a4-landscape"]',
  'vault.shortcuts.canvas.frameTypes.letter',
  'vault.shortcuts.canvas.frameTypes["3:4"]',
  'vault.shortcuts.canvas.frameTypes["4:3"]',
  'vault.shortcuts.canvas.frameTypes["16:9"]',
  'vault.shortcuts.canvas.frameTypes.square',
  'vault.shortcuts.canvas.frameTypes.free',
  'vault.shortcuts.canvas.textFrame.locked',
  'vault.shortcuts.canvas.textFrame.unlock',
  'vault.shortcuts.canvas.textFrame.unlockWarning'
];

const keysToDeleteHi = [
  'vault.shortcuts.canvas.addFrame',
  'vault.shortcuts.canvas.fitToPage',
  'vault.shortcuts.canvas.fitToWidth',
  'vault.shortcuts.canvas.zoomOut',
  'vault.shortcuts.canvas.zoomIn',
  'vault.shortcuts.canvas.resetView',
  'vault.shortcuts.canvas.export',
  'vault.shortcuts.canvas.import',
  'vault.shortcuts.canvas.exportTooltip',
  'vault.shortcuts.canvas.importTooltip',
  'vault.shortcuts.canvas.importSuccess',
  'vault.shortcuts.canvas.exportPdf',
  'vault.shortcuts.canvas.exportPng',
  'vault.shortcuts.canvas.exportWholeCanvas',
  'vault.shortcuts.canvas.exportSelectedFrame',
  'vault.shortcuts.canvas.exportPdfTooltip',
  'vault.shortcuts.canvas.exportPngTooltip',
  'vault.shortcuts.canvas.selectFrameFirst',
  'vault.shortcuts.canvas.newDesign',
  'vault.shortcuts.canvas.modeDesign',
  'vault.shortcuts.canvas.kindDesign',
  'vault.shortcuts.canvas.frameTypes.a4',
  'vault.shortcuts.canvas.frameTypes["a4-landscape"]',
  'vault.shortcuts.canvas.frameTypes.letter',
  'vault.shortcuts.canvas.frameTypes["3:4"]',
  'vault.shortcuts.canvas.frameTypes["4:3"]',
  'vault.shortcuts.canvas.frameTypes["16:9"]',
  'vault.shortcuts.canvas.frameTypes.square',
  'vault.shortcuts.canvas.frameTypes.free',
  'vault.shortcuts.canvas.textFrame.locked',
  'vault.shortcuts.canvas.textFrame.unlock',
  'vault.shortcuts.canvas.textFrame.unlockWarning'
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
keysToDeleteHi.forEach(key => safeDelete(fa, key)); // Reuse for hi.json

fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
console.log('fa.json done!');

// Fix hi.json
const hiContent = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const hi = JSON.parse(hiContent);
keysToDeleteHi.forEach(key => safeDelete(hi, key));
fs.writeFileSync('src/lib/locales/hi.json', JSON.stringify(hi, null, 2) + '\n', 'utf8');
console.log('hi.json done!');

// Fix zh.json - remove remaining extra keys
const zhContent = fs.readFileSync('src/lib/locales/zh.json', 'utf8');
const zh = JSON.parse(zhContent);

// Remove remaining extra keys from zh.json
delete zh.ribbon.view.pageDisplay;
delete zh.wordGoal.wordGoal;
delete zh.wordGoal.targetWords;
delete zh.wordGoal.setGoal;
delete zh.wordGoal.updateGoal;
delete zh.wordGoal.editGoal;
delete zh.wordGoal.clearGoal;
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

fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/de.json', JSON.stringify(de, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/hi.json', JSON.stringify(hi, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/lib/locales/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('All done!');