import fs from 'fs';

// Fix ar.json - fix tab keys (match en.json structure)
const arContent = fs.readFileSync('src/lib/locales/ar.json', 'utf8');
const ar = JSON.parse(arContent);

// Fix ar.json ribbon.ink.tab to match en.json
ar.ribbon.ink.tab = {
  "ink": "الحبر",
  "handwriting": "الكتابة اليدوية",
  "startInking": "بدء الحبر",
  "startInkingHint": "إضافة صفحة كتابة يدوية لهذه الملاحظة",
  "attachOldPage": "إرفاق صفحة قديمة",
  "attachOldPageHint": "إحضار صفحة كتابة يدوية من قبل انتقال Ink داخل الملاحظات",
  "noUnattachedPages": "لا توجد صفحات حبر غير مرفقة.",
  "about": "حول",
  "aboutText": "كل ملاحظة يمكن أن تحمل صفحتها الخاصة للكتابة اليدوية. الأقلام، الألوان، التحديد، الورق، الحبر الذكي والصوت تظهر هنا بمجرد البدء.",
  "subtabDraw": "رسم",
  "subtabFrames": "إطارات",
  "subtabObjects": "أجسام",
  "subtabView": "عرض",
  "subtabColor": "لون",
  "subtabSelect": "تحديد",
  "subtabPaper": "ورق",
  "subtabSmart": "حبر ذكي",
  "subtabAudio": "صوت",
  "overlay": "التراكب",
  "fullPage": "صفحة كاملة",
  "inkOverText": "الحبر فوق النص",
  "fullPageHint": "التبديل إلى سطح حبر الصفحة الكاملة",
  "inkOverTextHint": "إظهار الحبر فوق نص الملاحظة في عرض القراءة",
  "marks": "{count} علامات",
  "statusSaving": "جاري الحفظ…",
  "statusSaved": "تم الحفظ",
  "statusAutosave": "الحفظ التلقائي مفعل",
  "removeInk": "إزالة الحبر",
  "removeInkHint": "حذف كل الكتابة اليدوية في هذه الملاحظة"
};

fs.writeFileSync('src/lib/locales/ar.json', JSON.stringify(ar, null, 2) + '\n', 'utf8');
console.log('ar.json done!');

// Fix de.json - fix tab
const deContent = fs.readFileSync('src/lib/locales/de.json', 'utf8');
const de = JSON.parse(deContent);

de.ribbon.ink.tab = {
  "ink": "Tinte",
  "handwriting": "Handschrift",
  "startInking": "Inking starten",
  "startInkingHint": "Eine Handschriften-Seite zu dieser Notiz hinzufügen",
  "attachOldPage": "Alte Seite anhängen",
  "attachOldPageHint": "Eine Handschriften-Seite von vor dem Umzug von Ink in Notizen mitbringen",
  "noUnattachedPages": "Keine unbehafteten Tinten-Seiten.",
  "about": "Über",
  "aboutText": "Jede Notiz kann ihre eigene Handschriften-Seite tragen. Stifte, Farben, Auswahl, Papier, Smart Ink und Audio erscheinen hier, sobald du anfängst.",
  "subtabDraw": "Zeichnen",
  "subtabFrames": "Rahmen",
  "subtabObjects": "Objekte",
  "subtabView": "Ansicht",
  "subtabColor": "Farbe",
  "subtabSelect": "Auswählen",
  "subtabPaper": "Papier",
  "subtabSmart": "Smart Ink",
  "subtabAudio": "Audio",
  "overlay": "Overlay",
  "fullPage": "Ganze Seite",
  "inkOverText": "Tinte über Text",
  "fullPageHint": "Zur Vollbild-Tintenoberfläche wechseln",
  "inkOverTextHint": "Tinte über Notiztext in Lesemodus anzeigen",
  "marks": "{count} Striche",
  "statusSaving": "speichern…",
  "statusSaved": "gespeichert",
  "statusAutosave": "autosave an",
  "removeInk": "Tinte entfernen",
  "removeInkHint": "Gesamte Handschrift in dieser Notiz löschen"
};

fs.writeFileSync('src/lib/locales/de.json', JSON.stringify(de, null, 2) + '\n', 'utf8');
console.log('de.json done!');

// Fix fa.json - remove extra frameTypes
const faContent = fs.readFileSync('src/lib/locales/fa.json', 'utf8');
const fa = JSON.parse(faContent);
delete fa.vault.shortcuts.canvas.frameTypes["3:4"];
delete fa.vault.shortcuts.canvas.frameTypes["4:3"];
delete fa.vault.shortcuts.canvas.frameTypes["16:9"];
fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
console.log('fa.json done!');

// Fix hi.json
const hiContent = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const hi = JSON.parse(hiContent);
delete hi.vault.shortcuts.canvas.frameTypes["3:4"];
delete hi.vault.shortcuts.canvas.frameTypes["4:3"];
delete hi.vault.shortcuts.canvas.frameTypes["16:9"];
fs.writeFileSync('src/lib/locales/hi.json', JSON.stringify(hi, null, 2) + '\n', 'utf8');
console.log('hi.json done!');

// Fix en.json - add missing template family keys and keys used in code
const enContent = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const en = JSON.parse(enContent);

// Add missing template family keys to en.json
en.rail.spaces.journal = "Journal";
en.rail.spaces.tasks = "Tasks";
en.rail.spaces.cards = "Cards";
en.rail.spaces.tables = "Tables";
en.rail.spaces.code = "Code";
en.vault.canvas.status.idle = "idle";
en.vault.canvas.status.saving = "saving";
en.vault.canvas.status.saved = "saved";
en.vault.code.status.idle = "idle";
en.vault.code.status.saving = "saving";
en.vault.code.status.saved = "saved";
en.vault.tables.status.idle = "idle";
en.vault.tables.status.saving = "saving";
en.vault.tables.status.saved = "saved";

// Add missing keys used in code
en.ribbon.home.ai = "AI";
en.ink.frames.template = "Template";
en.ink.frames.pages = "Pages";
en.ink.frames.shapes = "Shapes";
en.ink.objects.select = "Select";
en.ink.objects.lasso = "Lasso";
en.ink.objects.delete = "Delete";
en.ink.objects.front = "Front";
en.ink.objects.back = "Back";
en.ink.objects.apply = "Apply";
en.ink.objects.recolor = "Recolor";
en.ink.objects.deselect = "Deselect";
en.ink.groups.shapes = "Shapes";
en.ink.objects.shapes = "Shapes";
en.ink.objects.stickers = "Stickers";
en.ink.objects.textbox = "Textbox";
en.ink.objects.sticky = "Sticky";
en.ink.groups.overlay = "Overlay";
en.ink.tab.collapse = "Collapse";
en.ink.tab.expand = "Expand";
en.pdf.annotate.saved = "Saved";
en.pdf.annotate.exit = "Exit";
en.pdf.annotate.enter = "Enter";
en.pdf.annotate.save = "Save";
en.pdf.annotate.export = "Export";
en.settings.appearance = "Appearance";
en.lang = "Language";
en.digits = "Digits";

// Add template families to checker (we need to update the i18n-check.mjs file)
// For now, let's just add the template family keys to en.json so they pass the check

fs.writeFileSync('src/lib/locales/en.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('en.json done!');

console.log('All done!');