import fs from 'fs';

// Read the original file
const content = fs.readFileSync('src/lib/locales/ur.json', 'utf8');
const ur = JSON.parse(content);

// 1. Add top-level "ink" key (matching en.json structure)
ur.ink = {
  "groups": {
    "draw": "کھینچیں",
    "color": "رنگ",
    "history": "تاریخ",
    "view": "نمائش",
    "more": "مزید"
  },
  "more": {
    "label": "مزید",
    "hint": "کم استعمال ہونے والے آلات",
    "modes": "مودز",
    "eraser": "مٹانے والے کی سیٹنگز",
    "brushEngine": "برش انجن",
    "brushEngineHint": "قلم کا برتاؤ، ایرر انجن، شےپ اور رولر مدد",
    "shapes": "شےپز",
    "coordinateGraph": "کآرڈینیٹ گراف",
    "paper": "کاغذ",
    "paperStudio": "کاغذ سٹوڈیو",
    "smartInk": "سمارٹ انک",
    "handwriting": "خطاطة",
    "equation": "مساوات",
    "resultsSearch": "نتائج اور تلاش",
    "audio": "آڈیو",
    "record": "رکارڈ",
    "stop": "رکیں",
    "play": "چلائیں",
    "pause": "ثام لیں",
    "replayInk": "انک دوبارہ چلائیں",
    "removeAudio": "آڈیو ہٹائیں",
    "overlay": "اوورلی",
    "fullPage": "مکمل صفحہ",
    "inkOverText": "متن پر انک",
    "destructive": "تباہ کن",
    "removeInk": "انک ہٹائیں",
    "attachOld": "پورانا صفحہ جوڑیں",
    "disabled": "پہلے لاسو سے نشان منتخب کریں"
  },
  "draw": {
    "pen": "قلم",
    "penHint": "قلم چنیں",
    "eraser": "مٹانے والا",
    "eraserHint": "نشان مٹائیں",
    "lasso": "لاسو",
    "lassoHint": "نشانوں کو گھیر کر منتخب کریں",
    "width": "چوڑائی",
    "saveFavPen": "موجودہ قلم کو پسندیدہ بنائیں",
    "removeFavPen": "پسندیدہ قلم ہٹائیں",
    "noFavPens": "اپنے پسندیدہ قلم سیٹ اپ یہاں محفوظ کریں (اکثر 8)"
  },
  "color": {
    "picker": "رنگ",
    "pickerHint": "مکسر، پیلٹس اور تاریخ کھولیں"
  },
  "mode": {
    "select": "منتخب کریں",
    "shape": "شےپز",
    "pan": "پین",
    "pick": "چنیں",
    "insertSpace": "خلا داخل کریں"
  },
  "groups": {
    "draw": "کھینچیں",
    "color": "رنگ",
    "history": "تاریخ",
    "view": "نمائش",
    "more": "مزید",
    "select": "منتخب کریں",
    "object": "شیء",
    "strokes": "اسٹروکس",
    "transform": "ترمیم",
    "template": "ٹیمپلیٹ",
    "pageSize": "صفحے کا سائز",
    "pages": "صفحات",
    "paperStudio": "کاغذ سٹوڈیو",
    "recognise": "پہچانیں",
    "results": "نتائج",
    "record": "رکارڈ",
    "playback": "پلے بیک",
    "manage": "انتظام کریں"
  },
  "history": {
    "undo": "الٹا کریں",
    "undoHint": "آخری نشان الٹا کریں",
    "redo": "دوبارہ کریں",
    "redoHint": "دوبارہ کریں"
  },
  "view": {
    "zoomOut": "زوم آؤٹ",
    "zoomIn": "زوم ان",
    "fit": "فٹ",
    "fitHint": "صفحے کو انک کے مطابق فٹ کریں"
  },
  "select": {
    "select": "منتخب کریں",
    "selectHint": "اشیاء منتخب کریں، منتقل کریں، سائز بدلیں اور گھمائیں",
    "lasso": "لاسو",
    "lassoHint": "نشانوں کو گھیر کر منتخب کریں"
  },
  "object": {
    "delete": "ڈیلیٹ",
    "deleteHint": "منتخب شیء ڈیلیٹ کریں",
    "front": "آگے",
    "frontHint": "سب سے آگے لائیں",
    "back": "پیچھے",
    "backHint": "سب سے پیچھے لائیں"
  },
  "strokes": {
    "apply": "لاگو کریں",
    "applyHint": "منتقل کرنے، سائز بدalnے یا گھمانے کو یقینی بنائیں",
    "recolor": "دوبارہ رنگ بھریں",
    "recolorHint": "سلیکشن کو موجودہ انک سے رنگیں",
    "delete": "ڈیلیٹ",
    "deleteHint": "منتخب نشان ڈیلیٹ کریں",
    "deselect": "ان سلیکشن",
    "deselectHint": "سلیکشن صاف کریں"
  },
  "transform": {
    "studio": "سلیکشن سٹوڈیو",
    "studioHint": "سلیکشن کو بالکل درست منتقل کریں، سائز بدل اور گھمائیں",
    "disabled": "پہلے لاسو سے نشان منتخب کریں"
  },
  "paper": {
    "template": "کاغذ ٹیمپلیٹ",
    "tone": "کاغذ کا روپ",
    "size": "صفحے کا سائز",
    "studio": "کاغذ سٹوڈیو",
    "studioHint": "تمام کاغذ کے آپشنز ایک جگہ",
    "clear": "صفحہ صاف کریں",
    "clearHint": "اس صفحے سے ہر نشان ہٹائیں"
  },
  "pages": {
    "prev": "پچھلا صفحہ",
    "next": "اگلا صفحہ",
    "page": "صفحہ {num}"
  },
  "smart": {
    "handwriting": "خطاطة",
    "handwritingHint": "لاسو سلیکشن، یا نظر آنے والے صفحے کو متن میں تبدیل کریں",
    "equation": "مساوات",
    "equationHint": "ہاتھ سے لکھی گئی ریاضیات کو ل ٹیکس میں تبدیل کریں",
    "results": "نتائج اور تلاش",
    "resultsHint": "پہچانا ہوا متن، اسے صفحے پر داخل کریں، سب خطاطة تلاش کریں"
  },
  "audio": {
    "record": "رکارڈ",
    "recordHint": "لکھتے وقت آڈیو رکارڈ کریں؛ ہر اسٹروک ٹائم اسٹیمپ ہوتا ہے",
    "stop": "رکیں",
    "play": "چلائیں",
    "playHint": "رکارینگ چلائیں اور صفحہ دوبارہ کھینچیں جیسے لکھا گیا تھا",
    "pause": "ثام لیں",
    "replayInk": "انک دوبارہ چلائیں",
    "replayInkHint": "آواز کے بغیر اسٹروکس دوبارہ چلائیں",
    "noRecording": "کوئی رکارینگ نہیں",
    "studio": "آڈیو سٹوڈیو",
    "studioHint": "رکارینگ میں آگے پیچھے جائیں",
    "remove": "آڈیو ہٹائیں",
    "removeHint": "اس صفحے سے رکارینگ ڈیلیٹ کریں",
    "recording": "رکارڈ ہو رہا ہے…"
  },
  "overlay": {
    "fullPage": "مکمل صفحہ",
    "inkOverText": "متن پر انک",
    "fullPageHint": "مکمل صفحے والی انک سطح پر جائیں",
    "inkOverTextHint": "ریڈر وью میں نوٹ متن پر انک دکھائیں"
  },
  "tab": {
    "handwriting": "خطاطة",
    "startInking": "انکنگ شروعات کریں",
    "startInkingHint": "اس نوٹ میں خطاطة کا صفحہ شامل کریں",
    "attachOldPage": "پورانا صفحہ جوڑیں",
    "attachOldPageHint": "انک کے نوٹس کے اندر منتقل ہونے سے پہلے کا خطاطة صفحہ لائیں",
    "noAttachable": "کوئی بے جوڑ انک صفحہ نہیں۔",
    "ink": "انک",
    "overlay": "اوورلی",
    "handwritingPage": "خطاطة صفحہ",
    "marks": "{count} نشان",
    "saving": "محفوظ ہو رہا ہے…",
    "saved": "محفوظ ہوا",
    "autosave": "آٹو سیو آن",
    "attachOld": "پورانا صفحہ جوڑیں",
    "attachOldHint": "پہلے بنایا ہوا خطاطة صفحہ اس نوٹ سے جوڑیں",
    "statusSaving": "محفوظ ہو رہا ہے…",
    "statusSaved": "محفوظ ہوا",
    "statusAutosave": "آٹو سیو آن",
    "removeInk": "انک ہٹائیں",
    "removeInkHint": "اس نوٹ میں سب خطاطة ڈیلیٹ کریں"
  }
};

// 2. Add ribbon.wordGoal to ribbon object
ur.ribbon.wordGoal = {
  "wordGoal": "الفاظ کا ہدف",
  "targetWords": "ہدف الفاظ",
  "setGoal": "ہدف مقرر کریں",
  "updateGoal": "ہدف اپڈیٹ کریں",
  "editGoal": "ہدف ترمیم کریں",
  "clearGoal": "ہدف حذف کریں"
};

// 3. Add format section at the end
ur.format = {
  "capability": {
    "markdown": {
      "ink": "مارك ڈاؤن میں دستیاب نہیں",
      "shapes": "مارك ڈاؤن میں دستیاب نہیں"
    },
    "plain": {
      "richFormat": "مجرّد متن میں دستیاب نہیں",
      "codeBlocks": "مجرّد متن میں دستیاب نہیں",
      "math": "مجرّد متن میں دستیاب نہیں",
      "images": "مجرّد متن میں دستیاب نہیں",
      "tables": "مجرّد متن میں دستیاب نہیں",
      "ink": "مجرّد متن میں دستیاب نہیں",
      "shapes": "مجرّد متن میں دستیاب نہیں",
      "insert": "مجرّد متن میں دستیاب نہیں",
      "design": "مجرّد متن میں دستیاب نہیں",
      "layout": "مجرّد متن میں دستیاب نہیں",
      "exportPdf": "مجرّد متن میں دستیاب نہیں"
    },
    "html": {
      "ink": "ایچ ٹی ایم ایل میں دستیاب نہیں",
      "shapes": "ایچ ٹی ایم ایل میں دستیاب نہیں",
      "design": "ایچ ٹی ایم ایل اسٹائلنگ سورس میں ہے",
      "layout": "ایچ ٹی ایم ایل اسٹائلنگ سورس میں ہے"
    },
    "pdf": {
      "editText": "پی ڈی ایف میں دستیاب نہیں",
      "richFormat": "پی ڈی ایف میں دستیاب نہیں",
      "codeBlocks": "پی ڈی ایف میں دستیاب نہیں",
      "math": "پی ڈی ایف میں دستیاب نہیں",
      "images": "پی ڈی ایف میں دستیاب نہیں",
      "tables": "پی ڈی ایف میں دستیاب نہیں",
      "links": "پی ڈی ایف میں دستیاب نہیں",
      "insert": "پی ڈی ایف میں دستیاب نہیں",
      "design": "پی ڈی ایف میں دستیاب نہیں",
      "layout": "پی ڈی ایف میں دستیاب نہیں"
    },
    "canvas": {}
  }
};

// Write back using JSON.stringify to ensure valid JSON
fs.writeFileSync('src/lib/locales/ur.json', JSON.stringify(ur, null, 2) + '\n', 'utf8');
console.log('Done!');