import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/hi.json', 'utf8');
const hi = JSON.parse(content);

// Fix hi.json - add top-level "ink" key (matching en.json structure)
hi.ink = {
  "groups": {
    "draw": "ड्राइंग",
    "color": "रंग",
    "history": "इतिहास",
    "view": "दृश्य",
    "more": "अधिक"
  },
  "more": {
    "label": "अधिक",
    "hint": "कम उपयोग किए जाने वाले उपकरण",
    "modes": "मोड",
    "eraser": "इरेज़र सेटिंग्स",
    "brushEngine": "ब्रश इंजन",
    "brushEngineHint": "पेन व्यवहार, इरेज़र इंजन, आकार और रूलर सहायता",
    "shapes": "आकार",
    "coordinateGraph": "निर्देशांक ग्राफ",
    "paper": "कागज",
    "paperStudio": "पेपर स्टूडियो",
    "smartInk": "स्मार्ट इंक",
    "handwriting": "हस्तलेखन पहचान",
    "equation": "समीकरण",
    "resultsSearch": "परिणाम और खोज",
    "audio": "ऑडियो",
    "record": "रिकॉर्ड",
    "stop": "रोकें",
    "play": "चलाएं",
    "pause": "रोकें",
    "replayInk": "इंक रीप्ले",
    "removeAudio": "ऑडियो हटाएं",
    "overlay": "ओवरले",
    "fullPage": "पूरा पेज",
    "inkOverText": "टेक्स्ट पर इंक",
    "destructive": "विनाशकारी",
    "removeInk": "इंक हटाएं",
    "attachOld": "पुराना पेज जोड़ें",
    "disabled": "पहले लासो से स्ट्रोक चुनें"
  },
  "draw": {
    "pen": "पेन",
    "penHint": "पेन चुनें",
    "eraser": "इरेज़र",
    "eraserHint": "स्ट्रोक मिटाएं",
    "lasso": "लासो",
    "lassoHint": "घेरकर स्ट्रोक चुनें",
    "width": "चौड़ाई",
    "saveFavPen": "वर्तमान पेन को पसंदीदा के रूप में सहेजें",
    "removeFavPen": "पसंदीदा पेन हटाएं",
    "noFavPens": "अपने पसंदीदा पेन सेटअप यहां सहेजें (अधिकतम 8)"
  },
  "color": {
    "picker": "रंग",
    "pickerHint": "कलर मिक्सर, पैलेट, इतिहास खोलें"
  },
  "mode": {
    "select": "चुनें",
    "shape": "आकार",
    "pan": "पैन",
    "pick": "पिक",
    "insertSpace": "स्पेस डालें"
  },
  "groups": {
    "draw": "ड्राइंग",
    "color": "रंग",
    "history": "इतिहास",
    "view": "दृश्य",
    "more": "अधिक",
    "select": "चुनें",
    "object": "ऑब्जेक्ट",
    "strokes": "स्ट्रोक",
    "transform": "ट्रांसफॉर्म",
    "template": "टेम्पलेट",
    "pageSize": "पेज आकार",
    "pages": "पेज",
    "paperStudio": "पेपर स्टूडियो",
    "recognise": "पहचानें",
    "results": "परिणाम",
    "record": "रिकॉर्ड",
    "playback": "प्लेबैक",
    "manage": "प्रबंधित करें"
  },
  "history": {
    "undo": "पूर्ववत करें",
    "undoHint": "अंतिम स्ट्रोक को पूर्ववत करें",
    "redo": "फिर से करें",
    "redoHint": "फिर से करें"
  },
  "view": {
    "zoomOut": "ज़ूम आउट",
    "zoomIn": "ज़ूम इन",
    "fit": "फिट",
    "fitHint": "पेज को इंक में फिट करें"
  },
  "select": {
    "select": "चुनें",
    "selectHint": "ऑब्जेक्ट चुनें, ले जाएं, आकार बदलें, घुमाएं",
    "lasso": "लासो",
    "lassoHint": "घेरकर स्ट्रोक चुनें"
  },
  "object": {
    "delete": "हटाएं",
    "deleteHint": "चुने गए ऑब्जेक्ट को हटाएं",
    "front": "सामने",
    "frontHint": "सामने लाएं",
    "back": "पीछे",
    "backHint": "पीछे भेजें"
  },
  "strokes": {
    "apply": "लागू करें",
    "applyHint": "चाल, स्केल या रोटेशन की पुष्टि करें",
    "recolor": "पुनः रंगें",
    "recolorHint": "चयन को वर्तमान इंक से पुनः रंगें",
    "delete": "हटाएं",
    "deleteHint": "चुने गए स्ट्रोक हटाएं",
    "deselect": "चयन हटाएं",
    "deselectHint": "चयन साफ़ करें"
  },
  "transform": {
    "studio": "चयन स्टूडियो",
    "studioHint": "चयन को सटीक रूप से ले जाएं, स्केल करें, घुमाएं",
    "disabled": "पहले लासो से स्ट्रोक चुनें"
  },
  "paper": {
    "template": "पेपर टेम्पलेट",
    "tone": "पेपर टोन",
    "size": "पेज आकार",
    "studio": "पेपर स्टूडियो",
    "studioHint": "एक ही स्थान पर सभी पेपर विकल्प",
    "clear": "पेज साफ़ करें",
    "clearHint": "इस पेज पर सभी स्ट्रोक हटाएं"
  },
  "pages": {
    "prev": "पिछला पेज",
    "next": "अगला पेज",
    "page": "पेज {num}"
  },
  "smart": {
    "handwriting": "हस्तलेखन पहचान",
    "handwritingHint": "लासो चयन या दृश्य में पेज को टेक्स्ट में बदलें",
    "equation": "समीकरण",
    "equationHint": "हस्तलिखित गणित को LaTeX में बदलें",
    "results": "परिणाम और खोज",
    "resultsHint": "पहचाना गया टेक्स्ट, पेज पर डालें, सभी हस्तलेख खोजें"
  },
  "audio": {
    "record": "रिकॉर्ड",
    "recordHint": "लिखते समय ऑडियो रिकॉर्ड करें; हर स्ट्रोक टाइम-स्टैम्प्ड",
    "stop": "रोकें",
    "play": "चलाएं",
    "playHint": "रिकॉर्डिंग चलाएं और लिखने की प्रक्रिया में पेज को फिर से ड्रा करें",
    "pause": "रोकें",
    "replayInk": "इंक रीप्ले",
    "replayInkHint": "ध्वनि के बिना स्ट्रोक दोहराएं",
    "noRecording": "कोई रिकॉर्डिंग नहीं",
    "studio": "ऑडियो स्टूडियो",
    "studioHint": "रिकॉर्डिंग के माध्यम से स्क्रब करें",
    "remove": "ऑडियो हटाएं",
    "removeHint": "इस पेज से रिकॉर्डिंग हटाएं",
    "recording": "रिकॉर्डिंग…"
  },
  "overlay": {
    "fullPage": "पूरा पेज",
    "inkOverText": "टेक्स्ट पर इंक",
    "fullPageHint": "फुल-पेज इंक सरफेस पर स्विच करें",
    "inkOverTextHint": "रीड व्यू में नोट टेक्स्ट पर इंक दिखाएं"
  },
  "tab": {
    "handwriting": "हस्तलेखन",
    "startInking": "इंकिंग शुरू करें",
    "startInkingHint": "इस नोट में हस्तलेखन पेज जोड़ें",
    "attachOldPage": "पुराना पेज जोड़ें",
    "attachOldPageHint": "Ink के नोट्स के अंदर जाने से पहले का हस्तलेखन पेज लाएं",
    "noAttachable": "कोई अनअटैच्ड इंक पेज नहीं।",
    "ink": "स्याही",
    "overlay": "ओवरले",
    "handwritingPage": "हस्तलेखन पेज",
    "marks": "{count} निशान",
    "saving": "सहेजा जा रहा है...",
    "saved": "सहेजा गया",
    "autosave": "ऑटोसेव चालू",
    "attachOld": "पुराना पेज जोड़ें",
    "attachOldHint": "पहले बनाया गया हस्तलेखन पेज इस नोट से जोड़ें",
    "statusSaving": "सहेजा जा रहा है…",
    "statusSaved": "सहेजा गया",
    "statusAutosave": "ऑटोसेव चालू",
    "removeInk": "स्याही हटाएं",
    "removeInkHint": "इस नोट में सभी हस्तलेखन हटाएं"
  }
};

// Fix ribbon.ink to match en.json structure
hi.ribbon.ink = {
  "draw": {
    "mode": "मोड",
    "pens": "पेन",
    "favouritePens": "पसंदीदा पेन",
    "stroke": "स्ट्रोक",
    "eraser": "इरेज़र",
    "history": "इतिहास",
    "view": "दृश्य",
    "shapes": "आकार",
    "drawMode": "ड्रा",
    "drawModeHint": "वर्तमान पेन से ड्रा करें",
    "shapeMode": "आकार",
    "shapeModeHint": "रेखाएं, बॉक्स, सर्कल और कोऑर्डिनेट ग्राफ ड्रा करें",
    "selectMode": "चुनें",
    "selectModeHint": "ऑब्जेक्ट चुनें, ले जाएं, आकार बदलें, घुमाएं",
    "lassoMode": "लासो",
    "lassoModeHint": "घेरकर स्ट्रोक चुनें",
    "eraseMode": "इरेज़र",
    "eraseModeHint": "स्ट्रोक मिटाएं",
    "panMode": "पैन",
    "panModeHint": "पेज घुमाएं",
    "eyedropperMode": "पिक",
    "eyedropperModeHint": "पेज से रंग चुनें",
    "insertSpaceMode": "स्पेस डालें",
    "insertSpaceModeHint": "इंक मार्क्स के बीच वर्टिकल स्पेस डालने या हटाने के लिए खींचें",
    "brushEngine": "ब्रश इंजन",
    "brushEngineHint": "पेन व्यवहार, इरेज़र इंजन, आकार और रूलर सहायता",
    "eraseStroke": "स्ट्रोक",
    "eraseStrokeHint": "पूरे स्ट्रोक मिटाएं",
    "erasePrecision": "पॉइंट",
    "erasePrecisionHint": "सटीक इरेज़र",
    "eraserSmall": "छोटा इरेज़र (12px)",
    "eraserMedium": "मीडियम इरेज़र (26px)",
    "eraserLarge": "बड़ा इरेज़र (50px)",
    "eraserRadius": "त्रिज्या",
    "undo": "पूर्ववत करें",
    "undoHint": "अंतिम स्ट्रोक को पूर्ववत करें",
    "redo": "फिर से करें",
    "redoHint": "फिर से करें",
    "zoomOut": "ज़ूम आउट",
    "zoomIn": "ज़ूम इन",
    "fit": "फिट",
    "fitHint": "पेज को इंक में फिट करें",
    "clearPage": "पेज साफ़ करें",
    "clearPageHint": "इस पेज पर सभी मार्क हटाएं",
    "coordinateGraph": "कोऑर्डिनेट ग्राफ",
    "coordinateGraphHint": "एक्सिस, ग्रिड और टिक मार्क्स के साथ कोऑर्डिनेट ग्राफ डालें",
    "addCoordinateGraph": "कोऑर्डिनेट ग्राफ जोड़ें",
    "insertSpaceToast": "टेक्स्ट नहीं हिलता। लाइन के नीचे इंक उस टेक्स्ट से दूर चली जाती है जिस पर वह लिखी गई थी।",
    "snapShapes": "आकार स्नैप",
    "snapShapesHint": "फ्रीहैंड स्ट्रोक को स्वचालित रूप से ज्यामितीय आकार में बदलें",
    "comingSoon": "जल्द आ रहा है",
    "saveFavPen": "वर्तमान पेन को पसंदीदा के रूप में सहेजें",
    "removeFavPen": "पसंदीदा पेन हटाएं",
    "favPenEmpty": "अपने पसंदीदा पेन सेटअप यहां सहेजें (अधिकतम 8)",
    "strokeWidth": "चौड़ाई",
    "strokeOpacity": "अपारदर्शिता"
  },
  "color": {
    "current": "वर्तमान",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "हेक्स रंग",
    "hexHelpValid": "3 या 6 अंकों का हेक्स, # के साथ या बिना",
    "hexHelpInvalid": "अमान्य हेक्स — वापस जाने के लिए एस्केप दबाएं",
    "quickInks": "क्विक इंक",
    "recent": "हालिया",
    "recentEmpty": "आपके उपयोग के रंग यहां दिखाई देते हैं",
    "studio": "स्टूडियो",
    "colorStudio": "कलर स्टूडियो",
    "colorStudioHint": "मिक्सर, पैलेट, अपारदर्शिता और कस्टम रंग",
    "pick": "चुनें",
    "pickHint": "पेज से रंग चुनें",
    "opacity": "अपारदर्शिता"
  },
  "select": {
    "select": "चुनें",
    "selectHint": "ऑब्जेक्ट चुनें, ले जाएं, आकार बदलें, घुमाएं",
    "lasso": "लासो",
    "lassoHint": "घेरकर स्ट्रोक चुनें",
    "selectionInfo": "ऑब्जेक्ट: {type}",
    "strokesSelected": "{count} स्ट्रोक",
    "nothingSelected": "कुछ भी नहीं चुना गया",
    "apply": "लागू करें",
    "applyHint": "चाल, स्केल या रोटेशन की पुष्टि करें",
    "recolor": "पुनः रंगें",
    "recolorHint": "चयन को वर्तमान इंक से पुनः रंगें",
    "delete": "हटाएं",
    "deleteHint": "चुने गए स्ट्रोक हटाएं",
    "deselect": "चयन हटाएं",
    "deselectHint": "चयन साफ़ करें",
    "transform": "ट्रांसफॉर्म",
    "selectionStudio": "चयन स्टूडियो",
    "selectionStudioHint": "चयन को सटीक रूप से ले जाएं, स्केल करें, घुमाएं",
    "selectFirst": "पहले लासो से स्ट्रोक चुनें",
    "selectObjectFirst": "चयन टूल से ऑब्जेक्ट चुनें"
  },
  "paper": {
    "template": "टेम्पलेट",
    "paperTemplate": "पेपर टेम्पलेट",
    "paperTone": "पेपर टोन",
    "pageSize": "पेज आकार",
    "pages": "पेज",
    "previousPage": "पिछला पेज",
    "nextPage": "अगला पेज",
    "pageNumber": "पेज {num}",
    "studio": "स्टूडियो",
    "paperStudio": "पेपर स्टूडियो",
    "paperStudioHint": "सभी पेपर विकल्प एक ही स्थान पर",
    "clearPage": "पेज साफ़ करें",
    "clearPageHint": "इस पेज पर सभी मार्क हटाएं"
  },
  "frames": {
    "template": "टेम्पलेट",
    "paperTemplate": "पेपर टेम्पलेट",
    "paperTone": "पेपर टोन",
    "pageSize": "पेज आकार",
    "pages": "पेज",
    "previousPage": "पिछला पेज",
    "nextPage": "अगला पेज",
    "pageNumber": "पेज {num}",
    "studio": "स्टूडियो",
    "paperStudio": "पेपर स्टूडियो",
    "paperStudioHint": "सभी पेपर विकल्प एक ही स्थान पर",
    "coordinateGraph": "कोऑर्डिनेट ग्राफ",
    "coordinateGraphHint": "एक्सिस, ग्रिड और टिक मार्क्स के साथ कोऑर्डिनेट ग्राफ डालें",
    "addCoordinateGraph": "कोऑर्डिनेट ग्राफ जोड़ें",
    "clearPage": "पेज साफ़ करें",
    "clearPageHint": "इस पेज पर सभी मार्क हटाएं"
  },
  "objects": {
    "select": "चुनें",
    "selectHint": "ऑब्जेक्ट चुनें, ले जाएं, आकार बदलें, घुमाएं",
    "lasso": "लासो",
    "lassoHint": "घेरकर स्ट्रोक चुनें",
    "shapes": "आकार",
    "shapesHint": "आयत, सर्कल, रेखाएं, तीर और बहुभुज डालें",
    "stickers": "स्टिकर",
    "stickersHint": "सजावटी स्टिकर डालें",
    "textbox": "टेक्स्ट बॉक्स",
    "textboxHint": "टेक्स्ट बॉक्स डालें",
    "sticky": "स्टिकी नोट",
    "stickyHint": "स्टिकी नोट डालें",
    "selectionInfo": "ऑब्जेक्ट: {type}",
    "strokesSelected": "{count} स्ट्रोक",
    "nothingSelected": "कुछ भी नहीं चुना गया",
    "apply": "लागू करें",
    "applyHint": "चाल, स्केल या रोटेशन की पुष्टि करें",
    "recolor": "पुनः रंगें",
    "recolorHint": "चयन को वर्तमान इंक से पुनः रंगें",
    "delete": "हटाएं",
    "deleteHint": "चुने गए ऑब्जेक्ट हटाएं",
    "deselect": "चयन हटाएं",
    "deselectHint": "चयन साफ़ करें",
    "transform": "ट्रांसफॉर्म",
    "selectionStudio": "चयन स्टूडियो",
    "selectionStudioHint": "चयन को सटीक रूप से ले जाएं, स्केल करें, घुमाएं",
    "selectFirst": "पहले लासो से स्ट्रोक चुनें",
    "selectObjectFirst": "चयन टूल से ऑब्जेक्ट चुनें"
  },
  "smart": {
    "recognise": "पहचानें",
    "handwriting": "हस्तलेखन पहचान",
    "handwritingHint": "लासो चयन या दृश्य में पेज को टेक्स्ट में बदलें",
    "equation": "समीकरण",
    "equationHint": "हस्तलिखित गणित को LaTeX में बदलें",
    "resultsAndSearch": "परिणाम और खोज",
    "resultsSearch": "परिणाम और खोज",
    "resultsSearchHint": "पहचाना गया टेक्स्ट, पेज पर डालें, सभी हस्तलेख खोजें"
  },
  "audio": {
    "record": "रिकॉर्ड",
    "recordLabel": "लिखते समय ऑडियो रिकॉर्ड करें; हर स्ट्रोक टाइम-स्टैम्प्ड",
    "stop": "रोकें",
    "stopLabel": "रिकॉर्डिंग रोकें",
    "playback": "प्लेबैक",
    "play": "चलाएं",
    "playHint": "रिकॉर्डिंग चलाएं और लिखने की प्रक्रिया में पेज को फिर से ड्रा करें",
    "pause": "रोकें",
    "replayInk": "इंक रीप्ले",
    "replayInkHint": "ध्वनि के बिना स्ट्रोक दोहराएं",
    "noRecording": "कोई रिकॉर्डिंग नहीं",
    "manage": "प्रबंधित करें",
    "audioStudio": "ऑडियो स्टूडियो",
    "audioStudioHint": "रिकॉर्डिंग के माध्यम से स्क्रब करें",
    "removeAudio": "ऑडियो हटाएं",
    "removeAudioHint": "इस पेज से रिकॉर्डिंग हटाएं",
    "recordFirst": "पहले कुछ ऑडियो रिकॉर्ड करें"
  },
  "tab": {
    "ink": "स्याही",
    "handwriting": "हस्तलेखन",
    "startInking": "इंकिंग शुरू करें",
    "startInkingHint": "इस नोट में हस्तलेखन पेज जोड़ें",
    "attachOldPage": "पुराना पेज जोड़ें",
    "attachOldPageHint": "Ink के नोट्स के अंदर जाने से पहले का हस्तलेखन पेज लाएं",
    "noUnattachedPages": "कोई अनअटैच्ड इंक पेज नहीं।",
    "about": "के बारे में",
    "aboutText": "हर नोट अपना हस्तलेखन पेज रख सकता है। पेन, रंग, चयन, पेपर, स्मार्ट इंक और ऑडियो यहां दिखाई देते हैं जब आप शुरू करते हैं।",
    "subtabDraw": "ड्रा",
    "subtabFrames": "फ्रेम",
    "subtabObjects": "ऑब्जेक्ट",
    "subtabView": "दृश्य",
    "subtabColor": "रंग",
    "subtabSelect": "चुनें",
    "subtabPaper": "पेपर",
    "subtabSmart": "स्मार्ट इंक",
    "subtabAudio": "ऑडियो",
    "overlay": "ओवरले",
    "fullPage": "पूरा पेज",
    "inkOverText": "टेक्स्ट पर इंक",
    "fullPageHint": "फुल-पेज इंक सर्फेस पर स्विच करें",
    "inkOverTextHint": "रीड व्यू में नोट टेक्स्ट पर इंक दिखाएं",
    "marks": "{count} निशान",
    "statusSaving": "बचत हो रही है…",
    "statusSaved": "बचाया गया",
    "statusAutosave": "ऑटोसेव ऑन",
    "removeInk": "स्याही हटाएं",
    "removeInkHint": "इस नोट में सभी हस्तलेखन हटाएं"
  },
  "eraserModes": {
    "stroke": "स्ट्रोक",
    "precision": "सटीकता"
  },
  "groups": {
    "draw": "ड्राइंग",
    "frames": "फ्रेम",
    "objects": "ऑब्जेक्ट",
    "view": "दृश्य",
    "more": "अधिक"
  },
  "more": {
    "label": "अधिक",
    "hint": "शायद ही उपयोग किए जाने वाले उपकरण",
    "modes": "मोड",
    "eraser": "इरेज़र सेटिंग्स",
    "brushEngine": "ब्रश इंजन",
    "brushEngineHint": "पेन व्यवहार, इरेज़र इंजन, आकार और रूलर सहायता",
    "shapes": "आकार",
    "coordinateGraph": "निर्देशांक ग्राफ",
    "paper": "कागज",
    "paperStudio": "पेपर स्टूडियो",
    "smartInk": "स्मार्ट इंक",
    "handwriting": "हस्तलेखन पहचान",
    "equation": "समीकरण",
    "resultsSearch": "परिणाम और खोज",
    "audio": "ऑडियो",
    "record": "रिकॉर्ड",
    "stop": "रोकें",
    "play": "चलाएं",
    "pause": "रोकें",
    "replayInk": "इंक रीप्ले",
    "removeAudio": "ऑडियो हटाएं",
    "overlay": "ओवरले",
    "fullPage": "पूरा पेज",
    "inkOverText": "टेक्स्ट पर इंक",
    "destructive": "विनाशकारी",
    "removeInk": "इंक हटाएं",
    "attachOld": "पुराना पेज जोड़ें",
    "disabled": "पहले लासो से स्ट्रोक चुनें"
  },
  "draw": {
    "pen": "पेन",
    "penHint": "पेन चुनें",
    "eraser": "इरेज़र",
    "eraserHint": "स्ट्रोक मिटाएं",
    "lasso": "लासो",
    "lassoHint": "स्ट्रोक को घेरकर चुनें",
    "width": "चौड़ाई",
    "saveFavPen": "वर्तमान पेन को पसंदीदा के रूप में सहेजें",
    "removeFavPen": "पसंदीदा पेन हटाएं",
    "noFavPens": "अपने पसंदीदा पेन सेटअप यहां सहेजें (अधिकतम 8)"
  },
  "color": {
    "picker": "रंग",
    "pickerHint": "कलर मिक्सर, पैलेट, इतिहास खोलें"
  },
  "tab": {
    "handwriting": "हस्तलेखन",
    "startInking": "इंकिंग शुरू करें",
    "startInkingHint": "इस नोट में हस्तलेखन पेज जोड़ें",
    "attachOldPage": "पुराना पेज जोड़ें",
    "attachOldPageHint": "Ink के नोट्स के अंदर जाने से पहले का हस्तलेखन पेज लाएं",
    "noAttachable": "कोई अनअटैच्ड इंक पेज नहीं।",
    "ink": "स्याही",
    "overlay": "ओवरले",
    "fullPage": "पूरा पेज",
    "inkOverText": "टेक्स्ट पर इंक",
    "fullPageHint": "फुल-पेज इंक सरफेस पर स्विच करें",
    "inkOverTextHint": "रीड व्यू में नोट टेक्स्ट पर इंक दिखाएं",
    "handwritingPage": "हस्तलेखन पेज",
    "marks": "{count} मार्क्स",
    "statusSaving": "बचत हो रही है…",
    "statusSaved": "बचाया गया",
    "statusAutosave": "ऑटोसेव ऑन",
    "removeInk": "स्याही हटाएं",
    "removeInkHint": "इस नोट में सभी हस्तलेखन हटाएं"
  }
};

// Add missing ribbon.view keys
hi.ribbon.view = {
  ...hi.ribbon.view,
  "navigation": "नेविगेशन",
  "pageWidth": "पेज चौड़ाई",
  "onePage": "एक पेज",
  "twoPages": "दो पेज",
  "pageScroll": "पेज स्क्रोल",
  "narrow": "संकीर्ण",
  "medium": "मध्यम",
  "wide": "चौड़ा",
  "full": "पूर्ण",
  "attachTable": "टेबल अटैच",
  "importPdf": "PDF आयात",
  "importPdfHint": "PDF फाइल को नई नोट के रूप में आयात करें",
  "importPdfPrompt": "इस PDF को नई नोट के रूप में आयात करें?",
  "pdfImported": "PDF नोट के रूप में आयातित",
  "pdfImportError": "PDF आयात करने में विफल",
  "prevPage": "पिछला पेज",
  "nextPage": "अगला पेज",
  "page": "पेज {current} / {total}",
  "resetZoom": "ज़ूम रीसेट",
  "print": "प्रिंट",
  "download": "डाउनलोड",
  "loadingPdf": "PDF लोड हो रहा है…",
  "pdfLoadError": "PDF लोड करने में विफल",
  "noPdf": "कोई PDF लोड नहीं हुआ",
  "editorA11y": "संपादक और एक्सेसिबिलिटी",
  "annotate": {
    "enter": "एनोटेट",
    "enterHint": "इस PDF पेज पर ड्रा करें",
    "exit": "एनोटेट से बाहर निकलें",
    "exitHint": "ड्राइंग बंद करें और व्यू पर लौटें",
    "save": "PDF में सेव करें",
    "saveHint": "एनोटेशन को PDF फाइल में सेव करें",
    "saved": "एनोटेशन PDF में सेव हो गए",
    "export": "PDF एक्सपोर्ट",
    "exportHint": "एडिटेबल या फ्लैट एनोटेशन के साथ कॉपी डाउनलोड करें",
    "exportAnnotated": "एनोटेटेड एक्सपोर्ट",
    "exportAnnotatedHint": "एनोटेशन के साथ डाउनलोड (पुनः खोलने पर एडिटेबल)",
    "exportFlattened": "फ्लैट एक्सपोर्ट",
    "exportFlattenedHint": "एनोटेशन बेक्ड इन के साथ डाउनलोड (नॉन-एडिटेबल)",
    "exported": "एक्सपोर्टेड PDF",
    "exportedFlattened": "एक्सपोर्टेड फ्लैटन्ड PDF"
  }
};

// Add missing ribbon.insert keys
hi.ribbon.insert = {
  ...hi.ribbon.insert,
  "mathBlock": "मैथ ब्लॉक",
  "mathBlockHint": "मैथ ब्लॉक डालें ($$ … $$)",
  "htmlMath": "मैथ (KaTeX)",
  "htmlMathHint": "लोकल CSS रेफरेंस के साथ रेंडर्ड KaTeX मैथ मार्कअप डालें (केवल HTML फॉर्मेट)"
};

// Add missing fileMenu keys
hi.fileMenu = {
  ...hi.fileMenu,
  "printExport": {
    ...hi.fileMenu.printExport,
    "htmlEmbedded": "सिंगल फाइल (इमेज एंबेडेड)",
    "openAsCanvas": "कैनवास के रूप में खोलें",
    "openAsCanvasHint": "इस नोट के कंटेंट से A4 फ्रेम का कैनवास बनाएं",
    "canvasCreated": "कैनवास बनाया गया: {name}"
  },
  "migration": {
    "title": "नोट फॉर्मेट माइग्रेशन",
    "message": "LemonNote का यह संस्करण नोट फॉर्मेट को सरल बनाता है। YAML, XML, JSON, TOML, CSV, INI, CSS, JavaScript, TypeScript, Python, Rust, Bash, और SQL फॉर्मेट की नोट्स को फेंस्ड कोड ब्लॉक के साथ Markdown में बदल दिया जाएगा, उनके सटीक कंटेंट को संरक्षित करते हुए।",
    "backupTitle": "माइग्रेशन से पहले बैकअप बनाएं",
    "backupMessage": "माइग्रेशन चलने से पहले, आपके वॉल्ट का पूरा बैकअप बनाया जाएगा। यह दृढ़ता से अनुशंसित है ताकि अगर कुछ गलत हो जाए तो आप रिस्टोर कर सकें।",
    "backupButton": "बैकअप बनाएं और माइग्रेट करें",
    "skipButton": "बैकअप छोड़ें (अनुशंसित नहीं)",
    "backupSuccess": "बैकअप सफलतापूर्वक बनाया गया। माइग्रेशन शुरू हो रहा है…",
    "backupFailed": "बैकअप विफल: {error}। आपके डेटा की सुरक्षा के लिए माइग्रेशन रोक दिया गया।",
    "migrationComplete": "माइग्रेशन पूरा। {count} नोट(एस) कन्वर्ट हुए।",
    "migrationFailed": "माइग्रेशन विफल: {error}"
  }
};

// Add missing backup keys
hi.backup = {
  ...hi.backup,
  "exportSuccess": "बैकअप सफलतापूर्वक एक्सपोर्ट किया गया।",
  "largeWarning": "बड़ा बैकअप फाइल — विभाजित करने या बाहरी स्टोरेज का उपयोग करने पर विचार करें।",
  "exportFailed": "बैकअप एक्सपोर्ट करने में विफल।",
  "readFailed": "बैकअप फाइल पढ़ने में विफल।",
  "importFailed": "बैकअप इम्पोर्ट करने में विफल।",
  "previewFailed": "इम्पोर्ट प्रीव्यू विफल।",
  "selectFilesAgain": "कृपया फाइलें फिर से चुनें।",
  "selectFolderAgain": "कृपया फोल्डर फिर से चुनें।",
  "inFile": "फाइल में",
  "willImport": "इम्पोर्ट होगा",
  "replaceWarning": "यह वॉल्ट में सभी मौजूदा डेटा को बदल देगा।",
  "attachmentsWarning": "बैकअप में अटैचमेंट हैं ({size})। इम्पोर्ट में समय लग सकता है।",
  "confirmFolderImport": "फोल्डर इम्पोर्ट की पुष्टि करें",
  "confirmFileImport": "फाइल इम्पोर्ट की पुष्टि करें",
  "filesFound": "फाइलें मिलीं",
  "notesToImport": "इम्पोर्ट होने वाले नोट्स",
  "duplicatesFound": "डुप्लिकेट मिले",
  "duplicateAction": "डुप्लिकेट पर कार्रवाई",
  "andMore": "+{count} और",
  "preserveFolders": "फोल्डर संरचना बनाए रखें",
  "wholeVault": "पूरा वॉल्ट",
  "exportBackup": "बैकअप एक्सपोर्ट",
  "importBackup": "बैकअप इम्पोर्ट",
  "importFiles": "मार्कडाउन फाइलें इम्पोर्ट करें",
  "importMarkdown": "मार्कडाउन / टेक्स्ट फाइलें इम्पोर्ट करें",
  "importMarkdownDesc": ".md, .markdown, या .txt फाइलें चुनें नोट्स के रूप में इम्पोर्ट करने के लिए।",
  "importFilesBtn": "फाइलें चुनें",
  "importFolderBtn": "फोल्डर चुनें",
  "onImport": "इम्पोर्ट पर",
  "keepExisting": "मौजूदा रखें",
  "replaceEverything": "सब कुछ बदलें",
  "confirmImport": "इम्पोर्ट की पुष्टि करें"
};

// Add missing vault.canvas keys
hi.vault = {
  ...hi.vault,
  "canvas": {
    ...hi.vault.canvas,
    "addFrame": "फ्रेम जोड़ें",
    "fitToPage": "पेज में फिट",
    "fitToWidth": "चौड़ाई में फिट",
    "zoomOut": "ज़ूम आउट",
    "zoomIn": "ज़ूम इन",
    "resetView": "व्यू रीसेट",
    "export": "एक्सपोर्ट",
    "import": "इम्पोर्ट",
    "exportTooltip": ".lemoncanvas के रूप में एक्सपोर्ट",
    "importTooltip": ".lemoncanvas फाइल इम्पोर्ट",
    "importSuccess": "कैनवास सफलतापूर्वक इम्पोर्ट किया गया",
    "exportPdf": "PDF के रूप में एक्सपोर्ट",
    "exportPng": "PNG के रूप में एक्सपोर्ट",
    "exportWholeCanvas": "पूरा कैनवास",
    "exportSelectedFrame": "चुना गया फ्रेम",
    "exportPdfTooltip": "कैनवास को PDF में एक्सपोर्ट",
    "exportPngTooltip": "कैनवास को PNG में एक्सपोर्ट",
    "selectFrameFirst": "पहले फ्रेम चुनें इसे व्यक्तिगत रूप से एक्सपोर्ट करने के लिए",
    "newDesign": "नया डिजाइन",
    "modeDesign": "डिजाइन",
    "kindDesign": "डिजाइन",
    "frameTypes": {
      "a4": "A4 पोर्ट्रेट",
      "a4-landscape": "A4 लैंडस्केप",
      "letter": "लेटर",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "वर्ग",
      "free": "मुक्त"
    },
    "textFrame": {
      "locked": "इस पर इंक खींचे जाने के कारण टेक्स्ट लॉक है",
      "unlock": "अनलॉक",
      "unlockWarning": "अनलॉक करने से एडिटिंग की अनुमति मिलेगी, लेकिन इंक स्ट्रोक टेक्स्ट कंटेंट से मेल नहीं खा सकते।"
    }
  }
};

// Add format capability
hi.format = {
  "capability": {
    "markdown": {
      "ink": "मार्कडाउन में उपलब्ध नहीं",
      "shapes": "मार्कडाउन में उपलब्ध नहीं"
    },
    "plain": {
      "richFormat": "सादे टेक्स्ट में उपलब्ध नहीं",
      "codeBlocks": "सादे टेक्स्ट में उपलब्ध नहीं",
      "math": "सादे टेक्स्ट में उपलब्ध नहीं",
      "images": "सादे टेक्स्ट में उपलब्ध नहीं",
      "tables": "सादे टेक्स्ट में उपलब्ध नहीं",
      "ink": "सादे टेक्स्ट में उपलब्ध नहीं",
      "shapes": "सादे टेक्स्ट में उपलब्ध नहीं",
      "insert": "सादे टेक्स्ट में उपलब्ध नहीं",
      "design": "सादे टेक्स्ट में उपलब्ध नहीं",
      "layout": "सादे टेक्स्ट में उपलब्ध नहीं",
      "exportPdf": "सादे टेक्स्ट में उपलब्ध नहीं"
    },
    "html": {
      "ink": "HTML में उपलब्ध नहीं",
      "shapes": "HTML में उपलब्ध नहीं",
      "design": "HTML स्टाइलिंग सोर्स में रहती है",
      "layout": "HTML स्टाइलिंग सोर्स में रहती है"
    },
    "pdf": {
      "editText": "PDF में उपलब्ध नहीं",
      "richFormat": "PDF में उपलब्ध नहीं",
      "codeBlocks": "PDF में उपलब्ध नहीं",
      "math": "PDF में उपलब्ध नहीं",
      "images": "PDF में उपलब्ध नहीं",
      "tables": "PDF में उपलब्ध नहीं",
      "links": "PDF में उपलब्ध नहीं",
      "insert": "PDF में उपलब्ध नहीं",
      "design": "PDF में उपलब्ध नहीं",
      "layout": "PDF में उपलब्ध नहीं"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete hi.ribbon.ink.color.colorStudio;
delete hi.ribbon.ink.color.colorStudioHint;
delete hi.ribbon.ink.color.current;
delete hi.ribbon.ink.color.hexAriaLabel;
delete hi.ribbon.ink.color.hexHelpInvalid;
delete hi.ribbon.ink.color.hexHelpValid;
delete hi.ribbon.ink.color.hexPlaceholder;
delete hi.ribbon.ink.color.opacity;
delete hi.ribbon.ink.color.pick;
delete hi.ribbon.ink.color.pickHint;
delete hi.ribbon.ink.color.quickInks;
delete hi.ribbon.ink.color.recent;
delete hi.ribbon.ink.color.recentEmpty;
delete hi.ribbon.ink.color.studio;
delete hi.ribbon.ink.draw.addCoordinateGraph;
delete hi.ribbon.ink.draw.brushEngine;
delete hi.ribbon.ink.draw.brushEngineHint;
delete hi.ribbon.ink.draw.clearPage;
delete hi.ribbon.ink.draw.clearPageHint;
delete hi.ribbon.ink.draw.coordinateGraph;
delete hi.ribbon.ink.draw.coordinateGraphHint;
delete hi.ribbon.ink.draw.drawMode;
delete hi.ribbon.ink.draw.drawModeHint;
delete hi.ribbon.ink.draw.eraseMode;
delete hi.ribbon.ink.draw.eraseModeHint;
delete hi.ribbon.ink.draw.erasePrecision;
delete hi.ribbon.ink.draw.erasePrecisionHint;
delete hi.ribbon.ink.draw.eraseStroke;
delete hi.ribbon.ink.draw.eraseStrokeHint;
delete hi.ribbon.ink.draw.eraserLarge;
delete hi.ribbon.ink.draw.eraserMedium;
delete hi.ribbon.ink.draw.eraserRadius;
delete hi.ribbon.ink.draw.eraserSmall;
delete hi.ribbon.ink.draw.eyedropperMode;
delete hi.ribbon.ink.draw.eyedropperModeHint;
delete hi.ribbon.ink.draw.favPenEmpty;
delete hi.ribbon.ink.draw.favouritePens;
delete hi.ribbon.ink.draw.fit;
delete hi.ribbon.ink.draw.fitHint;
delete hi.ribbon.ink.draw.history;
delete hi.ribbon.ink.draw.insertSpaceMode;
delete hi.ribbon.ink.draw.insertSpaceModeHint;
delete hi.ribbon.ink.draw.insertSpaceToast;
delete hi.ribbon.ink.draw.lassoMode;
delete hi.ribbon.ink.draw.lassoModeHint;
delete hi.ribbon.ink.draw.mode;
delete hi.ribbon.ink.draw.panMode;
delete hi.ribbon.ink.draw.panModeHint;
delete hi.ribbon.ink.draw.pens;
delete hi.ribbon.ink.draw.redo;
delete hi.ribbon.ink.draw.redoHint;
delete hi.ribbon.ink.draw.selectMode;
delete hi.ribbon.ink.draw.selectModeHint;
delete hi.ribbon.ink.draw.shapeMode;
delete hi.ribbon.ink.draw.shapeModeHint;
delete hi.ribbon.ink.draw.shapes;
delete hi.ribbon.ink.draw.stroke;
delete hi.ribbon.ink.draw.strokeOpacity;
delete hi.ribbon.ink.draw.strokeWidth;
delete hi.ribbon.ink.draw.undo;
delete hi.ribbon.ink.draw.undoHint;
delete hi.ribbon.ink.draw.view;
delete hi.ribbon.ink.draw.zoomIn;
delete hi.ribbon.ink.draw.zoomOut;
delete hi.ribbon.ink.tab.about;
delete hi.ribbon.ink.tab.aboutText;
delete hi.ribbon.ink.tab.noUnattachedPages;
delete hi.ribbon.ink.tab.subtabAudio;
delete hi.ribbon.ink.tab.subtabColor;
delete hi.ribbon.ink.tab.subtabDraw;
delete hi.ribbon.ink.tab.subtabPaper;
delete hi.ribbon.ink.tab.subtabSelect;
delete hi.ribbon.ink.tab.subtabSmart;
delete hi.ribbon.view.pageDisplay;
delete hi.wordGoal.wordGoal;
delete hi.wordGoal.targetWords;
delete hi.wordGoal.setGoal;
delete hi.wordGoal.updateGoal;
delete hi.wordGoal.editGoal;
delete hi.wordGoal.clearGoal;
delete hi.lang.fa;
delete hi.lang.ur;
delete hi.vault.shortcuts.cards.heroTitle;
delete hi.vault.shortcuts.cards.newCard;
delete hi.vault.shortcuts.cards.stats;
delete hi.vault.shortcuts.cards.nothingDue;
delete hi.vault.shortcuts.cards.noCards;
delete hi.vault.shortcuts.cards.nextCard;
delete hi.vault.shortcuts.cards.emptyHint;
delete hi.vault.shortcuts.cards.allCards;
delete hi.vault.shortcuts.cards.reps;
delete hi.vault.shortcuts.cards.deleteCard;
delete hi.vault.shortcuts.graph.heroTitle;
delete hi.vault.shortcuts.graph.subtitle;
delete hi.vault.shortcuts.graph.emptyState;
delete hi.vault.shortcuts.graph.backToVault;
delete hi.vault.shortcuts.canvas.heroTitle;
delete hi.vault.shortcuts.canvas.subtitle;
delete hi.vault.shortcuts.canvas.emptyState;
delete hi.vault.shortcuts.canvas.backToCanvases;
delete hi.vault.shortcuts.canvas.cardInspector;
delete hi.vault.shortcuts.canvas.canvasGuide;
delete hi.vault.shortcuts.canvas.guideText1;
delete hi.vault.shortcuts.canvas.guideText2;
delete hi.vault.shortcuts.canvas.stats;
delete hi.vault.shortcuts.canvas.newCardTitle;
delete hi.vault.shortcuts.canvas.addCard;
delete hi.vault.shortcuts.canvas.saving;
delete hi.vault.shortcuts.canvas.saved;
delete hi.vault.shortcuts.canvas.autosaveOn;
delete hi.vault.shortcuts.canvas.canvasName;
delete hi.vault.shortcuts.canvas.status.saving;
delete hi.vault.shortcuts.canvas.status.saved;
delete hi.vault.shortcuts.canvas.status.autosaveOn;
delete hi.vault.shortcuts.tables.heroTitle;
delete hi.vault.shortcuts.tables.subtitle;
delete hi.vault.shortcuts.tables.emptyState;
delete hi.vault.shortcuts.tables.backToTables;
delete hi.vault.shortcuts.tables.viewTable;
delete hi.vault.shortcuts.tables.viewBoard;
delete hi.vault.shortcuts.tables.viewGallery;
delete hi.vault.shortcuts.tables.addColumn;
delete hi.vault.shortcuts.tables.addRow;
delete hi.vault.shortcuts.tables.priorityPlaceholder;
delete hi.vault.shortcuts.tables.typePlaceholder;
delete hi.vault.shortcuts.tables.optionsPlaceholder;
delete hi.vault.shortcuts.tables.tablePickerPlaceholder;
delete hi.vault.shortcuts.tables.addButton;
delete hi.vault.shortcuts.tables.status.saving;
delete hi.vault.shortcuts.tables.status.saved;
delete hi.vault.shortcuts.tables.status.autosaveOn;
delete hi.vault.shortcuts.tables.stats;
delete hi.vault.shortcuts.tables.tableName;
delete hi.vault.shortcuts.tables.columnTypes.text;
delete hi.vault.shortcuts.tables.columnTypes.number;
delete hi.vault.shortcuts.tables.columnTypes.select;
delete hi.vault.shortcuts.tables.columnTypes.date;
delete hi.vault.shortcuts.tables.columnTypes.checkbox;
delete hi.vault.shortcuts.tables.columnTypes.relation;
delete hi.vault.shortcuts.tables.typeBadge.text;
delete hi.vault.shortcuts.tables.typeBadge.number;
delete hi.vault.shortcuts.tables.typeBadge.select;
delete hi.vault.shortcuts.tables.typeBadge.date;
delete hi.vault.shortcuts.tables.typeBadge.checkbox;
delete hi.vault.shortcuts.tables.typeBadge.relation;
delete hi.vault.shortcuts.tables.tableGrid.placeholder;
delete hi.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete hi.vault.shortcuts.tables.tableGrid.renameColumn;
delete hi.vault.shortcuts.tables.tableGrid.deleteColumn;
delete hi.vault.shortcuts.tables.tableGrid.deleteRow;
delete hi.vault.shortcuts.tables.tableGrid.noRows;
delete hi.vault.shortcuts.tables.boardView.needsSelect;
delete hi.vault.shortcuts.tables.boardView.addSelect;
delete hi.vault.shortcuts.tables.boardView.ungrouped;
delete hi.vault.shortcuts.tables.galleryView.noRows;
delete hi.vault.shortcuts.tables.galleryView.addRow;
delete hi.vault.shortcuts.tables.galleryView.checkboxYes;
delete hi.vault.shortcuts.code.heroTitle;
delete hi.vault.shortcuts.code.subtitle;
delete hi.vault.shortcuts.code.emptyState;
delete hi.vault.shortcuts.code.backToCode;
delete hi.vault.shortcuts.code.fileName;
delete hi.vault.shortcuts.code.languagePlaceholder;
delete hi.vault.shortcuts.code.findButton;
delete hi.vault.shortcuts.code.status.saving;
delete hi.vault.shortcuts.code.status.saved;
delete hi.vault.shortcuts.code.status.autosaveOn;
delete hi.vault.shortcuts.queries.heroTitle;
delete hi.vault.shortcuts.queries.description;
delete hi.vault.shortcuts.queries.placeholder;
delete hi.vault.shortcuts.queries.saveButton;
delete hi.vault.shortcuts.queries.resultsLabel;
delete hi.vault.shortcuts.queries.indexing;
delete hi.vault.shortcuts.queries.notesCount;
delete hi.vault.shortcuts.queries.savedQueriesLabel;
delete hi.vault.shortcuts.queries.noSavedQueries;
delete hi.vault.shortcuts.queries.syntaxLabel;
delete hi.vault.shortcuts.extensions.heroTitle;
delete hi.vault.shortcuts.extensions.description;
delete hi.vault.shortcuts.extensions.installedLabel;
delete hi.vault.shortcuts.extensions.activeCount;
delete hi.vault.shortcuts.extensions.cssOverridesLabel;
delete hi.vault.shortcuts.extensions.cssOverridesDesc;
delete hi.vault.shortcuts.extensions.customThemeExample;
delete hi.vault.shortcuts.extensions.applyButton;
delete hi.vault.shortcuts.extensions.resetButton;
delete hi.vault.shortcuts.extensions.appliedStatus;
delete hi.vault.shortcuts.extensions.runtimeLogLabel;
delete hi.vault.shortcuts.extensions.liveStatus;
delete hi.vault.shortcuts.extensions.tabManifestLabel;
delete hi.vault.shortcuts.extensions.tabManifestDesc;
delete hi.vault.shortcuts.trash.heroTitle;
delete hi.vault.shortcuts.trash.description;
delete hi.vault.shortcuts.trash.itemCount;
delete hi.vault.shortcuts.trash.loading;
delete hi.vault.shortcuts.trash.emptyState;
delete hi.vault.shortcuts.trash.emptyDescription;
delete hi.vault.shortcuts.trash.noteSnippet;
delete hi.vault.shortcuts.trash.deletedAgo;
delete hi.vault.shortcuts.trash.expiresToday;
delete hi.vault.shortcuts.trash.daysLeft;
delete hi.vault.shortcuts.trash.restoreButton;
delete hi.vault.shortcuts.trash.toastRestored;
delete hi.vault.shortcuts.trash.deleteForeverDialog.title;
delete hi.vault.shortcuts.trash.deleteForeverDialog.description;
delete hi.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete hi.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete hi.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/hi.json', JSON.stringify(hi, null, 2) + '\n', 'utf8');
console.log('Done!');