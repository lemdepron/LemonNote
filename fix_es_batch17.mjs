import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/es.json', 'utf8');
const es = JSON.parse(content);

// Fix es.json - add top-level "ink" key (matching en.json structure)
es.ink = {
  "groups": {
    "draw": "Dibujar",
    "color": "Color",
    "history": "Historial",
    "view": "Ver",
    "more": "Más"
  },
  "more": {
    "label": "Más",
    "hint": "Herramientas usadas rara vez",
    "modes": "Modos",
    "eraser": "Configuración del borrador",
    "brushEngine": "Motor de pincel",
    "brushEngineHint": "Comportamiento del lápiz, motor del borrador, formas y asistentes de regla",
    "shapes": "Formas",
    "coordinateGraph": "Gráfico de coordenadas",
    "paper": "Papel",
    "paperStudio": "Estudio de papel",
    "smartInk": "Tinta inteligente",
    "handwriting": "Escritura a mano",
    "equation": "Ecuación",
    "resultsSearch": "Resultados y búsqueda",
    "audio": "Audio",
    "record": "Grabar",
    "stop": "Detener",
    "play": "Reproducir",
    "pause": "Pausar",
    "replayInk": "Reproducir tinta",
    "removeAudio": "Eliminar audio",
    "overlay": "Superposición",
    "fullPage": "Página completa",
    "inkOverText": "Tinta sobre texto",
    "destructive": "Destructivo",
    "removeInk": "Eliminar tinta",
    "attachOld": "Adjuntar página antigua",
    "disabled": "Seleccione primero los trazos con el lazo"
  },
  "draw": {
    "pen": "Lápiz",
    "penHint": "Elegir un lápiz",
    "eraser": "Borrador",
    "eraserHint": "Borrar trazos",
    "lasso": "Lazo",
    "lassoHint": "Seleccionar trazos rodeándolos",
    "width": "Ancho",
    "saveFavPen": "Guardar lápiz actual como favorito",
    "removeFavPen": "Eliminar lápiz favorito",
    "noFavPens": "guarda tus configuraciones de lápiz favoritas aquí (máx. 8)"
  },
  "color": {
    "picker": "Color",
    "pickerHint": "Abrir mezclador de colores, paletas e historial"
  },
  "mode": {
    "select": "Seleccionar",
    "shape": "Formas",
    "pan": "Mover",
    "pick": "Pipeta",
    "insertSpace": "Insertar espacio"
  },
  "groups": {
    "draw": "Dibujar",
    "color": "Color",
    "history": "Historial",
    "view": "Ver",
    "more": "Más",
    "select": "Seleccionar",
    "object": "Objeto",
    "strokes": "Trazos",
    "transform": "Transformar",
    "template": "Plantilla",
    "pageSize": "Tamaño de página",
    "pages": "Páginas",
    "paperStudio": "Estudio de papel",
    "recognise": "Reconocer",
    "results": "Resultados",
    "record": "Grabar",
    "playback": "Reproducción",
    "manage": "Gestionar"
  },
  "history": {
    "undo": "Deshacer",
    "undoHint": "Deshacer el último trazo",
    "redo": "Rehacer",
    "redoHint": "Rehacer"
  },
  "view": {
    "zoomOut": "Alejar",
    "zoomIn": "Acercar",
    "fit": "Ajustar",
    "fitHint": "Ajustar la página a la tinta"
  },
  "select": {
    "select": "Seleccionar",
    "selectHint": "Seleccionar, mover, redimensionar y rotar objetos",
    "lasso": "Lazo",
    "lassoHint": "Seleccionar trazos rodeándolos"
  },
  "object": {
    "delete": "Eliminar",
    "deleteHint": "Eliminar el objeto seleccionado",
    "front": "Delante",
    "frontHint": "Traer al frente",
    "back": "Detrás",
    "backHint": "Enviar al fondo"
  },
  "strokes": {
    "apply": "Aplicar",
    "applyHint": "Confirmar el movimiento, escala o rotación",
    "recolor": "Recolorear",
    "recolorHint": "Repintar la selección con la tinta actual",
    "delete": "Eliminar",
    "deleteHint": "Eliminar los trazos seleccionados",
    "deselect": "Deseleccionar",
    "deselectHint": "Limpiar la selección"
  },
  "transform": {
    "studio": "Estudio de selección",
    "studioHint": "Mover, escalar y rotar la selección con precisión",
    "disabled": "Seleccione primero los trazos con el lazo"
  },
  "paper": {
    "template": "Plantilla de papel",
    "tone": "Tono de papel",
    "size": "Tamaño de página",
    "studio": "Estudio de papel",
    "studioHint": "Todas las opciones de papel en un solo lugar",
    "clear": "Limpiar página",
    "clearHint": "Eliminar todas las marcas en esta página"
  },
  "pages": {
    "prev": "Página anterior",
    "next": "Página siguiente",
    "page": "página {num}"
  },
  "smart": {
    "handwriting": "Escritura a mano",
    "handwritingHint": "Convertir la selección de lazo o la página visible en texto",
    "equation": "Ecuación",
    "equationHint": "Convertir matemáticas escritas a mano en LaTeX",
    "results": "Resultados y búsqueda",
    "resultsHint": "Texto reconocido, insertarlo en la página, buscar toda la escritura a mano"
  },
  "audio": {
    "record": "Grabar",
    "recordHint": "Grabar audio mientras escribes; cada trazo tiene marca de tiempo",
    "stop": "Detener",
    "play": "Reproducir",
    "playHint": "Reproducir la grabación y volver a dibujar la página como se escribió",
    "pause": "Pausar",
    "replayInk": "Reproducir tinta",
    "replayInkHint": "Reproducir los trazos sin sonido",
    "noRecording": "sin grabación",
    "studio": "Estudio de audio",
    "studioHint": "Navegar por la grabación",
    "remove": "Eliminar audio",
    "removeHint": "Eliminar la grabación de esta página",
    "recording": "grabando…"
  },
  "overlay": {
    "fullPage": "Página completa",
    "inkOverText": "Tinta sobre texto",
    "fullPageHint": "Cambiar a superficie de tinta de página completa",
    "inkOverTextHint": "Mostrar tinta sobre texto de nota en vista de lectura"
  },
  "tab": {
    "handwriting": "Escritura a mano",
    "startInking": "Comenzar a entintar",
    "startInkingHint": "Agregar una página de escritura a mano a esta nota",
    "attachOldPage": "Adjuntar página antigua",
    "attachOldPageHint": "Traer una página de escritura a mano de antes de que Ink se moviera dentro de las notas",
    "noAttachable": "No hay páginas de tinta sin adjuntar.",
    "ink": "Tinta",
    "overlay": "Superposición",
    "handwritingPage": "Página de escritura a mano",
    "marks": "{count} marcas",
    "saving": "Guardando...",
    "saved": "Guardado",
    "autosave": "Autoguardado activado",
    "attachOld": "Adjuntar página anterior",
    "attachOldHint": "Adjuntar una página de escritura a mano creada anteriormente a esta nota",
    "statusSaving": "guardando…",
    "statusSaved": "guardado",
    "statusAutosave": "autoguardado activado",
    "removeInk": "Eliminar tinta",
    "removeInkHint": "Eliminar toda la escritura a mano en esta nota"
  }
};

// Fix ribbon.ink to match en.json structure
es.ribbon.ink = {
  "draw": {
    "mode": "Modo",
    "pens": "Lápices",
    "favouritePens": "Lápices favoritos",
    "stroke": "Trazo",
    "eraser": "Borrador",
    "history": "Historial",
    "view": "Ver",
    "shapes": "Formas",
    "drawMode": "Dibujar",
    "drawModeHint": "Dibujar con el lápiz actual",
    "shapeMode": "Formas",
    "shapeModeHint": "Dibujar líneas, cuadros, círculos y gráficos de coordenadas",
    "selectMode": "Seleccionar",
    "selectModeHint": "Seleccionar, mover, redimensionar y rotar objetos",
    "lassoMode": "Lazo",
    "lassoModeHint": "Seleccionar trazos rodeándolos",
    "eraseMode": "Borrador",
    "eraseModeHint": "Borrar trazos",
    "panMode": "Panorámica",
    "panModeHint": "Mover la página",
    "eyedropperMode": "Cuentagotas",
    "eyedropperModeHint": "Elegir un color de la página",
    "insertSpaceMode": "Insertar espacio",
    "insertSpaceModeHint": "Arrastrar para insertar o eliminar espacio vertical entre trazos de tinta",
    "brushEngine": "Motor de pincel",
    "brushEngineHint": "Comportamiento del lápiz, motor del borrador, formas y asistentes de regla",
    "eraseStroke": "Trazo",
    "eraseStrokeHint": "Borrar trazos completos",
    "erasePrecision": "Precisión",
    "erasePrecisionHint": "Borrador de precisión",
    "eraserSmall": "Borrador pequeño (12px)",
    "eraserMedium": "Borrador mediano (26px)",
    "eraserLarge": "Borrador grande (50px)",
    "eraserRadius": "radio",
    "undo": "Deshacer",
    "undoHint": "Deshacer el último trazo",
    "redo": "Rehacer",
    "redoHint": "Rehacer",
    "zoomOut": "Alejar",
    "zoomIn": "Acercar",
    "fit": "Ajustar",
    "fitHint": "Ajustar la página a la tinta",
    "clearPage": "Limpiar página",
    "clearPageHint": "Eliminar todos los trazos en esta página",
    "coordinateGraph": "Gráfico de coordenadas",
    "coordinateGraphHint": "Insertar un gráfico de coordenadas con ejes, cuadrícula y marcas",
    "addCoordinateGraph": "Añadir gráfico de coordenadas",
    "insertSpaceToast": "El texto no se mueve. La tinta debajo de la línea se aleja del texto sobre el que se escribió.",
    "snapShapes": "Ajustar formas",
    "snapShapesHint": "Convertir automáticamente trazos a mano alzada en formas geométricas",
    "comingSoon": "Próximamente",
    "saveFavPen": "Guardar lápiz actual como favorito",
    "removeFavPen": "Eliminar lápiz favorito",
    "favPenEmpty": "guarda tus configuraciones de lápiz favoritas aquí (máx. 8)",
    "strokeWidth": "ancho",
    "strokeOpacity": "opacidad"
  },
  "color": {
    "current": "Actual",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "Color hex",
    "hexHelpValid": "3 o 6 dígitos hex, con o sin #",
    "hexHelpInvalid": "Hex inválido — presiona Escape para revertir",
    "quickInks": "Tintas rápidas",
    "recent": "Recientes",
    "recentEmpty": "los colores que usas aparecen aquí",
    "studio": "Estudio",
    "colorStudio": "Estudio de color",
    "colorStudioHint": "Mezclador, paletas, opacidad y colores personalizados",
    "pick": "Elegir",
    "pickHint": "Elegir un color de la página",
    "opacity": "opacidad"
  },
  "select": {
    "select": "Seleccionar",
    "selectHint": "Seleccionar, mover, redimensionar y rotar objetos",
    "lasso": "Lazo",
    "lassoHint": "Seleccionar trazos rodeándolos",
    "selectionInfo": "Objeto: {type}",
    "strokesSelected": "{count} trazos",
    "nothingSelected": "nada seleccionado",
    "apply": "Aplicar",
    "applyHint": "Confirmar el movimiento, escala o rotación",
    "recolor": "Recolorear",
    "recolorHint": "Repintar la selección con la tinta actual",
    "delete": "Eliminar",
    "deleteHint": "Eliminar los trazos seleccionados",
    "deselect": "Deseleccionar",
    "deselectHint": "Limpiar la selección",
    "transform": "Transformar",
    "selectionStudio": "Estudio de selección",
    "selectionStudioHint": "Mover, escalar y rotar la selección con precisión",
    "selectFirst": "Selecciona primero los trazos con el lazo",
    "selectObjectFirst": "Selecciona un objeto con la herramienta Seleccionar"
  },
  "paper": {
    "template": "Plantilla",
    "paperTemplate": "Plantilla de papel",
    "paperTone": "Tono de papel",
    "pageSize": "Tamaño de página",
    "pages": "Páginas",
    "previousPage": "Página anterior",
    "nextPage": "Página siguiente",
    "pageNumber": "página {num}",
    "studio": "Estudio",
    "paperStudio": "Estudio de papel",
    "paperStudioHint": "Todas las opciones de papel en un solo lugar",
    "clearPage": "Limpiar página",
    "clearPageHint": "Eliminar todas las marcas en esta página"
  },
  "frames": {
    "template": "Plantilla",
    "paperTemplate": "Plantilla de papel",
    "paperTone": "Tono de papel",
    "pageSize": "Tamaño de página",
    "pages": "Páginas",
    "previousPage": "Página anterior",
    "nextPage": "Página siguiente",
    "pageNumber": "página {num}",
    "studio": "Estudio",
    "paperStudio": "Estudio de papel",
    "paperStudioHint": "Todas las opciones de papel en un solo lugar",
    "coordinateGraph": "Gráfico de coordenadas",
    "coordinateGraphHint": "Insertar un gráfico de coordenadas con ejes, cuadrícula y marcas",
    "addCoordinateGraph": "Añadir gráfico de coordenadas",
    "clearPage": "Limpiar página",
    "clearPageHint": "Eliminar todas las marcas en esta página"
  },
  "objects": {
    "select": "Seleccionar",
    "selectHint": "Seleccionar, mover, redimensionar y rotar objetos",
    "lasso": "Lazo",
    "lassoHint": "Seleccionar trazos rodeándolos",
    "shapes": "Formas",
    "shapesHint": "Insertar rectángulos, círculos, líneas, flechas y polígonos",
    "stickers": "Pegatinas",
    "stickersHint": "Insertar pegatinas decorativas",
    "textbox": "Cuadro de texto",
    "textboxHint": "Insertar un cuadro de texto",
    "sticky": "Nota adhesiva",
    "stickyHint": "Insertar una nota adhesiva",
    "selectionInfo": "Objeto: {type}",
    "strokesSelected": "{count} trazos",
    "nothingSelected": "nada seleccionado",
    "apply": "Aplicar",
    "applyHint": "Confirmar el movimiento, escala o rotación",
    "recolor": "Recolorear",
    "recolorHint": "Repintar la selección con la tinta actual",
    "delete": "Eliminar",
    "deleteHint": "Eliminar el objeto seleccionado",
    "deselect": "Deseleccionar",
    "deselectHint": "Borrar la selección",
    "transform": "Transformar",
    "selectionStudio": "Estudio de selección",
    "selectionStudioHint": "Mover, escalar y rotar la selección con precisión",
    "selectFirst": "Seleccionar trazos con el lazo primero",
    "selectObjectFirst": "Seleccionar un objeto con la herramienta Seleccionar"
  },
  "smart": {
    "recognise": "Reconocer",
    "handwriting": "Escritura a mano",
    "handwritingHint": "Convertir la selección del lazo, o la página en vista, en texto",
    "equation": "Ecuación",
    "equationHint": "Convertir matemáticas escritas a mano en LaTeX",
    "resultsAndSearch": "Resultados y búsqueda",
    "resultsSearch": "Resultados y búsqueda",
    "resultsSearchHint": "Texto reconocido, insertarlo en la página, buscar toda la escritura a mano"
  },
  "audio": {
    "record": "Grabar",
    "recordLabel": "Grabar audio mientras escribes; cada trazo tiene marca de tiempo",
    "stop": "Detener",
    "stopLabel": "Detener grabación",
    "playback": "Reproducción",
    "play": "Reproducir",
    "playHint": "Reproducir la grabación y volver a dibujar la página como se escribió",
    "pause": "Pausa",
    "replayInk": "Reproducir tinta",
    "replayInkHint": "Reproducir los trazos sin sonido",
    "noRecording": "sin grabación",
    "manage": "Gestionar",
    "audioStudio": "Estudio de audio",
    "audioStudioHint": "Desplazarse por la grabación",
    "removeAudio": "Eliminar audio",
    "removeAudioHint": "Eliminar la grabación de esta página",
    "recordFirst": "Grabar algo de audio primero"
  },
  "tab": {
    "ink": "Tinta",
    "handwriting": "Escritura a mano",
    "startInking": "Comenzar a entintar",
    "startInkingHint": "Añadir una página de escritura a mano a esta nota",
    "attachOldPage": "Adjuntar página antigua",
    "attachOldPageHint": "Traer una página de escritura a mano de antes de que Ink se moviera dentro de las notas",
    "noUnattachedPages": "No hay páginas de tinta sin adjuntar.",
    "about": "Acerca de",
    "aboutText": "Cada nota puede llevar su propia página de escritura a mano. Lápices, colores, selección, papel, tinta inteligente y audio aparecen aquí una vez que empiezas.",
    "subtabDraw": "Dibujar",
    "subtabFrames": "Marcos",
    "subtabObjects": "Objetos",
    "subtabView": "Ver",
    "subtabColor": "Color",
    "subtabSelect": "Seleccionar",
    "subtabPaper": "Papel",
    "subtabSmart": "Tinta inteligente",
    "subtabAudio": "Audio",
    "overlay": "Superposición",
    "fullPage": "Página completa",
    "inkOverText": "Tinta sobre texto",
    "fullPageHint": "Cambiar a superficie de tinta de página completa",
    "inkOverTextHint": "Mostrar tinta sobre texto de nota en vista de lectura",
    "marks": "{count} marcas",
    "statusSaving": "guardando…",
    "statusSaved": "guardado",
    "statusAutosave": "autoguardado activado",
    "removeInk": "Eliminar tinta",
    "removeInkHint": "Eliminar toda la escritura a mano en esta nota"
  },
  "eraserModes": {
    "stroke": "Trazo",
    "precision": "Precisión"
  },
  "groups": {
    "draw": "Dibujar",
    "frames": "Marcos",
    "objects": "Objetos",
    "view": "Ver",
    "more": "Más"
  },
  "more": {
    "label": "Más",
    "hint": "Herramientas usadas rara vez",
    "modes": "Modos",
    "eraser": "Configuración del borrador",
    "brushEngine": "Motor de pincel",
    "brushEngineHint": "Comportamiento del lápiz, motor del borrador, formas y asistentes de regla",
    "shapes": "Formas",
    "coordinateGraph": "Gráfico de coordenadas",
    "paper": "Papel",
    "paperStudio": "Estudio de papel",
    "smartInk": "Tinta inteligente",
    "handwriting": "Escritura a mano",
    "equation": "Ecuación",
    "resultsSearch": "Resultados y búsqueda",
    "audio": "Audio",
    "record": "Grabar",
    "stop": "Detener",
    "play": "Reproducir",
    "pause": "Pausa",
    "replayInk": "Reproducir tinta",
    "removeAudio": "Eliminar audio",
    "overlay": "Superposición",
    "fullPage": "Página completa",
    "inkOverText": "Tinta sobre texto",
    "destructive": "Destructivo",
    "removeInk": "Eliminar tinta",
    "attachOld": "Adjuntar página antigua",
    "disabled": "Seleccione trazos con el lazo primero"
  },
  "draw": {
    "pen": "Lápiz",
    "penHint": "Elegir un lápiz",
    "eraser": "Borrador",
    "eraserHint": "Borrar trazos",
    "lasso": "Lazo",
    "lassoHint": "Seleccionar trazos rodeándolos",
    "width": "Ancho",
    "saveFavPen": "Guardar lápiz actual como favorito",
    "removeFavPen": "Eliminar lápiz favorito",
    "noFavPens": "guarda tus configuraciones de lápiz favoritas aquí (máx. 8)"
  },
  "color": {
    "picker": "Color",
    "pickerHint": "Abrir mezclador de colores, paletas e historial"
  },
  "tab": {
    "handwriting": "Escritura a mano",
    "startInking": "Comenzar a entintar",
    "startInkingHint": "Añadir una página de escritura a mano a esta nota",
    "attachOldPage": "Adjuntar página antigua",
    "attachOldPageHint": "Traer una página de escritura a mano de antes de que Ink se moviera dentro de las notas",
    "noAttachable": "No hay páginas de tinta sin adjuntar.",
    "ink": "Tinta",
    "overlay": "Superposición",
    "fullPage": "Página completa",
    "inkOverText": "Tinta sobre texto",
    "fullPageHint": "Cambiar a superficie de tinta de página completa",
    "inkOverTextHint": "Mostrar tinta sobre texto de nota en vista de lectura",
    "handwritingPage": "Página de escritura a mano",
    "marks": "{count} marcas",
    "statusSaving": "guardando…",
    "statusSaved": "guardado",
    "statusAutosave": "autoguardado activado",
    "removeInk": "Eliminar tinta",
    "removeInkHint": "Eliminar toda la escritura a mano en esta nota"
  }
};

// Add missing ribbon.view keys
es.ribbon.view = {
  ...es.ribbon.view,
  "navigation": "Navegación",
  "pageWidth": "Ancho de página",
  "onePage": "Una página",
  "twoPages": "Dos páginas",
  "pageScroll": "Página y desplazamiento",
  "narrow": "Estrecho",
  "medium": "Mediano",
  "wide": "Ancho",
  "full": "Completo",
  "attachTable": "Adjuntar tabla",
  "importPdf": "Importar PDF",
  "importPdfHint": "Importar un archivo PDF como nueva nota",
  "importPdfPrompt": "¿Importar este PDF como nueva nota?",
  "pdfImported": "PDF importado como nota",
  "pdfImportError": "Error al importar PDF",
  "prevPage": "Página anterior",
  "nextPage": "Página siguiente",
  "page": "Página {current} de {total}",
  "resetZoom": "Restablecer zoom",
  "print": "Imprimir",
  "download": "Descargar",
  "loadingPdf": "Cargando PDF…",
  "pdfLoadError": "Error al cargar PDF",
  "noPdf": "No hay PDF cargado",
  "editorA11y": "Editor y accesibilidad",
  "annotate": {
    "enter": "Anotar",
    "enterHint": "Dibujar en esta página del PDF",
    "exit": "Salir de anotar",
    "exitHint": "Dejar de dibujar y volver a ver",
    "save": "Guardar en PDF",
    "saveHint": "Guardar anotaciones en el archivo PDF",
    "saved": "Anotaciones guardadas en PDF",
    "export": "Exportar PDF",
    "exportHint": "Descargar una copia con o sin anotaciones editables",
    "exportAnnotated": "Exportar anotado",
    "exportAnnotatedHint": "Descargar con anotaciones (editables al reabrir)",
    "exportFlattened": "Exportar aplanado",
    "exportFlattenedHint": "Descargar con anotaciones aplanadas (no editables)",
    "exported": "PDF exportado",
    "exportedFlattened": "PDF aplanado exportado"
  }
};

// Add missing ribbon.insert keys
es.ribbon.insert = {
  ...es.ribbon.insert,
  "mathBlock": "Bloque matemático",
  "mathBlockHint": "Insertar un bloque matemático ($$ … $$)",
  "htmlMath": "Matemáticas (KaTeX)",
  "htmlMathHint": "Insertar marcado matemático KaTeX renderizado con referencia CSS local (solo formato HTML)"
};

// Add missing fileMenu keys
es.fileMenu = {
  ...es.fileMenu,
  "printExport": {
    ...es.fileMenu.printExport,
    "htmlEmbedded": "Archivo único (imágenes incrustadas)",
    "openAsCanvas": "Abrir como lienzo",
    "openAsCanvasHint": "Crear un lienzo con el contenido de esta nota en un marco A4",
    "canvasCreated": "Lienzo creado: {name}"
  },
  "migration": {
    "title": "Migración de formato de nota",
    "message": "Esta versión de LemonNote simplifica los formatos de notas. Las notas en formatos YAML, XML, JSON, TOML, CSV, INI, CSS, JavaScript, TypeScript, Python, Rust, Bash y SQL se convertirán a Markdown con bloques de código cercados, conservando su contenido exacto.",
    "backupTitle": "Crear copia de seguridad antes de la migración",
    "backupMessage": "Antes de que se ejecute la migración, se creará una copia de seguridad completa de tu bóveda. Esto se recomienda encarecidamente para que puedas restaurar si algo sale mal.",
    "backupButton": "Crear copia de seguridad y migrar",
    "skipButton": "Omitir copia de seguridad (no recomendado)",
    "backupSuccess": "Copia de seguridad creada con éxito. Iniciando migración…",
    "backupFailed": "La copia de seguridad falló: {error}. La migración se abortó para proteger tus datos.",
    "migrationComplete": "Migración completada. {count} nota(s) convertida(s).",
    "migrationFailed": "La migración falló: {error}"
  }
};

// Add missing backup keys
es.backup = {
  ...es.backup,
  "exportSuccess": "Copia de seguridad exportada con éxito.",
  "largeWarning": "Archivo de copia de seguridad grande — considere dividirlo o usar almacenamiento externo.",
  "exportFailed": "Error al exportar la copia de seguridad.",
  "readFailed": "Error al leer el archivo de copia de seguridad.",
  "importFailed": "Error al importar la copia de seguridad.",
  "previewFailed": "Error al previsualizar la importación.",
  "selectFilesAgain": "Por favor, seleccione los archivos de nuevo.",
  "selectFolderAgain": "Por favor, seleccione la carpeta de nuevo.",
  "inFile": "En archivo",
  "willImport": "Se importará",
  "replaceWarning": "Esto reemplazará todos los datos existentes en la bóveda.",
  "attachmentsWarning": "La copia de seguridad contiene adjuntos ({size}). La importación puede tardar un tiempo.",
  "confirmFolderImport": "Confirmar importación de carpeta",
  "confirmFileImport": "Confirmar importación de archivo",
  "filesFound": "Archivos encontrados",
  "notesToImport": "Notas para importar",
  "duplicatesFound": "Duplicados encontrados",
  "duplicateAction": "Acción con duplicados",
  "andMore": "+{count} más",
  "preserveFolders": "Preservar estructura de carpetas",
  "wholeVault": "Bóveda completa",
  "exportBackup": "Exportar copia de seguridad",
  "importBackup": "Importar copia de seguridad",
  "importFiles": "Importar archivos Markdown",
  "importMarkdown": "Importar Markdown / archivos de texto",
  "importMarkdownDesc": "Seleccionar archivos .md, .markdown o .txt para importar como notas.",
  "importFilesBtn": "Seleccionar archivos",
  "importFolderBtn": "Seleccionar carpeta",
  "onImport": "Al importar",
  "keepExisting": "Mantener existente",
  "replaceEverything": "Reemplazar todo",
  "confirmImport": "Confirmar importación"
};

// Add missing vault.canvas keys
es.vault = {
  ...es.vault,
  "canvas": {
    ...es.vault.canvas,
    "addFrame": "Añadir marco",
    "fitToPage": "Ajustar a página",
    "fitToWidth": "Ajustar a ancho",
    "zoomOut": "Alejar",
    "zoomIn": "Acercar",
    "resetView": "Restablecer vista",
    "export": "Exportar",
    "import": "Importar",
    "exportTooltip": "Exportar como .lemoncanvas",
    "importTooltip": "Importar archivo .lemoncanvas",
    "importSuccess": "Lienzo importado con éxito",
    "exportPdf": "Exportar como PDF",
    "exportPng": "Exportar como PNG",
    "exportWholeCanvas": "Lienzo completo",
    "exportSelectedFrame": "Marco seleccionado",
    "exportPdfTooltip": "Exportar lienzo a PDF",
    "exportPngTooltip": "Exportar lienzo a PNG",
    "selectFrameFirst": "Seleccione un marco primero para exportarlo individualmente",
    "newDesign": "Nuevo diseño",
    "modeDesign": "Diseño",
    "kindDesign": "Diseño",
    "frameTypes": {
      "a4": "A4 Vertical",
      "a4-landscape": "A4 Horizontal",
      "letter": "Carta",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "Cuadrado",
      "free": "Libre"
    },
    "textFrame": {
      "locked": "El texto está bloqueado porque se ha dibujado tinta sobre él",
      "unlock": "Desbloquear",
      "unlockWarning": "Desbloquear permitirá la edición, pero los trazos de tinta pueden dejar de coincidir con el contenido del texto."
    }
  }
};

// Add format capability
es.format = {
  "capability": {
    "markdown": {
      "ink": "No disponible en Markdown",
      "shapes": "No disponible en Markdown"
    },
    "plain": {
      "richFormat": "No disponible en texto plano",
      "codeBlocks": "No disponible en texto plano",
      "math": "No disponible en texto plano",
      "images": "No disponible en texto plano",
      "tables": "No disponible en texto plano",
      "ink": "No disponible en texto plano",
      "shapes": "No disponible en texto plano",
      "insert": "No disponible en texto plano",
      "design": "No disponible en texto plano",
      "layout": "No disponible en texto plano",
      "exportPdf": "No disponible en texto plano"
    },
    "html": {
      "ink": "No disponible en HTML",
      "shapes": "No disponible en HTML",
      "design": "El estilo HTML vive en la fuente",
      "layout": "El estilo HTML vive en la fuente"
    },
    "pdf": {
      "editText": "No disponible en PDF",
      "richFormat": "No disponible en PDF",
      "codeBlocks": "No disponible en PDF",
      "math": "No disponible en PDF",
      "images": "No disponible en PDF",
      "tables": "No disponible en PDF",
      "links": "No disponible en PDF",
      "insert": "No disponible en PDF",
      "design": "No disponible en PDF",
      "layout": "No disponible en PDF"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete es.ribbon.ink.color.colorStudio;
delete es.ribbon.ink.color.colorStudioHint;
delete es.ribbon.ink.color.current;
delete es.ribbon.ink.color.hexAriaLabel;
delete es.ribbon.ink.color.hexHelpInvalid;
delete es.ribbon.ink.color.hexHelpValid;
delete es.ribbon.ink.color.hexPlaceholder;
delete es.ribbon.ink.color.opacity;
delete es.ribbon.ink.color.pick;
delete es.ribbon.ink.color.pickHint;
delete es.ribbon.ink.color.quickInks;
delete es.ribbon.ink.color.recent;
delete es.ribbon.ink.color.recentEmpty;
delete es.ribbon.ink.color.studio;
delete es.ribbon.ink.draw.addCoordinateGraph;
delete es.ribbon.ink.draw.brushEngine;
delete es.ribbon.ink.draw.brushEngineHint;
delete es.ribbon.ink.draw.clearPage;
delete es.ribbon.ink.draw.clearPageHint;
delete es.ribbon.ink.draw.coordinateGraph;
delete es.ribbon.ink.draw.coordinateGraphHint;
delete es.ribbon.ink.draw.drawMode;
delete es.ribbon.ink.draw.drawModeHint;
delete es.ribbon.ink.draw.eraseMode;
delete es.ribbon.ink.draw.eraseModeHint;
delete es.ribbon.ink.draw.erasePrecision;
delete es.ribbon.ink.draw.erasePrecisionHint;
delete es.ribbon.ink.draw.eraseStroke;
delete es.ribbon.ink.draw.eraseStrokeHint;
delete es.ribbon.ink.draw.eraserLarge;
delete es.ribbon.ink.draw.eraserMedium;
delete es.ribbon.ink.draw.eraserRadius;
delete es.ribbon.ink.draw.eraserSmall;
delete es.ribbon.ink.draw.eyedropperMode;
delete es.ribbon.ink.draw.eyedropperModeHint;
delete es.ribbon.ink.draw.favPenEmpty;
delete es.ribbon.ink.draw.favouritePens;
delete es.ribbon.ink.draw.fit;
delete es.ribbon.ink.draw.fitHint;
delete es.ribbon.ink.draw.history;
delete es.ribbon.ink.draw.insertSpaceMode;
delete es.ribbon.ink.draw.insertSpaceModeHint;
delete es.ribbon.ink.draw.insertSpaceToast;
delete es.ribbon.ink.draw.lassoMode;
delete es.ribbon.ink.draw.lassoModeHint;
delete es.ribbon.ink.draw.mode;
delete es.ribbon.ink.draw.panMode;
delete es.ribbon.ink.draw.panModeHint;
delete es.ribbon.ink.draw.pens;
delete es.ribbon.ink.draw.redo;
delete es.ribbon.ink.draw.redoHint;
delete es.ribbon.ink.draw.selectMode;
delete es.ribbon.ink.draw.selectModeHint;
delete es.ribbon.ink.draw.shapeMode;
delete es.ribbon.ink.draw.shapeModeHint;
delete es.ribbon.ink.draw.shapes;
delete es.ribbon.ink.draw.stroke;
delete es.ribbon.ink.draw.strokeOpacity;
delete es.ribbon.ink.draw.strokeWidth;
delete es.ribbon.ink.draw.undo;
delete es.ribbon.ink.draw.undoHint;
delete es.ribbon.ink.draw.view;
delete es.ribbon.ink.draw.zoomIn;
delete es.ribbon.ink.draw.zoomOut;
delete es.ribbon.ink.tab.about;
delete es.ribbon.ink.tab.aboutText;
delete es.ribbon.ink.tab.noUnattachedPages;
delete es.ribbon.ink.tab.subtabAudio;
delete es.ribbon.ink.tab.subtabColor;
delete es.ribbon.ink.tab.subtabDraw;
delete es.ribbon.ink.tab.subtabPaper;
delete es.ribbon.ink.tab.subtabSelect;
delete es.ribbon.ink.tab.subtabSmart;
delete es.ribbon.view.pageDisplay;
delete es.wordGoal.wordGoal;
delete es.wordGoal.targetWords;
delete es.wordGoal.setGoal;
delete es.wordGoal.updateGoal;
delete es.wordGoal.editGoal;
delete es.wordGoal.clearGoal;
delete es.macros;
delete es.macrosHint;
delete es.lang.fa;
delete es.lang.ur;
delete es.vault.shortcuts.cards.heroTitle;
delete es.vault.shortcuts.cards.newCard;
delete es.vault.shortcuts.cards.stats;
delete es.vault.shortcuts.cards.nothingDue;
delete es.vault.shortcuts.cards.noCards;
delete es.vault.shortcuts.cards.nextCard;
delete es.vault.shortcuts.cards.emptyHint;
delete es.vault.shortcuts.cards.allCards;
delete es.vault.shortcuts.cards.reps;
delete es.vault.shortcuts.cards.deleteCard;
delete es.vault.shortcuts.graph.heroTitle;
delete es.vault.shortcuts.graph.subtitle;
delete es.vault.shortcuts.graph.emptyState;
delete es.vault.shortcuts.graph.backToVault;
delete es.vault.shortcuts.canvas.heroTitle;
delete es.vault.shortcuts.canvas.subtitle;
delete es.vault.shortcuts.canvas.emptyState;
delete es.vault.shortcuts.canvas.backToCanvases;
delete es.vault.shortcuts.canvas.cardInspector;
delete es.vault.shortcuts.canvas.canvasGuide;
delete es.vault.shortcuts.canvas.guideText1;
delete es.vault.shortcuts.canvas.guideText2;
delete es.vault.shortcuts.canvas.stats;
delete es.vault.shortcuts.canvas.newCardTitle;
delete es.vault.shortcuts.canvas.addCard;
delete es.vault.shortcuts.canvas.saving;
delete es.vault.shortcuts.canvas.saved;
delete es.vault.shortcuts.canvas.autosaveOn;
delete es.vault.shortcuts.canvas.canvasName;
delete es.vault.shortcuts.canvas.status.saving;
delete es.vault.shortcuts.canvas.status.saved;
delete es.vault.shortcuts.canvas.status.autosaveOn;
delete es.vault.shortcuts.canvas.addFrame;
delete es.vault.shortcuts.canvas.fitToPage;
delete es.vault.shortcuts.canvas.fitToWidth;
delete es.vault.shortcuts.canvas.zoomOut;
delete es.vault.shortcuts.canvas.zoomIn;
delete es.vault.shortcuts.canvas.resetView;
delete es.vault.shortcuts.canvas.export;
delete es.vault.shortcuts.canvas.import;
delete es.vault.shortcuts.canvas.exportTooltip;
delete es.vault.shortcuts.canvas.importTooltip;
delete es.vault.shortcuts.canvas.importSuccess;
delete es.vault.shortcuts.canvas.exportPdf;
delete es.vault.shortcuts.canvas.exportPng;
delete es.vault.shortcuts.canvas.exportWholeCanvas;
delete es.vault.shortcuts.canvas.exportSelectedFrame;
delete es.vault.shortcuts.canvas.exportPdfTooltip;
delete es.vault.shortcuts.canvas.exportPngTooltip;
delete es.vault.shortcuts.canvas.selectFrameFirst;
delete es.vault.shortcuts.canvas.newDesign;
delete es.vault.shortcuts.canvas.modeDesign;
delete es.vault.shortcuts.canvas.kindDesign;
delete es.vault.shortcuts.canvas.frameTypes.a4;
delete es.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete es.vault.shortcuts.canvas.frameTypes.letter;
delete es.vault.shortcuts.canvas.frameTypes["3:4"];
delete es.vault.shortcuts.canvas.frameTypes["4:3"];
delete es.vault.shortcuts.canvas.frameTypes["16:9"];
delete es.vault.shortcuts.canvas.frameTypes.square;
delete es.vault.shortcuts.canvas.frameTypes.free;
delete es.vault.shortcuts.canvas.textFrame.locked;
delete es.vault.shortcuts.canvas.textFrame.unlock;
delete es.vault.shortcuts.canvas.textFrame.unlockWarning;
delete es.vault.shortcuts.tables.heroTitle;
delete es.vault.shortcuts.tables.subtitle;
delete es.vault.shortcuts.tables.emptyState;
delete es.vault.shortcuts.tables.backToTables;
delete es.vault.shortcuts.tables.viewTable;
delete es.vault.shortcuts.tables.viewBoard;
delete es.vault.shortcuts.tables.viewGallery;
delete es.vault.shortcuts.tables.addColumn;
delete es.vault.shortcuts.tables.addRow;
delete es.vault.shortcuts.tables.priorityPlaceholder;
delete es.vault.shortcuts.tables.typePlaceholder;
delete es.vault.shortcuts.tables.optionsPlaceholder;
delete es.vault.shortcuts.tables.tablePickerPlaceholder;
delete es.vault.shortcuts.tables.addButton;
delete es.vault.shortcuts.tables.status.saving;
delete es.vault.shortcuts.tables.status.saved;
delete es.vault.shortcuts.tables.status.autosaveOn;
delete es.vault.shortcuts.tables.stats;
delete es.vault.shortcuts.tables.tableName;
delete es.vault.shortcuts.tables.columnTypes.text;
delete es.vault.shortcuts.tables.columnTypes.number;
delete es.vault.shortcuts.tables.columnTypes.select;
delete es.vault.shortcuts.tables.columnTypes.date;
delete es.vault.shortcuts.tables.columnTypes.checkbox;
delete es.vault.shortcuts.tables.columnTypes.relation;
delete es.vault.shortcuts.tables.typeBadge.text;
delete es.vault.shortcuts.tables.typeBadge.number;
delete es.vault.shortcuts.tables.typeBadge.select;
delete es.vault.shortcuts.tables.typeBadge.date;
delete es.vault.shortcuts.tables.typeBadge.checkbox;
delete es.vault.shortcuts.tables.typeBadge.relation;
delete es.vault.shortcuts.tables.tableGrid.placeholder;
delete es.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete es.vault.shortcuts.tables.tableGrid.renameColumn;
delete es.vault.shortcuts.tables.tableGrid.deleteColumn;
delete es.vault.shortcuts.tables.tableGrid.deleteRow;
delete es.vault.shortcuts.tables.tableGrid.noRows;
delete es.vault.shortcuts.tables.boardView.needsSelect;
delete es.vault.shortcuts.tables.boardView.addSelect;
delete es.vault.shortcuts.tables.boardView.ungrouped;
delete es.vault.shortcuts.tables.galleryView.noRows;
delete es.vault.shortcuts.tables.galleryView.addRow;
delete es.vault.shortcuts.tables.galleryView.checkboxYes;
delete es.vault.shortcuts.code.heroTitle;
delete es.vault.shortcuts.code.subtitle;
delete es.vault.shortcuts.code.emptyState;
delete es.vault.shortcuts.code.backToCode;
delete es.vault.shortcuts.code.fileName;
delete es.vault.shortcuts.code.languagePlaceholder;
delete es.vault.shortcuts.code.findButton;
delete es.vault.shortcuts.code.status.saving;
delete es.vault.shortcuts.code.status.saved;
delete es.vault.shortcuts.code.status.autosaveOn;
delete es.vault.shortcuts.queries.heroTitle;
delete es.vault.shortcuts.queries.description;
delete es.vault.shortcuts.queries.placeholder;
delete es.vault.shortcuts.queries.saveButton;
delete es.vault.shortcuts.queries.resultsLabel;
delete es.vault.shortcuts.queries.indexing;
delete es.vault.shortcuts.queries.notesCount;
delete es.vault.shortcuts.queries.savedQueriesLabel;
delete es.vault.shortcuts.queries.noSavedQueries;
delete es.vault.shortcuts.queries.syntaxLabel;
delete es.vault.shortcuts.extensions.heroTitle;
delete es.vault.shortcuts.extensions.description;
delete es.vault.shortcuts.extensions.installedLabel;
delete es.vault.shortcuts.extensions.activeCount;
delete es.vault.shortcuts.extensions.cssOverridesLabel;
delete es.vault.shortcuts.extensions.cssOverridesDesc;
delete es.vault.shortcuts.extensions.customThemeExample;
delete es.vault.shortcuts.extensions.applyButton;
delete es.vault.shortcuts.extensions.resetButton;
delete es.vault.shortcuts.extensions.appliedStatus;
delete es.vault.shortcuts.extensions.runtimeLogLabel;
delete es.vault.shortcuts.extensions.liveStatus;
delete es.vault.shortcuts.extensions.tabManifestLabel;
delete es.vault.shortcuts.extensions.tabManifestDesc;
delete es.vault.shortcuts.trash.heroTitle;
delete es.vault.shortcuts.trash.description;
delete es.vault.shortcuts.trash.itemCount;
delete es.vault.shortcuts.trash.loading;
delete es.vault.shortcuts.trash.emptyState;
delete es.vault.shortcuts.trash.emptyDescription;
delete es.vault.shortcuts.trash.noteSnippet;
delete es.vault.shortcuts.trash.deletedAgo;
delete es.vault.shortcuts.trash.expiresToday;
delete es.vault.shortcuts.trash.daysLeft;
delete es.vault.shortcuts.trash.restoreButton;
delete es.vault.shortcuts.trash.toastRestored;
delete es.vault.shortcuts.trash.deleteForeverDialog.title;
delete es.vault.shortcuts.trash.deleteForeverDialog.description;
delete es.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete es.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete es.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/es.json', JSON.stringify(es, null, 2) + '\n', 'utf8');
console.log('Done!');