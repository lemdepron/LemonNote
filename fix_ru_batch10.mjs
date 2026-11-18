import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/ru.json', 'utf8');
const ru = JSON.parse(content);

// Fix ru.json - add top-level "ink" key (matching en.json structure)
ru.ink = {
  "groups": {
    "draw": "Рисование",
    "color": "Цвет",
    "history": "История",
    "view": "Вид",
    "more": "Ещё"
  },
  "more": {
    "label": "Ещё",
    "hint": "Редко используемые инструменты",
    "modes": "Режимы",
    "eraser": "Настройки ластика",
    "brushEngine": "Движок кисти",
    "brushEngineHint": "Поведение пера, движок ластика, фигуры и линейки",
    "shapes": "Фигуры",
    "coordinateGraph": "Координатная сетка",
    "paper": "Бумага",
    "paperStudio": "Студия бумаги",
    "smartInk": "Умная штука",
    "handwriting": "Распознавание почерка",
    "equation": "Уравнение",
    "resultsSearch": "Результаты и поиск",
    "audio": "Аудио",
    "record": "Запись",
    "stop": "Стоп",
    "play": "Воспроизведение",
    "pause": "Пауза",
    "replayInk": "Повтор штрихов",
    "removeAudio": "Удалить аудио",
    "overlay": "Наложение",
    "fullPage": "Вся страница",
    "inkOverText": "Чернила над текстом",
    "destructive": "Разрушительное",
    "removeInk": "Удалить чернила",
    "attachOld": "Прикрепить старую страницу",
    "disabled": "Сначала выделите штрихи лассо"
  },
  "draw": {
    "pen": "Перо",
    "penHint": "Выбрать перо",
    "eraser": "Ластик",
    "eraserHint": "Стереть штрихи",
    "lasso": "Лассо",
    "lassoHint": "Выделить штрихи, обведя их",
    "width": "Толщина",
    "saveFavPen": "Сохранить текущее перо как избранное",
    "removeFavPen": "Удалить избранное перо",
    "noFavPens": "сохраните ваши любимые настройки пера здесь (макс. 8)"
  },
  "color": {
    "picker": "Цвет",
    "pickerHint": "Открыть смешиватель цветов, палитры и историю"
  },
  "mode": {
    "select": "Выбор",
    "shape": "Фигуры",
    "pan": "Перемещение",
    "pick": "Пипетка",
    "insertSpace": "Вставить пробел"
  },
  "groups": {
    "draw": "Рисование",
    "color": "Цвет",
    "history": "История",
    "view": "Вид",
    "more": "Ещё",
    "select": "Выбор",
    "object": "Объект",
    "strokes": "Штрихи",
    "transform": "Трансформация",
    "template": "Шаблон",
    "pageSize": "Размер страницы",
    "pages": "Страницы",
    "paperStudio": "Студия бумаги",
    "recognise": "Распознать",
    "results": "Результаты",
    "record": "Запись",
    "playback": "Воспроизведение",
    "manage": "Управление"
  },
  "history": {
    "undo": "Отмена",
    "undoHint": "Отменить последний штрих",
    "redo": "Повтор",
    "redoHint": "Повтор"
  },
  "view": {
    "zoomOut": "Уменьшить",
    "zoomIn": "Увеличить",
    "fit": "Подогнать",
    "fitHint": "Подогнать страницу под чернила"
  },
  "select": {
    "select": "Выбор",
    "selectHint": "Выбирать, перемещать, масштабировать и поворачивать объекты",
    "lasso": "Лассо",
    "lassoHint": "Выделять штрихи, обводя их"
  },
  "object": {
    "delete": "Удалить",
    "deleteHint": "Удалить выбранный объект",
    "front": "На передний план",
    "frontHint": "На передний план",
    "back": "На задний план",
    "backHint": "На задний план"
  },
  "strokes": {
    "apply": "Применить",
    "applyHint": "Подтвердить перемещение, масштаб или поворот",
    "recolor": "Перекрасить",
    "recolorHint": "Покрасить выделение текущими чернилами",
    "delete": "Удалить",
    "deleteHint": "Удалить выбранные штрихи",
    "deselect": "Снять выделение",
    "deselectHint": "Очистить выделение"
  },
  "transform": {
    "studio": "Студия выделения",
    "studioHint": "Точно перемещать, масштабировать и поворачивать выделение",
    "disabled": "Сначала выделите штрихи лассо"
  },
  "paper": {
    "template": "Шаблон бумаги",
    "tone": "Тон бумаги",
    "size": "Размер страницы",
    "studio": "Студия бумаги",
    "studioHint": "Все варианты бумаги в одном месте",
    "clear": "Очистить страницу",
    "clearHint": "Удалить все штрихи на этой странице"
  },
  "pages": {
    "prev": "Предыдущая страница",
    "next": "Следующая страница",
    "page": "страница {num}"
  },
  "smart": {
    "handwriting": "Распознавание почерка",
    "handwritingHint": "Превратить выделение лассо или видимую страницу в текст",
    "equation": "Уравнение",
    "equationHint": "Превратить рукописную математику в LaTeX",
    "results": "Результаты и поиск",
    "resultsHint": "Распознанный текст, вставить на страницу, поиск всего почерка"
  },
  "audio": {
    "record": "Запись",
    "recordHint": "Записывать аудио пока пишешь; каждый штрих имеет временную метку",
    "stop": "Стоп",
    "play": "Воспроизведение",
    "playHint": "Воспроизвести запись и перерисовать страницу по мере письма",
    "pause": "Пауза",
    "replayInk": "Повтор чернил",
    "replayInkHint": "Повтор штрихов без звука",
    "noRecording": "нет записи",
    "studio": "Аудио студия",
    "studioHint": "Прокрутить запись",
    "remove": "Удалить аудио",
    "removeHint": "Удалить запись с этой страницы",
    "recording": "запись…"
  },
  "overlay": {
    "fullPage": "Вся страница",
    "inkOverText": "Чернила над текстом",
    "fullPageHint": "Переключиться на полностраничную поверхность чернил",
    "inkOverTextHint": "Показывать чернила над текстом заметки в режиме чтения"
  },
  "tab": {
    "handwriting": "Распознавание почерка",
    "startInking": "Начать черчение",
    "startInkingHint": "Добавить страницу черчения к этой заметке",
    "attachOldPage": "Прикрепить старую страницу",
    "attachOldPageHint": "Принести страницу черчения из до того как Ink переехал внутрь заметок",
    "noAttachable": "Нет неприкрепленных страниц черчения.",
    "ink": "Чернила",
    "overlay": "Наложение",
    "handwritingPage": "Страница черчения",
    "marks": "{count} штрихов",
    "saving": "Сохранение...",
    "saved": "Сохранено",
    "autosave": "Автосохранение включено",
    "attachOld": "Прикрепить раннюю страницу",
    "attachOldHint": "Прикрепить ранее созданную страницу черчения к этой заметке",
    "statusSaving": "сохранение…",
    "statusSaved": "сохранено",
    "statusAutosave": "автосохранение включено",
    "removeInk": "Удалить чернила",
    "removeInkHint": "Удалить все чернильнике в этой заметке"
  }
};

// Fix ribbon.ink to match en.json structure
ru.ribbon.ink = {
  "draw": {
    "mode": "Режим",
    "pens": "Перья",
    "favouritePens": "Избранные перья",
    "stroke": "Штрих",
    "eraser": "Ластик",
    "history": "История",
    "view": "Вид",
    "shapes": "Фигуры",
    "drawMode": "Рисование",
    "drawModeHint": "Рисовать текущим пером",
    "shapeMode": "Фигуры",
    "shapeModeHint": "Рисовать линии, прямоугольники, круги и координатные графики",
    "selectMode": "Выбор",
    "selectModeHint": "Выбирать, перемещать, масштабировать и вращать объекты",
    "lassoMode": "Лассо",
    "lassoModeHint": "Выбирать штрихи, обводя их",
    "eraseMode": "Ластик",
    "eraseModeHint": "Стирать штрихи",
    "panMode": "Перемещение",
    "panModeHint": "Перемещать страницу",
    "eyedropperMode": "Пипетка",
    "eyedropperModeHint": "Выбрать цвет со страницы",
    "insertSpaceMode": "Вставить пробел",
    "insertSpaceModeHint": "Перетащить, чтобы вставить или удалить вертикальный пробел между чернильными штрихами",
    "brushEngine": "Движок кисти",
    "brushEngineHint": "Поведение пера, движок ластика, фигуры и линейки",
    "eraseStroke": "Штрих",
    "eraseStrokeHint": "Стереть целые штрихи",
    "erasePrecision": "Точка",
    "erasePrecisionHint": "Точный ластик",
    "eraserSmall": "Маленький ластик (12пкс)",
    "eraserMedium": "Средний ластик (26пкс)",
    "eraserLarge": "Большой ластик (50пкс)",
    "eraserRadius": "радиус",
    "undo": "Отмена",
    "undoHint": "Отменить последний штрих",
    "redo": "Повтор",
    "redoHint": "Повтор",
    "zoomOut": "Уменьшить",
    "zoomIn": "Увеличить",
    "fit": "Подогнать",
    "fitHint": "Подогнать страницу под чернила",
    "clearPage": "Очистить страницу",
    "clearPageHint": "Удалить все штрихи на этой странице",
    "coordinateGraph": "Координатный график",
    "coordinateGraphHint": "Вставить координатный график с осями, сеткой и засечками",
    "addCoordinateGraph": "Добавить координатный график",
    "insertSpaceToast": "Текст не двигается. Чернила под линией смещаются от текста, на котором они были написаны.",
    "snapShapes": "Привязка фигур",
    "snapShapesHint": "Автоматически преобразовывать свободные штрихи в геометрические фигуры",
    "comingSoon": "Скоро",
    "saveFavPen": "Сохранить текущее перо как избранное",
    "removeFavPen": "Удалить избранное перо",
    "favPenEmpty": "сохраните ваши любимые настройки пера здесь (макс. 8)",
    "strokeWidth": "толщина",
    "strokeOpacity": "прозрачность"
  },
  "color": {
    "current": "Текущий",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "Шестнадцатеричный цвет",
    "hexHelpValid": "3 или 6 цифр hex, с или без #",
    "hexHelpInvalid": "Недействительный hex — нажмите Escape для отмены",
    "quickInks": "Быстрые чернила",
    "recent": "Недавние",
    "recentEmpty": "ваши используемые цвета появляются здесь",
    "studio": "Студия",
    "colorStudio": "Цветовая студия",
    "colorStudioHint": "Микшер, палитры, непрозрачность и пользовательские цвета",
    "pick": "Выбрать",
    "pickHint": "Выбрать цвет со страницы",
    "opacity": "непрозрачность"
  },
  "select": {
    "select": "Выбор",
    "selectHint": "Выбирать, перемещать, масштабировать и вращать объекты",
    "lasso": "Лассо",
    "lassoHint": "Выбирать штрихи, обводя их",
    "selectionInfo": "Объект: {type}",
    "strokesSelected": "{count} штрихов",
    "nothingSelected": "ничего не выбрано",
    "apply": "Применить",
    "applyHint": "Подтвердить перемещение, масштаб или поворот",
    "recolor": "Перекрасить",
    "recolorHint": "Покрасить выделение текущими чернилами",
    "delete": "Удалить",
    "deleteHint": "Удалить выбранные штрихи",
    "deselect": "Снять выделение",
    "deselectHint": "Очистить выделение",
    "transform": "Трансформация",
    "selectionStudio": "Студия выделения",
    "selectionStudioHint": "Точно перемещать, масштабировать и вращать выделение",
    "selectFirst": "Сначала выделите штрихи лассо",
    "selectObjectFirst": "Выберите объект инструментом Выбор"
  },
  "paper": {
    "template": "Шаблон",
    "paperTemplate": "Шаблон бумаги",
    "paperTone": "Тон бумаги",
    "pageSize": "Размер страницы",
    "pages": "Страницы",
    "previousPage": "Предыдущая страница",
    "nextPage": "Следующая страница",
    "pageNumber": "страница {num}",
    "studio": "Студия",
    "paperStudio": "Студия бумаги",
    "paperStudioHint": "Все варианты бумаги в одном месте",
    "clearPage": "Очистить страницу",
    "clearPageHint": "Удалить все штрихи на этой странице"
  },
  "frames": {
    "template": "Шаблон",
    "paperTemplate": "Шаблон бумаги",
    "paperTone": "Тон бумаги",
    "pageSize": "Размер страницы",
    "pages": "Страницы",
    "previousPage": "Предыдущая страница",
    "nextPage": "Следующая страница",
    "pageNumber": "страница {num}",
    "studio": "Студия",
    "paperStudio": "Студия бумаги",
    "paperStudioHint": "Все варианты бумаги в одном месте",
    "coordinateGraph": "Координатный график",
    "coordinateGraphHint": "Вставить координатный график с осями, сеткой и засечками",
    "addCoordinateGraph": "Добавить координатный график",
    "clearPage": "Очистить страницу",
    "clearPageHint": "Удалить все штрихи на этой странице"
  },
  "objects": {
    "select": "Выбор",
    "selectHint": "Выбирать, перемещать, масштабировать и вращать объекты",
    "lasso": "Лассо",
    "lassoHint": "Выбирать штрихи, обводя их",
    "shapes": "Фигуры",
    "shapesHint": "Вставлять прямоугольники, круги, линии, стрелки и многоугольники",
    "stickers": "Стикеры",
    "stickersHint": "Вставлять декоративные стикеры",
    "textbox": "Текстовое поле",
    "textboxHint": "Вставить текстовое поле",
    "sticky": "Стикер",
    "stickyHint": "Вставить стикер",
    "selectionInfo": "Объект: {type}",
    "strokesSelected": "{count} штрихов",
    "nothingSelected": "ничего не выбрано",
    "apply": "Применить",
    "applyHint": "Подтвердить перемещение, масштаб или поворот",
    "recolor": "Перекрасить",
    "recolorHint": "Покрасить выделение текущими чернилами",
    "delete": "Удалить",
    "deleteHint": "Удалить выбранный объект",
    "deselect": "Снять выделение",
    "deselectHint": "Очистить выделение",
    "transform": "Трансформация",
    "selectionStudio": "Студия выделения",
    "selectionStudioHint": "Точно перемещать, масштабировать и вращать выделение",
    "selectFirst": "Выделите штрихи лассо",
    "selectObjectFirst": "Выберите объект инструментом Выбор"
  },
  "smart": {
    "recognise": "Распознать",
    "handwriting": "Распознавание почерка",
    "handwritingHint": "Превратить выделение лассо или страницу в поле зрения в текст",
    "equation": "Уравнение",
    "equationHint": "Превратить рукописную математику в LaTeX",
    "resultsAndSearch": "Результаты и поиск",
    "resultsSearch": "Результаты и поиск",
    "resultsSearchHint": "Распознанный текст, вставить на страницу, поиск всего почерка"
  },
  "audio": {
    "record": "Запись",
    "recordLabel": "Записывать аудио пока пишешь; каждый штрих имеет временную метку",
    "stop": "Стоп",
    "stopLabel": "Остановить запись",
    "playback": "Воспроизведение",
    "play": "Воспроизведение",
    "playHint": "Воспроизвести запись и перерисовать страницу по мере письма",
    "pause": "Пауза",
    "replayInk": "Повтор чернил",
    "replayInkHint": "Повтор штрихов без звука",
    "noRecording": "нет записи",
    "manage": "Управление",
    "audioStudio": "Аудио студия",
    "audioStudioHint": "Прокрутить запись",
    "removeAudio": "Удалить аудио",
    "removeAudioHint": "Удалить запись с этой страницы",
    "recordFirst": "Сначала запишите аудио"
  },
  "tab": {
    "ink": "Чернила",
    "handwriting": "Распознавание почерка",
    "startInking": "Начать черчение",
    "startInkingHint": "Добавить страницу черчения к этой заметке",
    "attachOldPage": "Прикрепить старую страницу",
    "attachOldPageHint": "Принести страницу черчения из до того как Ink переехал внутрь заметок",
    "noUnattachedPages": "Нет неприкрепленных страниц черчения.",
    "about": "О программе",
    "aboutText": "Каждая заметка может нести свою страницу черчения. Перья, цвета, выбор, бумага, умные чернила и аудио появляются здесь, как только вы начнете.",
    "subtabDraw": "Рисование",
    "subtabFrames": "Рамки",
    "subtabObjects": "Объекты",
    "subtabView": "Вид",
    "subtabColor": "Цвет",
    "subtabSelect": "Выбор",
    "subtabPaper": "Бумага",
    "subtabSmart": "Умные чернила",
    "subtabAudio": "Аудио",
    "overlay": "Наложение",
    "fullPage": "Вся страница",
    "inkOverText": "Чернила над текстом",
    "fullPageHint": "Переключиться на полностраничную поверхность чернил",
    "inkOverTextHint": "Показывать чернила над текстом заметки в режиме чтения",
    "marks": "{count} штрихов",
    "statusSaving": "сохранение…",
    "statusSaved": "сохранено",
    "statusAutosave": "автосохранение включено",
    "removeInk": "Удалить чернила",
    "removeInkHint": "Удалить все чернильнике в этой заметке"
  },
  "eraserModes": {
    "stroke": "Штрих",
    "precision": "Точность"
  },
  "groups": {
    "draw": "Рисование",
    "frames": "Рамки",
    "objects": "Объекты",
    "view": "Вид",
    "more": "Ещё"
  },
  "more": {
    "label": "Ещё",
    "hint": "Редко используемые инструменты",
    "modes": "Режимы",
    "eraser": "Настройки ластика",
    "brushEngine": "Движок кисти",
    "brushEngineHint": "Поведение пера, движок ластика, фигуры и линейки",
    "shapes": "Фигуры",
    "coordinateGraph": "Координатный график",
    "paper": "Бумага",
    "paperStudio": "Студия бумаги",
    "smartInk": "Умные чернила",
    "handwriting": "Распознавание почерка",
    "equation": "Уравнение",
    "resultsSearch": "Результаты и поиск",
    "audio": "Аудио",
    "record": "Запись",
    "stop": "Стоп",
    "play": "Воспроизведение",
    "pause": "Пауза",
    "replayInk": "Повтор чернил",
    "removeAudio": "Удалить аудио",
    "overlay": "Наложение",
    "fullPage": "Вся страница",
    "inkOverText": "Чернила над текстом",
    "destructive": "Разрушительное",
    "removeInk": "Удалить чернила",
    "attachOld": "Прикрепить старую страницу",
    "disabled": "Выделите штрихи лассо"
  },
  "draw": {
    "pen": "Перо",
    "penHint": "Выбрать перо",
    "eraser": "Ластик",
    "eraserHint": "Стереть штрихи",
    "lasso": "Лассо",
    "lassoHint": "Выбирать штрихи, обводя их",
    "width": "Ширина",
    "saveFavPen": "Сохранить текущее перо как избранное",
    "removeFavPen": "Удалить избранное перо",
    "noFavPens": "сохраните ваши любимые настройки пера здесь (макс. 8)"
  },
  "color": {
    "picker": "Цвет",
    "pickerHint": "Открыть смешиватель цветов, палитры и историю"
  },
  "tab": {
    "handwriting": "Распознавание почерка",
    "startInking": "Начать черчение",
    "startInkingHint": "Добавить страницу черчения к этой заметке",
    "attachOldPage": "Прикрепить старую страницу",
    "attachOldPageHint": "Принести страницу черчения из до того как Ink переехал внутрь заметок",
    "noAttachable": "Нет неприкрепленных страниц черчения.",
    "ink": "Чернила",
    "overlay": "Наложение",
    "fullPage": "Вся страница",
    "inkOverText": "Чернила над текстом",
    "fullPageHint": "Переключиться на полностраничную поверхность чернил",
    "inkOverTextHint": "Показывать чернила над текстом заметки в режиме чтения",
    "handwritingPage": "Страница черчения",
    "marks": "{count} штрихов",
    "statusSaving": "сохранение…",
    "statusSaved": "сохранено",
    "statusAutosave": "автосохранение включено",
    "removeInk": "Удалить чернила",
    "removeInkHint": "Удалить все чернильнике в этой заметке"
  }
};

// Add missing ribbon.view keys
ru.ribbon.view = {
  ...ru.ribbon.view,
  "navigation": "Навигация",
  "pageWidth": "Ширина страницы",
  "onePage": "Одна страница",
  "twoPages": "Две страницы",
  "pageScroll": "Страница и прокрутка",
  "narrow": "Узкий",
  "medium": "Средний",
  "wide": "Широкий",
  "full": "Полный",
  "attachTable": "Прикрепить таблицу",
  "importPdf": "Импорт PDF",
  "importPdfHint": "Импортировать PDF-файл как новую заметку",
  "importPdfPrompt": "Импортировать этот PDF как новую заметку?",
  "pdfImported": "PDF импортирован как заметка",
  "pdfImportError": "Не удалось импортировать PDF",
  "prevPage": "Предыдущая страница",
  "nextPage": "Следующая страница",
  "page": "Страница {current} из {total}",
  "resetZoom": "Сбросить масштаб",
  "print": "Печать",
  "download": "Скачать",
  "loadingPdf": "Загрузка PDF…",
  "pdfLoadError": "Не удалось загрузить PDF",
  "noPdf": "PDF не загружен",
  "editorA11y": "Редактор и доступность",
  "annotate": {
    "enter": "Аннотировать",
    "enterHint": "Рисовать на этой странице PDF",
    "exit": "Выйти из аннотирования",
    "exitHint": "Прекратить рисование и вернуться к просмотру",
    "save": "Сохранить в PDF",
    "saveHint": "Сохранить аннотации в PDF-файл",
    "saved": "Аннотации сохранены в PDF",
    "export": "Экспорт PDF",
    "exportHint": "Скачать копию с редактируемыми или плоскими аннотациями",
    "exportAnnotated": "Экспорт с аннотациями",
    "exportAnnotatedHint": "Скачать с аннотациями (редактируемыми при повторном открытии)",
    "exportFlattened": "Экспорт сплющенный",
    "exportFlattenedHint": "Скачать с запеченными аннотациями (не редактируемыми)",
    "exported": "Экспортирован PDF",
    "exportedFlattened": "Экспортирован сплющенный PDF"
  }
};

// Add missing ribbon.insert keys
ru.ribbon.insert = {
  ...ru.ribbon.insert,
  "mathBlock": "Математический блок",
  "mathBlockHint": "Вставить математический блок ($$ … $$)",
  "htmlMath": "Математика (KaTeX)",
  "htmlMathHint": "Вставить отрендеренную KaTeX математику с локальной CSS-ссылкой (только HTML формат)"
};

// Add missing fileMenu keys
ru.fileMenu = {
  ...ru.fileMenu,
  "printExport": {
    ...ru.fileMenu.printExport,
    "htmlEmbedded": "Единый файл (изображения встроены)",
    "openAsCanvas": "Открыть как холст",
    "openAsCanvasHint": "Создать холст с содержимым этой заметки в рамке A4",
    "canvasCreated": "Холст создан: {name}"
  },
  "migration": {
    "title": "Миграция формата заметки",
    "message": "Эта версия LemonNote упрощает форматы заметок. Заметки в форматах YAML, XML, JSON, TOML, CSV, INI, CSS, JavaScript, TypeScript, Python, Rust, Bash и SQL будут конвертированы в Markdown с огражденными блоками кода, сохраняя их точное содержимое.",
    "backupTitle": "Создать резервную копию перед миграцией",
    "backupMessage": "Перед запуском миграции будет создана полная резервная копия вашего хранилища. Настоятельно рекомендуется, чтобы можно было восстановить, если что-то пойдет не так.",
    "backupButton": "Создать резервную копию и мигрировать",
    "skipButton": "Пропустить резервную копию (не рекомендуется)",
    "backupSuccess": "Резервная копия успешно создана. Начинается миграция…",
    "backupFailed": "Резервное копирование не удалось: {error}. Миграция прервана для защиты ваших данных.",
    "migrationComplete": "Миграция завершена. {count} заметка(ок) конвертировано.",
    "migrationFailed": "Миграция не удалась: {error}"
  }
};

// Add missing backup keys
ru.backup = {
  ...ru.backup,
  "exportSuccess": "Резервная копия успешно экспортирована.",
  "largeWarning": "Большой файл резервной копии — рассмотрите разделение или использование внешнего хранилища.",
  "exportFailed": "Не удалось экспортировать резервную копию.",
  "readFailed": "Не удалось прочитать файл резервной копии.",
  "importFailed": "Не удалось импортировать резервную копию.",
  "previewFailed": "Не удалось предварительно просмотреть импорт.",
  "selectFilesAgain": "Пожалуйста, выберите файлы снова.",
  "selectFolderAgain": "Пожалуйста, выберите папку снова.",
  "inFile": "В файле",
  "willImport": "Будет импортировано",
  "replaceWarning": "Это заменит все существующие данные в хранилище.",
  "attachmentsWarning": "Резервная копия содержит вложения ({size}). Импорт может занять время.",
  "confirmFolderImport": "Подтвердить импорт папки",
  "confirmFileImport": "Подтвердить импорт файла",
  "filesFound": "Найдено файлов",
  "notesToImport": "Заметок для импорта",
  "duplicatesFound": "Найдены дубликаты",
  "duplicateAction": "При дубликатах",
  "andMore": "+{count} еще",
  "preserveFolders": "Сохранить структуру папок",
  "wholeVault": "Все хранилище",
  "exportBackup": "Экспорт резервной копии",
  "importBackup": "Импорт резервной копии",
  "importFiles": "Импорт Markdown файлов",
  "importMarkdown": "Импорт Markdown / текстовых файлов",
  "importMarkdownDesc": "Выберите файлы .md, .markdown или .txt для импорта как заметок.",
  "importFilesBtn": "Выбрать файлы",
  "importFolderBtn": "Выбрать папку",
  "onImport": "При импорте",
  "keepExisting": "Сохранить существующие",
  "replaceEverything": "Заменить всё",
  "confirmImport": "Подтвердить импорт"
};

// Add missing vault.canvas keys
ru.vault = {
  ...ru.vault,
  "canvas": {
    ...ru.vault.canvas,
    "addFrame": "Добавить рамку",
    "fitToPage": "Подогнать под страницу",
    "fitToWidth": "Подогнать под ширину",
    "zoomOut": "Уменьшить",
    "zoomIn": "Увеличить",
    "resetView": "Сбросить вид",
    "export": "Экспорт",
    "import": "Импорт",
    "exportTooltip": "Экспорт как .lemoncanvas",
    "importTooltip": "Импорт .lemoncanvas файла",
    "importSuccess": "Холст успешно импортирован",
    "exportPdf": "Экспорт как PDF",
    "exportPng": "Экспорт как PNG",
    "exportWholeCanvas": "Весь холст",
    "exportSelectedFrame": "Выбранная рамка",
    "exportPdfTooltip": "Экспорт холста в PDF",
    "exportPngTooltip": "Экспорт холста в PNG",
    "selectFrameFirst": "Сначала выберите рамку для индивидуального экспорта",
    "newDesign": "Новый дизайн",
    "modeDesign": "Дизайн",
    "kindDesign": "Дизайн",
    "frameTypes": {
      "a4": "A4 Портрет",
      "a4-landscape": "A4 Ландшафт",
      "letter": "Letter",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "Квадрат",
      "free": "Свободный"
    },
    "textFrame": {
      "locked": "Текст заблокирован, потому что чернила нарисованы поверх него",
      "unlock": "Разблокировать",
      "unlockWarning": "Разблокировка позволит редактировать, но штрихи чернил могут перестать соответствовать тексту."
    }
  }
};

// Add format capability
ru.format = {
  "capability": {
    "markdown": {
      "ink": "Недоступно в Markdown",
      "shapes": "Недоступно в Markdown"
    },
    "plain": {
      "richFormat": "Недоступно в обычном тексте",
      "codeBlocks": "Недоступно в обычном тексте",
      "math": "Недоступно в обычном тексте",
      "images": "Недоступно в обычном тексте",
      "tables": "Недоступно в обычном тексте",
      "ink": "Недоступно в обычном тексте",
      "shapes": "Недоступно в обычном тексте",
      "insert": "Недоступно в обычном тексте",
      "design": "Недоступно в обычном тексте",
      "layout": "Недоступно в обычном тексте",
      "exportPdf": "Недоступно в обычном тексте"
    },
    "html": {
      "ink": "Недоступно в HTML",
      "shapes": "Недоступно в HTML",
      "design": "HTML стиль в источнике",
      "layout": "HTML стиль в источнике"
    },
    "pdf": {
      "editText": "Недоступно в PDF",
      "richFormat": "Недоступно в PDF",
      "codeBlocks": "Недоступно в PDF",
      "math": "Недоступно в PDF",
      "images": "Недоступно в PDF",
      "tables": "Недоступно в PDF",
      "links": "Недоступно в PDF",
      "insert": "Недоступно в PDF",
      "design": "Недоступно в PDF",
      "layout": "Недоступно в PDF"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete ru.ribbon.ink.color.colorStudio;
delete ru.ribbon.ink.color.colorStudioHint;
delete ru.ribbon.ink.color.current;
delete ru.ribbon.ink.color.hexAriaLabel;
delete ru.ribbon.ink.color.hexHelpInvalid;
delete ru.ribbon.ink.color.hexHelpValid;
delete ru.ribbon.ink.color.hexPlaceholder;
delete ru.ribbon.ink.color.opacity;
delete ru.ribbon.ink.color.pick;
delete ru.ribbon.ink.color.pickHint;
delete ru.ribbon.ink.color.quickInks;
delete ru.ribbon.ink.color.recent;
delete ru.ribbon.ink.color.recentEmpty;
delete ru.ribbon.ink.color.studio;
delete ru.ribbon.ink.draw.addCoordinateGraph;
delete ru.ribbon.ink.draw.brushEngine;
delete ru.ribbon.ink.draw.brushEngineHint;
delete ru.ribbon.ink.draw.clearPage;
delete ru.ribbon.ink.draw.clearPageHint;
delete ru.ribbon.ink.draw.coordinateGraph;
delete ru.ribbon.ink.draw.coordinateGraphHint;
delete ru.ribbon.ink.draw.drawMode;
delete ru.ribbon.ink.draw.drawModeHint;
delete ru.ribbon.ink.draw.eraseMode;
delete ru.ribbon.ink.draw.eraseModeHint;
delete ru.ribbon.ink.draw.erasePrecision;
delete ru.ribbon.ink.draw.erasePrecisionHint;
delete ru.ribbon.ink.draw.eraseStroke;
delete ru.ribbon.ink.draw.eraseStrokeHint;
delete ru.ribbon.ink.draw.eraserLarge;
delete ru.ribbon.ink.draw.eraserMedium;
delete ru.ribbon.ink.draw.eraserRadius;
delete ru.ribbon.ink.draw.eraserSmall;
delete ru.ribbon.ink.draw.eyedropperMode;
delete ru.ribbon.ink.draw.eyedropperModeHint;
delete ru.ribbon.ink.draw.favPenEmpty;
delete ru.ribbon.ink.draw.favouritePens;
delete ru.ribbon.ink.draw.fit;
delete ru.ribbon.ink.draw.fitHint;
delete ru.ribbon.ink.draw.history;
delete ru.ribbon.ink.draw.insertSpaceMode;
delete ru.ribbon.ink.draw.insertSpaceModeHint;
delete ru.ribbon.ink.draw.insertSpaceToast;
delete ru.ribbon.ink.draw.lassoMode;
delete ru.ribbon.ink.draw.lassoModeHint;
delete ru.ribbon.ink.draw.mode;
delete ru.ribbon.ink.draw.panMode;
delete ru.ribbon.ink.draw.panModeHint;
delete ru.ribbon.ink.draw.pens;
delete ru.ribbon.ink.draw.redo;
delete ru.ribbon.ink.draw.redoHint;
delete ru.ribbon.ink.draw.selectMode;
delete ru.ribbon.ink.draw.selectModeHint;
delete ru.ribbon.ink.draw.shapeMode;
delete ru.ribbon.ink.draw.shapeModeHint;
delete ru.ribbon.ink.draw.shapes;
delete ru.ribbon.ink.draw.stroke;
delete ru.ribbon.ink.draw.strokeOpacity;
delete ru.ribbon.ink.draw.strokeWidth;
delete ru.ribbon.ink.draw.undo;
delete ru.ribbon.ink.draw.undoHint;
delete ru.ribbon.ink.draw.view;
delete ru.ribbon.ink.draw.zoomIn;
delete ru.ribbon.ink.draw.zoomOut;
delete ru.ribbon.ink.tab.about;
delete ru.ribbon.ink.tab.aboutText;
delete ru.ribbon.ink.tab.noUnattachedPages;
delete ru.ribbon.ink.tab.subtabAudio;
delete ru.ribbon.ink.tab.subtabColor;
delete ru.ribbon.ink.tab.subtabDraw;
delete ru.ribbon.ink.tab.subtabPaper;
delete ru.ribbon.ink.tab.subtabSelect;
delete ru.ribbon.ink.tab.subtabSmart;
delete ru.ribbon.view.pageDisplay;
delete ru.wordGoal.wordGoal;
delete ru.wordGoal.targetWords;
delete ru.wordGoal.setGoal;
delete ru.wordGoal.updateGoal;
delete ru.wordGoal.editGoal;
delete ru.wordGoal.clearGoal;
delete ru.vault.shortcuts.cards.heroTitle;
delete ru.vault.shortcuts.cards.newCard;
delete ru.vault.shortcuts.cards.stats;
delete ru.vault.shortcuts.cards.nothingDue;
delete ru.vault.shortcuts.cards.noCards;
delete ru.vault.shortcuts.cards.nextCard;
delete ru.vault.shortcuts.cards.emptyHint;
delete ru.vault.shortcuts.cards.allCards;
delete ru.vault.shortcuts.cards.reps;
delete ru.vault.shortcuts.cards.deleteCard;
delete ru.vault.shortcuts.graph.heroTitle;
delete ru.vault.shortcuts.graph.subtitle;
delete ru.vault.shortcuts.graph.emptyState;
delete ru.vault.shortcuts.graph.backToVault;
delete ru.vault.shortcuts.canvas.heroTitle;
delete ru.vault.shortcuts.canvas.subtitle;
delete ru.vault.shortcuts.canvas.emptyState;
delete ru.vault.shortcuts.canvas.backToCanvases;
delete ru.vault.shortcuts.canvas.cardInspector;
delete ru.vault.shortcuts.canvas.canvasGuide;
delete ru.vault.shortcuts.canvas.guideText1;
delete ru.vault.shortcuts.canvas.guideText2;
delete ru.vault.shortcuts.canvas.stats;
delete ru.vault.shortcuts.canvas.newCardTitle;
delete ru.vault.shortcuts.canvas.addCard;
delete ru.vault.shortcuts.canvas.saving;
delete ru.vault.shortcuts.canvas.saved;
delete ru.vault.shortcuts.canvas.autosaveOn;
delete ru.vault.shortcuts.canvas.canvasName;
delete ru.vault.shortcuts.canvas.status.saving;
delete ru.vault.shortcuts.canvas.status.saved;
delete ru.vault.shortcuts.canvas.status.autosaveOn;
delete ru.vault.shortcuts.canvas.addFrame;
delete ru.vault.shortcuts.canvas.fitToPage;
delete ru.vault.shortcuts.canvas.fitToWidth;
delete ru.vault.shortcuts.canvas.zoomOut;
delete ru.vault.shortcuts.canvas.zoomIn;
delete ru.vault.shortcuts.canvas.resetView;
delete ru.vault.shortcuts.canvas.export;
delete ru.vault.shortcuts.canvas.import;
delete ru.vault.shortcuts.canvas.exportTooltip;
delete ru.vault.shortcuts.canvas.importTooltip;
delete ru.vault.shortcuts.canvas.importSuccess;
delete ru.vault.shortcuts.canvas.exportPdf;
delete ru.vault.shortcuts.canvas.exportPng;
delete ru.vault.shortcuts.canvas.exportWholeCanvas;
delete ru.vault.shortcuts.canvas.exportSelectedFrame;
delete ru.vault.shortcuts.canvas.exportPdfTooltip;
delete ru.vault.shortcuts.canvas.exportPngTooltip;
delete ru.vault.shortcuts.canvas.selectFrameFirst;
delete ru.vault.shortcuts.canvas.newDesign;
delete ru.vault.shortcuts.canvas.modeDesign;
delete ru.vault.shortcuts.canvas.kindDesign;
delete ru.vault.shortcuts.canvas.frameTypes.a4;
delete ru.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete ru.vault.shortcuts.canvas.frameTypes.letter;
delete ru.vault.shortcuts.canvas.frameTypes["3:4"];
delete ru.vault.shortcuts.canvas.frameTypes["4:3"];
delete ru.vault.shortcuts.canvas.frameTypes["16:9"];
delete ru.vault.shortcuts.canvas.frameTypes.square;
delete ru.vault.shortcuts.canvas.frameTypes.free;
delete ru.vault.shortcuts.canvas.textFrame.locked;
delete ru.vault.shortcuts.canvas.textFrame.unlock;
delete ru.vault.shortcuts.canvas.textFrame.unlockWarning;
delete ru.vault.shortcuts.tables.heroTitle;
delete ru.vault.shortcuts.tables.subtitle;
delete ru.vault.shortcuts.tables.emptyState;
delete ru.vault.shortcuts.tables.backToTables;
delete ru.vault.shortcuts.tables.viewTable;
delete ru.vault.shortcuts.tables.viewBoard;
delete ru.vault.shortcuts.tables.viewGallery;
delete ru.vault.shortcuts.tables.addColumn;
delete ru.vault.shortcuts.tables.addRow;
delete ru.vault.shortcuts.tables.priorityPlaceholder;
delete ru.vault.shortcuts.tables.typePlaceholder;
delete ru.vault.shortcuts.tables.optionsPlaceholder;
delete ru.vault.shortcuts.tables.tablePickerPlaceholder;
delete ru.vault.shortcuts.tables.addButton;
delete ru.vault.shortcuts.tables.status.saving;
delete ru.vault.shortcuts.tables.status.saved;
delete ru.vault.shortcuts.tables.status.autosaveOn;
delete ru.vault.shortcuts.tables.stats;
delete ru.vault.shortcuts.tables.tableName;
delete ru.vault.shortcuts.tables.columnTypes.text;
delete ru.vault.shortcuts.tables.columnTypes.number;
delete ru.vault.shortcuts.tables.columnTypes.select;
delete ru.vault.shortcuts.tables.columnTypes.date;
delete ru.vault.shortcuts.tables.columnTypes.checkbox;
delete ru.vault.shortcuts.tables.columnTypes.relation;
delete ru.vault.shortcuts.tables.typeBadge.text;
delete ru.vault.shortcuts.tables.typeBadge.number;
delete ru.vault.shortcuts.tables.typeBadge.select;
delete ru.vault.shortcuts.tables.typeBadge.date;
delete ru.vault.shortcuts.tables.typeBadge.checkbox;
delete ru.vault.shortcuts.tables.typeBadge.relation;
delete ru.vault.shortcuts.tables.tableGrid.placeholder;
delete ru.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete ru.vault.shortcuts.tables.tableGrid.renameColumn;
delete ru.vault.shortcuts.tables.tableGrid.deleteColumn;
delete ru.vault.shortcuts.tables.tableGrid.deleteRow;
delete ru.vault.shortcuts.tables.tableGrid.noRows;
delete ru.vault.shortcuts.tables.boardView.needsSelect;
delete ru.vault.shortcuts.tables.boardView.addSelect;
delete ru.vault.shortcuts.tables.boardView.ungrouped;
delete ru.vault.shortcuts.tables.galleryView.noRows;
delete ru.vault.shortcuts.tables.galleryView.addRow;
delete ru.vault.shortcuts.tables.galleryView.checkboxYes;
delete ru.vault.shortcuts.code.heroTitle;
delete ru.vault.shortcuts.code.subtitle;
delete ru.vault.shortcuts.code.emptyState;
delete ru.vault.shortcuts.code.backToCode;
delete ru.vault.shortcuts.code.fileName;
delete ru.vault.shortcuts.code.languagePlaceholder;
delete ru.vault.shortcuts.code.findButton;
delete ru.vault.shortcuts.code.status.saving;
delete ru.vault.shortcuts.code.status.saved;
delete ru.vault.shortcuts.code.status.autosaveOn;
delete ru.vault.shortcuts.queries.heroTitle;
delete ru.vault.shortcuts.queries.description;
delete ru.vault.shortcuts.queries.placeholder;
delete ru.vault.shortcuts.queries.saveButton;
delete ru.vault.shortcuts.queries.resultsLabel;
delete ru.vault.shortcuts.queries.indexing;
delete ru.vault.shortcuts.queries.notesCount;
delete ru.vault.shortcuts.queries.savedQueriesLabel;
delete ru.vault.shortcuts.queries.noSavedQueries;
delete ru.vault.shortcuts.queries.syntaxLabel;
delete ru.vault.shortcuts.extensions.heroTitle;
delete ru.vault.shortcuts.extensions.description;
delete ru.vault.shortcuts.extensions.installedLabel;
delete ru.vault.shortcuts.extensions.activeCount;
delete ru.vault.shortcuts.extensions.cssOverridesLabel;
delete ru.vault.shortcuts.extensions.cssOverridesDesc;
delete ru.vault.shortcuts.extensions.customThemeExample;
delete ru.vault.shortcuts.extensions.applyButton;
delete ru.vault.shortcuts.extensions.resetButton;
delete ru.vault.shortcuts.extensions.appliedStatus;
delete ru.vault.shortcuts.extensions.runtimeLogLabel;
delete ru.vault.shortcuts.extensions.liveStatus;
delete ru.vault.shortcuts.extensions.tabManifestLabel;
delete ru.vault.shortcuts.extensions.tabManifestDesc;
delete ru.vault.shortcuts.trash.heroTitle;
delete ru.vault.shortcuts.trash.description;
delete ru.vault.shortcuts.trash.itemCount;
delete ru.vault.shortcuts.trash.loading;
delete ru.vault.shortcuts.trash.emptyState;
delete ru.vault.shortcuts.trash.emptyDescription;
delete ru.vault.shortcuts.trash.noteSnippet;
delete ru.vault.shortcuts.trash.deletedAgo;
delete ru.vault.shortcuts.trash.expiresToday;
delete ru.vault.shortcuts.trash.daysLeft;
delete ru.vault.shortcuts.trash.restoreButton;
delete ru.vault.shortcuts.trash.toastRestored;
delete ru.vault.shortcuts.trash.deleteForeverDialog.title;
delete ru.vault.shortcuts.trash.deleteForeverDialog.description;
delete ru.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete ru.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete ru.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/ru.json', JSON.stringify(ru, null, 2) + '\n', 'utf8');
console.log('Done!');