import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/fa.json', 'utf8');
const fa = JSON.parse(content);

// Fix fa.json - add top-level "ink" key (matching en.json structure)
fa.ink = {
  "groups": {
    "draw": "رسم",
    "color": "رنگ",
    "history": "تاریخ",
    "view": "نمایش",
    "more": "بیشتر"
  },
  "more": {
    "label": "بیشتر",
    "hint": "ابزارهای کم استفاده",
    "modes": "حالت‌ها",
    "eraser": "تنظیمات ممحا",
    "brushEngine": "موتور قلم",
    "brushEngineHint": "رفتار قلم، موتور ممحا، شکل‌ها و کمک‌های خط‌کش",
    "shapes": "اشکال",
    "coordinateGraph": "نمودار مختصات",
    "paper": "کاغذ",
    "paperStudio": "استودیو کاغذ",
    "smartInk": "مداد هوشمند",
    "handwriting": "تشخیص دست‌نویس",
    "equation": "معادله",
    "resultsSearch": "نتایج و جستجو",
    "audio": "صوت",
    "record": "ضبط",
    "stop": "توقف",
    "play": "پخش",
    "pause": "مکث",
    "replayInk": "بازپخش مداد",
    "removeAudio": "حذف صدا",
    "overlay": "نمایه",
    "fullPage": "تمام صفحه",
    "inkOverText": "مداد روی متن",
    "destructive": "تخریبی",
    "removeInk": "حذف مداد",
    "attachOld": "پیوستن صفحه قدیمی",
    "disabled": "ابتدا خطوط را با لاسو انتخاب کنید"
  },
  "draw": {
    "pen": "قلم",
    "penHint": "قلم انتخاب کنید",
    "eraser": "ممحا",
    "eraserHint": "خطوط را پاک کنید",
    "lasso": "لاسو",
    "lassoHint": "خطوط را با احاطه کردن انتخاب کنید",
    "width": "عرض",
    "saveFavPen": "قلم فعلی را به عنوان مورد علاقه ذخیره کنید",
    "removeFavPen": "قلم مورد علاقه را حذف کنید",
    "noFavPens": "تنظیمات قلم‌های مورد علاقه خود را اینجا ذخیره کنید (حداکثر ۸)"
  },
  "color": {
    "picker": "رنگ",
    "pickerHint": "میکسر رنگ، پالت‌ها و تاریخچه را باز کنید"
  },
  "mode": {
    "select": "انتخاب",
    "shape": "اشکال",
    "pan": "پان",
    "pick": "انتخاب",
    "insertSpace": "افزودن فضا"
  },
  "groups": {
    "draw": "رسم",
    "color": "رنگ",
    "history": "تاریخ",
    "view": "نمایش",
    "more": "بیشتر",
    "select": "انتخاب",
    "object": "شیء",
    "strokes": "خطوط",
    "transform": "تغییر",
    "template": "الگو",
    "pageSize": "اندازه صفحه",
    "pages": "صفحات",
    "paperStudio": "استودیو کاغذ",
    "recognise": "تشخیص",
    "results": "نتایج",
    "record": "ضبط",
    "playback": "پخش",
    "manage": "مدیریت"
  },
  "history": {
    "undo": "واگرد",
    "undoHint": "آخرین خط را برگردان",
    "redo": "انجام مجدد",
    "redoHint": "انجام مجدد"
  },
  "view": {
    "zoomOut": "کوچک‌نمایی",
    "zoomIn": "بزرگ‌نمایی",
    "fit": "جایگزینی",
    "fitHint": "صفحه را به مداد فیت کنید"
  },
  "select": {
    "select": "انتخاب",
    "selectHint": "انتخاب، جابجایی، تغییر اندازه و چرخش اشیاء",
    "lasso": "لاسو",
    "lassoHint": "خطوط را با احاطه کردن انتخاب کنید"
  },
  "object": {
    "delete": "حذف",
    "deleteHint": "شیء انتخاب شده را حذف کنید",
    "front": "جلو",
    "frontHint": "به جلو بیاورید",
    "back": "پشت",
    "backHint": "به عقب بفرستید"
  },
  "strokes": {
    "apply": "اعمال",
    "applyHint": "جابه‌جا، مقیاس یا چرخش را تایید کنید",
    "recolor": "بازرنگ",
    "recolorHint": "انتخاب را با مداد فعلی بازرنگ کنید",
    "delete": "حذف",
    "deleteHint": "خطوط انتخاب شده را حذف کنید",
    "deselect": "عدم انتخاب",
    "deselectHint": "انتخاب را پاک کنید"
  },
  "transform": {
    "studio": "استودیو انتخاب",
    "studioHint": "انتخاب را به دقت جابجا، مقیاس و چرخش دهید",
    "disabled": "ابتدا خطوط را با لاسو انتخاب کنید"
  },
  "paper": {
    "template": "الگوی کاغذ",
    "tone": "رنگ کاغذ",
    "size": "اندازه صفحه",
    "studio": "استودیو کاغذ",
    "studioHint": "همه گزینه‌های کاغذ در یک جا",
    "clear": "صفحه را پاک کنید",
    "clearHint": "تمام خطوط را در این صفحه حذف کنید"
  },
  "pages": {
    "prev": "صفحه قبلی",
    "next": "صفحه بعد",
    "page": "صفحه {num}"
  },
  "smart": {
    "handwriting": "تشخیص دست‌نویس",
    "handwritingHint": "انتخاب لاسو یا صفحه قابل مشاهده را به متن تبدیل کنید",
    "equation": "معادله",
    "equationHint": "ریاضیات دست‌نویس را به LaTeX تبدیل کنید",
    "results": "نتایج و جستجو",
    "resultsHint": "متن شناسایی شده، در صفحه قرار دهید، همه دست‌نویس‌ها را جستجو کنید"
  },
  "audio": {
    "record": "ضبط",
    "recordHint": "هنگام نوشتن صدا ضبط کنید؛ هر خط دارای برچسب زمانی",
    "stop": "توقف",
    "play": "پخش",
    "playHint": "ضبط را پخش کنید و صفحه را همان‌طور که نوشته شده بازسازی کنید",
    "pause": "مکث",
    "replayInk": "بازپخش مداد",
    "replayInkHint": "خطوط را بدون صدا بازپخش کنید",
    "noRecording": "ضبطی وجود ندارد",
    "studio": "استودیو صدا",
    "studioHint": "در ضبط جستجو کنید",
    "remove": "حذف صدا",
    "removeHint": "ضبط را از این صفحه حذف کنید",
    "recording": "در حال ضبط…"
  },
  "overlay": {
    "fullPage": "تمام صفحه",
    "inkOverText": "مداد روی متن",
    "fullPageHint": "به سطح مداد تمام صفحه بروید",
    "inkOverTextHint": "در نما خواندن، مداد روی متن یادداشت نمایش دهید"
  },
  "tab": {
    "handwriting": "دست‌نویس",
    "startInking": "شروع مداد",
    "startInkingHint": "صفحه دست‌نویس به این یادداشت اضافه کنید",
    "attachOldPage": "صفحه قدیمی پیوستن",
    "attachOldPageHint": "صفحه دست‌نویس قبل از انتقال Ink در یادداشت‌ها را بیاورید",
    "noAttachable": "صفحه مداد بی‌پیوست وجود ندارد.",
    "ink": "مداد",
    "overlay": "نمایه",
    "handwritingPage": "صفحه دست‌نویس",
    "marks": "{count} علامت",
    "saving": "در حال ذخیره…",
    "saved": "ذخیره شده",
    "autosave": "ذخیره خودکار فعال",
    "attachOld": "صفحه قدیمی پیوستن",
    "attachOldHint": "صفحه دست‌نویس قبلاً ساخته شده را به این یادداشت الحاق کنید",
    "statusSaving": "در حال ذخیره…",
    "statusSaved": "ذخیره شده",
    "statusAutosave": "ذخیره خودکار فعال",
    "removeInk": "حذف مداد",
    "removeInkHint": "تمام دست‌نویس در این یادداشت را حذف کنید"
  }
};

// Fix ribbon.ink to match en.json structure
fa.ribbon.ink = {
  "draw": {
    "mode": "حالت",
    "pens": "قلم‌ها",
    "favouritePens": "قلم‌های مورد علاقه",
    "stroke": "خط",
    "eraser": "ممحا",
    "history": "تاریخ",
    "view": "نمایش",
    "shapes": "اشکال",
    "drawMode": "رسم",
    "drawModeHint": "با قلم فعلی رسم کنید",
    "shapeMode": "اشکال",
    "shapeModeHint": "خطوط، کادرها، دایره‌ها و نمودار مختصات رسم کنید",
    "selectMode": "انتخاب",
    "selectModeHint": "انتخاب، جابجایی، تغییر اندازه و چرخش اشیاء",
    "lassoMode": "لاسو",
    "lassoModeHint": "خطوط را با دایره کشیدن انتخاب کنید",
    "eraseMode": "ممحا",
    "eraseModeHint": "خطوط را پاک کنید",
    "panMode": "پان",
    "panModeHint": "صفحه را جابجا کنید",
    "eyedropperMode": "ابرو برش",
    "eyedropperModeHint": "یک رنگ از صفحه انتخاب کنید",
    "insertSpaceMode": "افزودن فضا",
    "insertSpaceModeHint": "برای وارد یا حذف فضای عمودی بین نشانه‌های مداد بکشید",
    "brushEngine": "موتور قلم",
    "brushEngineHint": "رفتار قلم، موتور ممحا، شکل‌ها و کمک‌های خط‌کش",
    "eraseStroke": "خط",
    "eraseStrokeHint": "خطوط کامل را پاک کنید",
    "erasePrecision": "نقطه",
    "erasePrecisionHint": "ممحا دقیق",
    "eraserSmall": "ممحا کوچک (۱۲پیکسل)",
    "eraserMedium": "ممحا متوسط (۲۶پیکسل)",
    "eraserLarge": "ممحا بزرگ (۵۰پیکسل)",
    "eraserRadius": "شعاع",
    "undo": "واگرد",
    "undoHint": "آخرین خط را برگردان",
    "redo": "انجام مجدد",
    "redoHint": "انجام مجدد",
    "zoomOut": "کوچک‌نمایی",
    "zoomIn": "بزرگ‌نمایی",
    "fit": "فیت",
    "fitHint": "صفحه را به مداد فیت کنید",
    "clearPage": "پاک کردن صفحه",
    "clearPageHint": "همه نشانه‌ها را در این صفحه حذف کنید",
    "coordinateGraph": "نمودار مختصات",
    "coordinateGraphHint": "نمودار مختصات با محورها، شبکه و نشان‌های تیک درج کنید",
    "addCoordinateGraph": "نمودار مختصات اضافه کنید",
    "insertSpaceToast": "متن جابجا نمی‌شود. مداد زیر خط از موقعیت نوشتن متن اصلی دور می‌شود.",
    "snapShapes": "اشکال سنپ",
    "snapShapesHint": "به صورت خودکار ضربه‌های آزاد را به اشکال هندسی تبدیل کنید",
    "comingSoon": "به زودی",
    "saveFavPen": "قلم فعلی را به عنوان مورد علاقه ذخیره کنید",
    "removeFavPen": "قلم مورد علاقه را حذف کنید",
    "favPenEmpty": "تنظیمات قلم‌های مورد علاقه‌تان را اینجا ذخیره کنید (حداکثر ۸)",
    "strokeWidth": "عرض",
    "strokeOpacity": "عدم شفافیت"
  },
  "color": {
    "current": "فعلی",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "رنگ هگزادسیمال",
    "hexHelpValid": "۳ یا ۶ رقم هگز، با یا بدون #",
    "hexHelpInvalid": "هگز نامعتبر — برای بازگردن Escape فشار دهید",
    "quickInks": "مدادهای سریع",
    "recent": "اخیر",
    "recentEmpty": "رنگ‌هایی که استفاده می‌کنید اینجا ظاهر می‌شوند",
    "studio": "استودیو",
    "colorStudio": "استودیو رنگ",
    "colorStudioHint": "میکسر، پالت‌ها، عدم شفافیت و رنگ‌های سفارشی",
    "pick": "انتخاب",
    "pickHint": "یک رنگ از صفحه انتخاب کنید",
    "opacity": "عدم شفافیت"
  },
  "select": {
    "select": "انتخاب",
    "selectHint": "انتخاب، جابجایی، تغییر اندازه و چرخش اشیاء",
    "lasso": "لاسو",
    "lassoHint": "خطوط را با احاطه کردن انتخاب کنید",
    "selectionInfo": "شیء: {type}",
    "strokesSelected": "{count} خط",
    "nothingSelected": "هیچ چیز انتخاب نشده",
    "apply": "اعمال",
    "applyHint": "جابجایی، مقیاس یا چرخش را تایید کنید",
    "recolor": "بازرنگ",
    "recolorHint": "انتخاب را با مداد فعلی بازرنگ کنید",
    "delete": "حذف",
    "deleteHint": "خطوط انتخاب شده را حذف کنید",
    "deselect": "عدم انتخاب",
    "deselectHint": "انتخاب را پاک کنید",
    "transform": "تغییر",
    "selectionStudio": "استودیو انتخاب",
    "selectionStudioHint": "انتخاب را به دقت جابجا، مقیاس و چرخش دهید",
    "selectFirst": "ابتدا خطوط را با لاسو انتخاب کنید",
    "selectObjectFirst": "یک شیء را با ابزار انتخاب انتخاب کنید"
  },
  "paper": {
    "template": "الگو",
    "paperTemplate": "الگوی کاغذ",
    "paperTone": "تون کاغذ",
    "pageSize": "اندازه صفحه",
    "pages": "صفحات",
    "previousPage": "صفحه قبلی",
    "nextPage": "صفحه بعدی",
    "pageNumber": "صفحه {num}",
    "studio": "استودیو",
    "paperStudio": "استودیو کاغذ",
    "paperStudioHint": "همه گزینه‌های کاغذ در یک جا",
    "clearPage": "صفحه را پاک کنید",
    "clearPageHint": "همه نشانه‌ها را در این صفحه حذف کنید"
  },
  "frames": {
    "template": "الگو",
    "paperTemplate": "الگوی کاغذ",
    "paperTone": "تن کاغذ",
    "pageSize": "اندازه صفحه",
    "pages": "صفحات",
    "previousPage": "صفحه قبلی",
    "nextPage": "صفحه بعدی",
    "pageNumber": "صفحه {num}",
    "studio": "استودیو",
    "paperStudio": "استودیو کاغذ",
    "paperStudioHint": "همه گزینه‌های کاغذ در یک جا",
    "coordinateGraph": "نمودار مختصات",
    "coordinateGraphHint": "نمودار مختصات با محورها، شبکه و نشان‌های تیک اضافه کنید",
    "addCoordinateGraph": "نمودار مختصات اضافه کنید",
    "clearPage": "صفحه را پاک کنید",
    "clearPageHint": "همه نشانه‌ها را در این صفحه حذف کنید"
  },
  "objects": {
    "select": "انتخاب",
    "selectHint": "انتخاب، جابجایی، تغییر اندازه و چرخش اشیاء",
    "lasso": "لاسو",
    "lassoHint": "خطوط را با دایره کشیدن انتخاب کنید",
    "shapes": "اشکال",
    "shapesHint": "مستطیل‌ها، دایره‌ها، خطوط، فلش‌ها و چندضلعی‌ها را درج کنید",
    "stickers": "استیکرها",
    "stickersHint": "استیکرهای تزئینی درج کنید",
    "textbox": "مربع متن",
    "textboxHint": "مربع متن درج کنید",
    "sticky": "یادداشت چسبان",
    "stickyHint": "یادداشت چسبان درج کنید",
    "selectionInfo": "شیء: {type}",
    "strokesSelected": "{count} خط",
    "nothingSelected": "هیچ چیز انتخاب نشده",
    "apply": "اعمال",
    "applyHint": "جابجایی، مقیاس یا چرخش را تایید کنید",
    "recolor": "بازرنگ",
    "recolorHint": "انتخاب را با مداد فعلی بازرنگ کنید",
    "delete": "حذف",
    "deleteHint": "شیء انتخاب شده را حذف کنید",
    "deselect": "لغو انتخاب",
    "deselectHint": "انتخاب را پاک کنید",
    "transform": "تغییر",
    "selectionStudio": "استودیو انتخاب",
    "selectionStudioHint": "انتخاب را به دقت جابجا، مقیاس و چرخش دهید",
    "selectFirst": "ابتدا خطوط را با لاسو انتخاب کنید",
    "selectObjectFirst": "یک شیء را با ابزار انتخاب انتخاب کنید"
  },
  "smart": {
    "recognise": "تشخیص",
    "handwriting": "دست‌نویس",
    "handwritingHint": "انتخاب لاسو، یا صفحه در دید، را به متن تبدیل کنید",
    "equation": "معادله",
    "equationHint": "ریاضیات دست‌نویس را به LaTeX تبدیل کنید",
    "resultsAndSearch": "نتایج و جستجو",
    "resultsSearch": "نتایج و جستجو",
    "resultsSearchHint": "متن شناسایی شده، در صفحه درج کنید، همه دست‌نویس را جستجو کنید"
  },
  "audio": {
    "record": "ضبط",
    "recordLabel": "هنگام نوشتن صدا ضبط کنید؛ هر خط دارای برچسب زمانی",
    "stop": "توقف",
    "stopLabel": "ضبط را متوقف کنید",
    "playback": "پخش مجدد",
    "play": "پخش",
    "playHint": "ضبط را پخش کنید و صفحه را همان‌طور که نوشته شده بازسازی کنید",
    "pause": "مکث",
    "replayInk": "بازپخش مداد",
    "replayInkHint": "خطوط را بدون صدا بازپخش کنید",
    "noRecording": "بدون ضبط",
    "manage": "مدیریت",
    "audioStudio": "استودیو صدا",
    "audioStudioHint": "در ضبط جستجو کنید",
    "removeAudio": "حذف صدا",
    "removeAudioHint": "ضبط را از این صفحه حذف کنید",
    "recordFirst": "ابتدا کمی صدا ضبط کنید"
  },
  "tab": {
    "ink": "مداد",
    "handwriting": "دست‌نویس",
    "startInking": "شروع مداد",
    "startInkingHint": "یک صفحه دست‌نویس به این یادداشت اضافه کنید",
    "attachOldPage": "صفحه قدیمی پیوستن",
    "attachOldPageHint": "یک صفحه دست‌نویس از قبل از انتقال Ink در یادداشت‌ها بیاورید",
    "noUnattachedPages": "صفحه مداد بی‌پیوست وجود ندارد.",
    "about": "درباره",
    "aboutText": "هر یادداشت می‌تواند صفحه دست‌نویس خود را داشته باشد. قلم‌ها، رنگ‌ها، انتخاب، کاغذ، هوشمند مداد و صدا در اینجا ظاهر می‌شوند وقتی شما شروع می‌کنید.",
    "subtabDraw": "رسم",
    "subtabFrames": "فریم‌ها",
    "subtabObjects": "اشیاء",
    "subtabView": "نمایش",
    "subtabColor": "رنگ",
    "subtabSelect": "انتخاب",
    "subtabPaper": "کاغذ",
    "subtabSmart": "مداد هوشمند",
    "subtabAudio": "صوت",
    "overlay": "نمایه",
    "fullPage": "تمام صفحه",
    "inkOverText": "مداد روی متن",
    "fullPageHint": "به سطح مداد تمام صفحه بروید",
    "inkOverTextHint": "در نمای خواندن، مداد روی متن یادداشت نمایش دهید",
    "marks": "{count} علامت",
    "statusSaving": "در حال ذخیره…",
    "statusSaved": "ذخیره شده",
    "statusAutosave": "ذخیره خودکار فعال",
    "removeInk": "حذف مداد",
    "removeInkHint": "تمام دست‌نویس در این یادداشت را حذف کنید"
  },
  "eraserModes": {
    "stroke": "خط",
    "precision": "دقت"
  },
  "groups": {
    "draw": "رسم",
    "frames": "فریم‌ها",
    "objects": "اشیاء",
    "view": "نمایش",
    "more": "بیشتر"
  },
  "more": {
    "label": "بیشتر",
    "hint": "ابزارهای کم استفاده",
    "modes": "حالت‌ها",
    "eraser": "تنظیمات ممحا",
    "brushEngine": "موتور قلم",
    "brushEngineHint": "رفتار قلم، موتور ممحا، اشکال و کمکی‌های خط‌کش",
    "shapes": "اشکال",
    "coordinateGraph": "نمودار مختصات",
    "paper": "کاغذ",
    "paperStudio": "استودیو کاغذ",
    "smartInk": "مداد هوشمند",
    "handwriting": "تشخیص دست‌نویس",
    "equation": "معادله",
    "resultsSearch": "نتایج و جستجو",
    "audio": "صوت",
    "record": "ضبط",
    "stop": "توقف",
    "play": "پخش",
    "pause": "مکث",
    "replayInk": "بازپخش مداد",
    "removeAudio": "حذف صدا",
    "overlay": "نمایه",
    "fullPage": "تمام صفحه",
    "inkOverText": "مداد روی متن",
    "destructive": "تخریبی",
    "removeInk": "حذف مداد",
    "attachOld": "پیوستن صفحه قدیمی",
    "disabled": "ابتدا خطوط را با لاسو انتخاب کنید"
  },
  "draw": {
    "pen": "قلم",
    "penHint": "یک قلم انتخاب کنید",
    "eraser": "ممحا",
    "eraserHint": "نشانه‌ها را پاک کنید",
    "lasso": "لاسو",
    "lassoHint": "نشانه‌ها را با دایره کشیدن انتخاب کنید",
    "width": "عرض",
    "saveFavPen": "قلم فعلی را به عنوان مورد علاقه ذخیره کنید",
    "removeFavPen": "قلم مورد علاقه را حذف کنید",
    "noFavPens": "تنظیمات قلم‌های مورد علاقه‌تان را اینجا ذخیره کنید (حداکثر ۸)"
  },
  "color": {
    "picker": "رنگ",
    "pickerHint": "میکسر رنگ، پالت‌ها و تاریخچه را باز کنید"
  },
  "tab": {
    "handwriting": "دست‌نویس",
    "startInking": "شروع مداد",
    "startInkingHint": "یک صفحه دست‌نویس به این یادداشت اضافه کنید",
    "attachOldPage": "صفحه قدیمی پیوستن",
    "attachOldPageHint": "یک صفحه دست‌نویس از قبل از انتقال Ink در یادداشت‌ها بیاورید",
    "noAttachable": "صفحه مداد بی‌پیوست وجود ندارد.",
    "ink": "مداد",
    "overlay": "نمایه",
    "fullPage": "تمام صفحه",
    "inkOverText": "مداد روی متن",
    "fullPageHint": "به سطح مداد تمام صفحه بروید",
    "inkOverTextHint": "در نمای خواندن، مداد روی متن یادداشت نمایش دهید",
    "handwritingPage": "صفحه دست‌نویس",
    "marks": "{count} علامت",
    "statusSaving": "در حال ذخیره…",
    "statusSaved": "ذخیره شده",
    "statusAutosave": "ذخیره خودکار فعال",
    "removeInk": "حذف مداد",
    "removeInkHint": "تمام دست‌نویس در این یادداشت را حذف کنید"
  }
};

// Add missing ribbon.view keys
fa.ribbon.view = {
  ...fa.ribbon.view,
  "navigation": "ناوبری",
  "pageWidth": "عرض صفحه",
  "onePage": "یک صفحه",
  "twoPages": "دو صفحه",
  "pageScroll": "صفحه و اسکرول",
  "narrow": "باریک",
  "medium": "متوسط",
  "wide": "گسترده",
  "full": "تمام",
  "attachTable": "جدول پیوست",
  "importPdf": "وارد کردن PDF",
  "importPdfHint": "یک فایل PDF را به عنوان یادداشت جدید وارد کنید",
  "importPdfPrompt": "این PDF را به عنوان یک یادداشت جدید وارد کنید؟",
  "pdfImported": "PDF به عنوان یادداشت وارد شد",
  "pdfImportError": "ورود PDF ناموفق بود",
  "prevPage": "صفحه قبلی",
  "nextPage": "صفحه بعد",
  "page": "صفحه {current} از {total}",
  "resetZoom": "بازنشانی زوم",
  "print": "چاپ",
  "download": "دانلود",
  "loadingPdf": "بارگذاری PDF…",
  "pdfLoadError": "خطای بارگذاری PDF",
  "noPdf": "هیچ PDF بارگذاری نشده",
  "editorA11y": "ویرایشگر و دسترس‌پذیری",
  "annotate": {
    "enter": "حاشیه‌نویسی",
    "enterHint": "روی این صفحه PDF رسم کنید",
    "exit": "خروج از حاشیه‌نویسی",
    "exitHint": "رسم را متوقف کنید و به مشاهده برگردید",
    "save": "در PDF ذخیره",
    "saveHint": "حاشیه‌نویسی‌ها را در فایل PDF ذخیره کنید",
    "saved": "حاشیه‌نویسی‌ها در PDF ذخیره شدند",
    "export": "صادر کردن PDF",
    "exportHint": "کپی با یا بدون حاشیه‌نویسی قابل ویرایش دانلود کنید",
    "exportAnnotated": "صادر کردن حاشیه‌نویسی‌دار",
    "exportAnnotatedHint": "با حاشیه‌نویسی‌ها دانلود کنید (در بازکردن مجدد قابل ویرایش)",
    "exportFlattened": "صادر کردن تخت",
    "exportFlattenedHint": "با حاشیه‌نویسی‌های داغ‌کرده دانلود (غیرقابل ویرایش)",
    "exported": "PDF صادر شده",
    "exportedFlattened": "PDF تخت صادر شده"
  }
};

// Add missing ribbon.insert keys
fa.ribbon.insert = {
  ...fa.ribbon.insert,
  "mathBlock": "بلوک ریاضی",
  "mathBlockHint": "یک بلوک ریاضی درج کنید ($$ … $$)",
  "htmlMath": "ریاضی (KaTeX)",
  "htmlMathHint": "بالاتری KaTeX رندر شده با ارجاع CSS محلی را وارد کنید (فقط فرمت HTML)"
};

// Add missing fileMenu keys
fa.fileMenu = {
  ...fa.fileMenu,
  "printExport": {
    ...fa.fileMenu.printExport,
    "htmlEmbedded": "فایل واحد (تصاویر تعبیه شده)",
    "openAsCanvas": "باز کردن به عنوان بوم",
    "openAsCanvasHint": "یک بوم با محتوای این یادداشت در فریم A4 ایجاد کنید",
    "canvasCreated": "بوم ایجاد شد: {name}"
  },
  "migration": {
    "title": "مهاجرت قالب یادداشت",
    "message": "این نسخه LemonNote فرمت‌های یادداشت را ساده می‌کند. یادداشت‌های فرمت YAML، XML، JSON، TOML، CSV، INI، CSS، JavaScript، TypeScript، Python، Rust، Bash، و SQL به Markdown با بلوک‌های کد محدود شده تبدیل می‌شوند، محتوای دقیق آن‌ها حفظ می‌شود.",
    "backupTitle": "پیش از مهاجرته پشتیبان‌گیری کنید",
    "backupMessage": "قبل از اجرای مهاجرت، یک پشتیبان کامل از ذخیره‌سازی شما ایجاد می‌شود. این به شدت توصیه می‌شود تا در صورت بروز هرگونه مشکل بتوانید بازیابی کنید.",
    "backupButton": "پشتیبان‌گیری و مهاجرت",
    "skipButton": "رد پشتیبان‌گیری (توصیه نمی‌شود)",
    "backupSuccess": "پشتیبان با موفقیت ایجاد شد. مهاجر آغاز می‌شود…",
    "backupFailed": "پشتیبان‌گیری ناموفق: {error}. مهاجر برای حفاظت از داده‌های شما متوقف شد.",
    "migrationComplete": "مهاجرت کامل. {count} یادداشت(ها) تبدیل شدند.",
    "migrationFailed": "مهاجر ناموفق: {error}"
  }
};

// Add missing backup keys
fa.backup = {
  ...fa.backup,
  "exportSuccess": "پشتیبان با موفقیت صادر شد.",
  "largeWarning": "فایل پشتیبان بزرگ — تقسیم کردن یا استفاده از ذخیره‌سازی خارجی را در نظر بگیرید.",
  "exportFailed": "صادر کردن پشتیبان ناموفق بود.",
  "readFailed": "خواندن فایل پشتیبان ناموفق بود.",
  "importFailed": "وارد کردن پشتیبان ناموفق بود.",
  "previewFailed": "پیش‌نمایش واردات ناموفق بود.",
  "selectFilesAgain": "لطفاً فایل‌ها را دوباره انتخاب کنید.",
  "selectFolderAgain": "لطفاً پوشه را دوباره انتخاب کنید.",
  "inFile": "در فایل",
  "willImport": "خواهد آمد",
  "replaceWarning": "این کار تمام داده‌های موجود در ذخیره‌جا را جایگزین می‌کند.",
  "attachmentsWarning": "پشتیبان حاوی پیوست‌ها است ({size}). وارد کردن ممکن است مدتی طول بکشد.",
  "confirmFolderImport": "وارد کردن پوشه را تأیید کنید",
  "confirmFileImport": "وارد کردن فایل را تأیید کنید",
  "filesFound": "فایل‌های یافت شده",
  "notesToImport": "یادداشت‌هایی برای وارد کردن",
  "duplicatesFound": "تکراری‌ها یافت شدند",
  "duplicateAction": "در مورد تکراری‌ها",
  "andMore": "+{count} بیشتر",
  "preserveFolders": "حفظ ساختار پوشه‌ها",
  "wholeVault": "کل ذخیره",
  "exportBackup": "صادر کردن پشتیبان",
  "importBackup": "وارد کردن پشتیبان",
  "importFiles": "وارد کردن فایل‌های Markdown",
  "importMarkdown": "وارد کردن Markdown / فایل‌های متنی",
  "importMarkdownDesc": "فایل‌های .md، .markdown، یا .txt را برای وارد کردن به عنوان یادداشت انتخاب کنید.",
  "importFilesBtn": "انتخاب فایل‌ها",
  "importFolderBtn": "انتخاب پوشه",
  "onImport": "در ورود",
  "keepExisting": "موجود را حفظ کنید",
  "replaceEverything": "همه را جایگزین کنید",
  "confirmImport": "وارد کردن را تأیید کنید"
};

// Add missing vault.canvas keys
fa.vault = {
  ...fa.vault,
  "canvas": {
    ...fa.vault.canvas,
    "addFrame": "فریم اضافه کن",
    "fitToPage": "صفحه را فیت کن",
    "fitToWidth": "عرض را فیت کن",
    "zoomOut": "زوم آوت",
    "zoomIn": "زوم این",
    "resetView": "نمایش را بازنشانی کن",
    "export": "صادر کن",
    "import": "وارد کن",
    "exportTooltip": "به عنوان .lemoncanvas صادر کن",
    "importTooltip": "فایل .lemoncanvas را وارد کن",
    "importSuccess": "بوم با موفقیت وارد شد",
    "exportPdf": "به عنوان PDF صادر کن",
    "exportPng": "به عنوان PNG صادر کن",
    "exportWholeCanvas": "کل بوم",
    "exportSelectedFrame": "فریم انتخاب شده",
    "exportPdfTooltip": "بوم را به PDF صادر کن",
    "exportPngTooltip": "بوم را به PNG صادر کن",
    "selectFrameFirst": "ابتدا یک فریم را برای صادرات جداگانه انتخاب کن",
    "newDesign": "طراحی جدید",
    "modeDesign": "طراحی",
    "kindDesign": "طراحی",
    "frameTypes": {
      "a4": "A4 عمودی",
      "a4-landscape": "A4 افقی",
      "letter": "Letter",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "مربع",
      "free": "آزاد"
    },
    "textFrame": {
      "locked": "متن چون مداد روی آن کشیده شده قفل است",
      "unlock": "باز کردن",
      "unlockWarning": "باز کردن قفل ویرایش را اجازه می‌دهد، اما ضربات مداد ممکن است دیگر با محتوای متن هم‌خوانی نداشته باشند."
    }
  }
};

// Add format capability
fa.format = {
  "capability": {
    "markdown": {
      "ink": "در Markdown موجود نیست",
      "shapes": "در Markdown موجود نیست"
    },
    "plain": {
      "richFormat": "در متن ساده موجود نیست",
      "codeBlocks": "در متن ساده موجود نیست",
      "math": "در متن ساده موجود نیست",
      "images": "در متن ساده موجود نیست",
      "tables": "در متن ساده موجود نیست",
      "ink": "در متن ساده موجود نیست",
      "shapes": "در متن ساده موجود نیست",
      "insert": "در متن ساده موجود نیست",
      "design": "در متن ساده موجود نیست",
      "layout": "در متن ساده موجود نیست",
      "exportPdf": "در متن ساده موجود نیست"
    },
    "html": {
      "ink": "در HTML موجود نیست",
      "shapes": "در HTML موجود نیست",
      "design": "سبک HTML در منبع زندگی می‌کند",
      "layout": "سبک HTML در منبع زندگی می‌کند"
    },
    "pdf": {
      "editText": "در PDF موجود نیست",
      "richFormat": "در PDF موجود نیست",
      "codeBlocks": "در PDF موجود نیست",
      "math": "در PDF موجود نیست",
      "images": "در PDF موجود نیست",
      "tables": "در PDF موجود نیست",
      "links": "در PDF موجود نیست",
      "insert": "در PDF موجود نیست",
      "design": "در PDF موجود نیست",
      "layout": "در PDF موجود نیست"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete fa.ribbon.ink.color.colorStudio;
delete fa.ribbon.ink.color.colorStudioHint;
delete fa.ribbon.ink.color.current;
delete fa.ribbon.ink.color.hexAriaLabel;
delete fa.ribbon.ink.color.hexHelpInvalid;
delete fa.ribbon.ink.color.hexHelpValid;
delete fa.ribbon.ink.color.hexPlaceholder;
delete fa.ribbon.ink.color.opacity;
delete fa.ribbon.ink.color.pick;
delete fa.ribbon.ink.color.pickHint;
delete fa.ribbon.ink.color.quickInks;
delete fa.ribbon.ink.color.recent;
delete fa.ribbon.ink.color.recentEmpty;
delete fa.ribbon.ink.color.studio;
delete fa.ribbon.ink.draw.addCoordinateGraph;
delete fa.ribbon.ink.draw.brushEngine;
delete fa.ribbon.ink.draw.brushEngineHint;
delete fa.ribbon.ink.draw.clearPage;
delete fa.ribbon.ink.draw.clearPageHint;
delete fa.ribbon.ink.draw.coordinateGraph;
delete fa.ribbon.ink.draw.coordinateGraphHint;
delete fa.ribbon.ink.draw.drawMode;
delete fa.ribbon.ink.draw.drawModeHint;
delete fa.ribbon.ink.draw.eraseMode;
delete fa.ribbon.ink.draw.eraseModeHint;
delete fa.ribbon.ink.draw.erasePrecision;
delete fa.ribbon.ink.draw.erasePrecisionHint;
delete fa.ribbon.ink.draw.eraseStroke;
delete fa.ribbon.ink.draw.eraseStrokeHint;
delete fa.ribbon.ink.draw.eraserLarge;
delete fa.ribbon.ink.draw.eraserMedium;
delete fa.ribbon.ink.draw.eraserRadius;
delete fa.ribbon.ink.draw.eraserSmall;
delete fa.ribbon.ink.draw.eyedropperMode;
delete fa.ribbon.ink.draw.eyedropperModeHint;
delete fa.ribbon.ink.draw.favPenEmpty;
delete fa.ribbon.ink.draw.favouritePens;
delete fa.ribbon.ink.draw.fit;
delete fa.ribbon.ink.draw.fitHint;
delete fa.ribbon.ink.draw.history;
delete fa.ribbon.ink.draw.insertSpaceMode;
delete fa.ribbon.ink.draw.insertSpaceModeHint;
delete fa.ribbon.ink.draw.insertSpaceToast;
delete fa.ribbon.ink.draw.lassoMode;
delete fa.ribbon.ink.draw.lassoModeHint;
delete fa.ribbon.ink.draw.mode;
delete fa.ribbon.ink.draw.panMode;
delete fa.ribbon.ink.draw.panModeHint;
delete fa.ribbon.ink.draw.pens;
delete fa.ribbon.ink.draw.redo;
delete fa.ribbon.ink.draw.redoHint;
delete fa.ribbon.ink.draw.selectMode;
delete fa.ribbon.ink.draw.selectModeHint;
delete fa.ribbon.ink.draw.shapeMode;
delete fa.ribbon.ink.draw.shapeModeHint;
delete fa.ribbon.ink.draw.shapes;
delete fa.ribbon.ink.draw.stroke;
delete fa.ribbon.ink.draw.strokeOpacity;
delete fa.ribbon.ink.draw.strokeWidth;
delete fa.ribbon.ink.draw.undo;
delete fa.ribbon.ink.draw.undoHint;
delete fa.ribbon.ink.draw.view;
delete fa.ribbon.ink.draw.zoomIn;
delete fa.ribbon.ink.draw.zoomOut;
delete fa.ribbon.ink.tab.about;
delete fa.ribbon.ink.tab.aboutText;
delete fa.ribbon.ink.tab.noUnattachedPages;
delete fa.ribbon.ink.tab.subtabAudio;
delete fa.ribbon.ink.tab.subtabColor;
delete fa.ribbon.ink.tab.subtabDraw;
delete fa.ribbon.ink.tab.subtabPaper;
delete fa.ribbon.ink.tab.subtabSelect;
delete fa.ribbon.ink.tab.subtabSmart;
delete fa.ribbon.view.pageDisplay;
delete fa.wordGoal.wordGoal;
delete fa.wordGoal.targetWords;
delete fa.wordGoal.setGoal;
delete fa.wordGoal.updateGoal;
delete fa.wordGoal.editGoal;
delete fa.wordGoal.clearGoal;
delete fa.macros;
delete fa.macrosHint;
delete fa.lang.fa;
delete fa.lang.ur;
delete fa.vault.shortcuts.cards.heroTitle;
delete fa.vault.shortcuts.cards.newCard;
delete fa.vault.shortcuts.cards.stats;
delete fa.vault.shortcuts.cards.nothingDue;
delete fa.vault.shortcuts.cards.noCards;
delete fa.vault.shortcuts.cards.nextCard;
delete fa.vault.shortcuts.cards.emptyHint;
delete fa.vault.shortcuts.cards.allCards;
delete fa.vault.shortcuts.cards.reps;
delete fa.vault.shortcuts.cards.deleteCard;
delete fa.vault.shortcuts.graph.heroTitle;
delete fa.vault.shortcuts.graph.subtitle;
delete fa.vault.shortcuts.graph.emptyState;
delete fa.vault.shortcuts.graph.backToVault;
delete fa.vault.shortcuts.canvas.heroTitle;
delete fa.vault.shortcuts.canvas.subtitle;
delete fa.vault.shortcuts.canvas.emptyState;
delete fa.vault.shortcuts.canvas.backToCanvases;
delete fa.vault.shortcuts.canvas.cardInspector;
delete fa.vault.shortcuts.canvas.canvasGuide;
delete fa.vault.shortcuts.canvas.guideText1;
delete fa.vault.shortcuts.canvas.guideText2;
delete fa.vault.shortcuts.canvas.stats;
delete fa.vault.shortcuts.canvas.newCardTitle;
delete fa.vault.shortcuts.canvas.addCard;
delete fa.vault.shortcuts.canvas.saving;
delete fa.vault.shortcuts.canvas.saved;
delete fa.vault.shortcuts.canvas.autosaveOn;
delete fa.vault.shortcuts.canvas.canvasName;
delete fa.vault.shortcuts.canvas.status.saving;
delete fa.vault.shortcuts.canvas.status.saved;
delete fa.vault.shortcuts.canvas.status.autosaveOn;
delete fa.vault.shortcuts.tables.heroTitle;
delete fa.vault.shortcuts.tables.subtitle;
delete fa.vault.shortcuts.tables.emptyState;
delete fa.vault.shortcuts.tables.backToTables;
delete fa.vault.shortcuts.tables.viewTable;
delete fa.vault.shortcuts.tables.viewBoard;
delete fa.vault.shortcuts.tables.viewGallery;
delete fa.vault.shortcuts.tables.addColumn;
delete fa.vault.shortcuts.tables.addRow;
delete fa.vault.shortcuts.tables.priorityPlaceholder;
delete fa.vault.shortcuts.tables.typePlaceholder;
delete fa.vault.shortcuts.tables.optionsPlaceholder;
delete fa.vault.shortcuts.tables.tablePickerPlaceholder;
delete fa.vault.shortcuts.tables.addButton;
delete fa.vault.shortcuts.tables.status.saving;
delete fa.vault.shortcuts.tables.status.saved;
delete fa.vault.shortcuts.tables.status.autosaveOn;
delete fa.vault.shortcuts.tables.stats;
delete fa.vault.shortcuts.tables.tableName;
delete fa.vault.shortcuts.tables.columnTypes.text;
delete fa.vault.shortcuts.tables.columnTypes.number;
delete fa.vault.shortcuts.tables.columnTypes.select;
delete fa.vault.shortcuts.tables.columnTypes.date;
delete fa.vault.shortcuts.tables.columnTypes.checkbox;
delete fa.vault.shortcuts.tables.columnTypes.relation;
delete fa.vault.shortcuts.tables.typeBadge.text;
delete fa.vault.shortcuts.tables.typeBadge.number;
delete fa.vault.shortcuts.tables.typeBadge.select;
delete fa.vault.shortcuts.tables.typeBadge.date;
delete fa.vault.shortcuts.tables.typeBadge.checkbox;
delete fa.vault.shortcuts.tables.typeBadge.relation;
delete fa.vault.shortcuts.tables.tableGrid.placeholder;
delete fa.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete fa.vault.shortcuts.tables.tableGrid.renameColumn;
delete fa.vault.shortcuts.tables.tableGrid.deleteColumn;
delete fa.vault.shortcuts.tables.tableGrid.deleteRow;
delete fa.vault.shortcuts.tables.tableGrid.noRows;
delete fa.vault.shortcuts.tables.boardView.needsSelect;
delete fa.vault.shortcuts.tables.boardView.addSelect;
delete fa.vault.shortcuts.tables.boardView.ungrouped;
delete fa.vault.shortcuts.tables.galleryView.noRows;
delete fa.vault.shortcuts.tables.galleryView.addRow;
delete fa.vault.shortcuts.tables.galleryView.checkboxYes;
delete fa.vault.shortcuts.code.heroTitle;
delete fa.vault.shortcuts.code.subtitle;
delete fa.vault.shortcuts.code.emptyState;
delete fa.vault.shortcuts.code.backToCode;
delete fa.vault.shortcuts.code.fileName;
delete fa.vault.shortcuts.code.languagePlaceholder;
delete fa.vault.shortcuts.code.findButton;
delete fa.vault.shortcuts.code.status.saving;
delete fa.vault.shortcuts.code.status.saved;
delete fa.vault.shortcuts.code.status.autosaveOn;
delete fa.vault.shortcuts.queries.heroTitle;
delete fa.vault.shortcuts.queries.description;
delete fa.vault.shortcuts.queries.placeholder;
delete fa.vault.shortcuts.queries.saveButton;
delete fa.vault.shortcuts.queries.resultsLabel;
delete fa.vault.shortcuts.queries.indexing;
delete fa.vault.shortcuts.queries.notesCount;
delete fa.vault.shortcuts.queries.savedQueriesLabel;
delete fa.vault.shortcuts.queries.noSavedQueries;
delete fa.vault.shortcuts.queries.syntaxLabel;
delete fa.vault.shortcuts.extensions.heroTitle;
delete fa.vault.shortcuts.extensions.description;
delete fa.vault.shortcuts.extensions.installedLabel;
delete fa.vault.shortcuts.extensions.activeCount;
delete fa.vault.shortcuts.extensions.cssOverridesLabel;
delete fa.vault.shortcuts.extensions.cssOverridesDesc;
delete fa.vault.shortcuts.extensions.customThemeExample;
delete fa.vault.shortcuts.extensions.applyButton;
delete fa.vault.shortcuts.extensions.resetButton;
delete fa.vault.shortcuts.extensions.appliedStatus;
delete fa.vault.shortcuts.extensions.runtimeLogLabel;
delete fa.vault.shortcuts.extensions.liveStatus;
delete fa.vault.shortcuts.extensions.tabManifestLabel;
delete fa.vault.shortcuts.extensions.tabManifestDesc;
delete fa.vault.shortcuts.trash.heroTitle;
delete fa.vault.shortcuts.trash.description;
delete fa.vault.shortcuts.trash.itemCount;
delete fa.vault.shortcuts.trash.loading;
delete fa.vault.shortcuts.trash.emptyState;
delete fa.vault.shortcuts.trash.emptyDescription;
delete fa.vault.shortcuts.trash.noteSnippet;
delete fa.vault.shortcuts.trash.deletedAgo;
delete fa.vault.shortcuts.trash.expiresToday;
delete fa.vault.shortcuts.trash.daysLeft;
delete fa.vault.shortcuts.trash.restoreButton;
delete fa.vault.shortcuts.trash.toastRestored;
delete fa.vault.shortcuts.trash.deleteForeverDialog.title;
delete fa.vault.shortcuts.trash.deleteForeverDialog.description;
delete fa.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete fa.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete fa.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/fa.json', JSON.stringify(fa, null, 2) + '\n', 'utf8');
console.log('Done!');