import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/fr.json', 'utf8');
const fr = JSON.parse(content);

// Fix fr.json - add top-level "ink" key (matching en.json structure)
fr.ink = {
  "groups": {
    "draw": "Dessin",
    "color": "Couleur",
    "history": "Historique",
    "view": "Vue",
    "more": "Plus"
  },
  "more": {
    "label": "Plus",
    "hint": "Outils rarement utilisés",
    "modes": "Modes",
    "eraser": "Réglages gomme",
    "brushEngine": "Moteur de pinceau",
    "brushEngineHint": "Comportement du stylo, moteur gomme, formes et règles d'assistance",
    "shapes": "Formes",
    "coordinateGraph": "Graphique de coordonnées",
    "paper": "Papier",
    "paperStudio": "Studio papier",
    "smartInk": "Encre intelligente",
    "handwriting": "Reconnaissance écriture",
    "equation": "Équation",
    "resultsSearch": "Résultats et recherche",
    "audio": "Audio",
    "record": "Enregistrer",
    "stop": "Arrêter",
    "play": "Lecture",
    "pause": "Pause",
    "replayInk": "Rejouer encre",
    "removeAudio": "Supprimer audio",
    "overlay": "Superposition",
    "fullPage": "Pleine page",
    "inkOverText": "Encre sur texte",
    "destructive": "Destructif",
    "removeInk": "Supprimer encre",
    "attachOld": "Attacher ancienne page",
    "disabled": "Sélectionnez d'abord les traits avec le lasso"
  },
  "draw": {
    "pen": "Stylo",
    "penHint": "Choisir un stylo",
    "eraser": "Gomme",
    "eraserHint": "Effacer les traits",
    "lasso": "Lasso",
    "lassoHint": "Sélectionner les traits en les encerclant",
    "width": "Largeur",
    "saveFavPen": "Enregistrer le stylo actuel comme favori",
    "removeFavPen": "Supprimer stylo favori",
    "noFavPens": "enregistrez vos configurations de stylos préférées ici (max 8)"
  },
  "color": {
    "picker": "Couleur",
    "pickerHint": "Ouvrir mélangeur de couleurs, palettes et historique"
  },
  "mode": {
    "select": "Sélection",
    "shape": "Formes",
    "pan": "Panoramique",
    "pick": "Pipette",
    "insertSpace": "Insérer espace"
  },
  "groups": {
    "draw": "Dessin",
    "color": "Couleur",
    "history": "Historique",
    "view": "Vue",
    "more": "Plus",
    "select": "Sélection",
    "object": "Objet",
    "strokes": "Traits",
    "transform": "Transformation",
    "template": "Modèle",
    "pageSize": "Taille page",
    "pages": "Pages",
    "paperStudio": "Studio papier",
    "recognise": "Reconnaître",
    "results": "Résultats",
    "record": "Enregistrement",
    "playback": "Lecture",
    "manage": "Gérer"
  },
  "history": {
    "undo": "Annuler",
    "undoHint": "Annuler le dernier trait",
    "redo": "Rétablir",
    "redoHint": "Rétablir"
  },
  "view": {
    "zoomOut": "Dézoomer",
    "zoomIn": "Zoomer",
    "fit": "Ajuster",
    "fitHint": "Ajuster la page à l'encre"
  },
  "select": {
    "select": "Sélection",
    "selectHint": "Sélectionner, déplacer, redimensionner et pivoter objets",
    "lasso": "Lasso",
    "lassoHint": "Sélectionner traits en les encerclant"
  },
  "object": {
    "delete": "Supprimer",
    "deleteHint": "Supprimer l'objet sélectionné",
    "front": "Devant",
    "frontHint": "Au premier plan",
    "back": "Derrière",
    "backHint": "À l'arrière-plan"
  },
  "strokes": {
    "apply": "Appliquer",
    "applyHint": "Confirmer déplacement, échelle ou rotation",
    "recolor": "Recolorer",
    "recolorHint": "Repeindre la sélection avec l'encre actuelle",
    "delete": "Supprimer",
    "deleteHint": "Supprimer les traits sélectionnés",
    "deselect": "Désélectionner",
    "deselectHint": "Effacer la sélection"
  },
  "transform": {
    "studio": "Studio de sélection",
    "studioHint": "Déplacer, redimensionner et pivoter la sélection précisément",
    "disabled": "Sélectionnez d'abord les traits avec le lasso"
  },
  "paper": {
    "template": "Modèle papier",
    "tone": "Teinte papier",
    "size": "Taille page",
    "studio": "Studio papier",
    "studioHint": "Toutes options papier en un lieu",
    "clear": "Effacer page",
    "clearHint": "Supprimer tous traits sur cette page"
  },
  "pages": {
    "prev": "Page précédente",
    "next": "Page suivante",
    "page": "page {num}"
  },
  "smart": {
    "handwriting": "Écriture manuscrite",
    "handwritingHint": "Transformer sélection lasso ou page visible en texte",
    "equation": "Équation",
    "equationHint": "Convertir maths manuscrites en LaTeX",
    "results": "Résultats et recherche",
    "resultsHint": "Texte reconnu, insérer sur page, rechercher toute écriture"
  },
  "audio": {
    "record": "Enregistrer",
    "recordHint": "Enregistrer audio pendant écriture; chaque trait horodaté",
    "stop": "Arrêter",
    "play": "Lecture",
    "playHint": "Lire enregistrement et redessiner page comme écrite",
    "pause": "Pause",
    "replayInk": "Rejouer encre",
    "replayInkHint": "Rejouer traits sans son",
    "noRecording": "aucun enregistrement",
    "studio": "Studio audio",
    "studioHint": "Naviguer dans l'enregistrement",
    "remove": "Supprimer audio",
    "removeHint": "Supprimer enregistrement de cette page",
    "recording": "enregistrement…"
  },
  "overlay": {
    "fullPage": "Pleine page",
    "inkOverText": "Encre sur texte",
    "fullPageHint": "Basculer vers surface encre plein page",
    "inkOverTextHint": "Afficher encre sur texte note en mode lecture"
  },
  "tab": {
    "handwriting": "Écriture manuscrite",
    "startInking": "Commencer encrage",
    "startInkingHint": "Ajouter page écriture à cette note",
    "attachOldPage": "Attacher ancienne page",
    "attachOldPageHint": "Récupérer page écriture avant que Ink ne passe dans notes",
    "noAttachable": "Aucune page encre non attachée.",
    "ink": "Encre",
    "overlay": "Superposition",
    "handwritingPage": "Page écriture manuscrite",
    "marks": "{count} marques",
    "saving": "Sauvegarde...",
    "saved": "Sauvegardé",
    "autosave": "Sauvegarde auto activée",
    "attachOld": "Attacher page antérieure",
    "attachOldHint": "Attacher page écriture créée précédemment à cette note",
    "statusSaving": "sauvegarde…",
    "statusSaved": "sauvegardé",
    "statusAutosave": "sauvegarde auto activée",
    "removeInk": "Supprimer encre",
    "removeInkHint": "Supprimer toute écriture dans cette note"
  }
};

// Fix ribbon.ink to match en.json structure
fr.ribbon.ink = {
  "draw": {
    "mode": "Mode",
    "pens": "Stylos",
    "favouritePens": "Stylos favoris",
    "stroke": "Trait",
    "eraser": "Gomme",
    "history": "Historique",
    "view": "Vue",
    "shapes": "Formes",
    "drawMode": "Dessin",
    "drawModeHint": "Dessiner avec le stylo actuel",
    "shapeMode": "Formes",
    "shapeModeHint": "Dessiner lignes, boîtes, cercles et graphiques coordonnées",
    "selectMode": "Sélection",
    "selectModeHint": "Sélectionner, déplacer, redimensionner et pivoter objets",
    "lassoMode": "Lasso",
    "lassoModeHint": "Sélectionner traits en les encerclant",
    "eraseMode": "Gomme",
    "eraseModeHint": "Effacer traits",
    "panMode": "Panoramique",
    "panModeHint": "Déplacer la page",
    "eyedropperMode": "Pipette",
    "eyedropperModeHint": "Choisir une couleur sur la page",
    "insertSpaceMode": "Insérer espace",
    "insertSpaceModeHint": "Glisser pour insérer ou supprimer espace vertical entre traits d'encre",
    "brushEngine": "Moteur pinceau",
    "brushEngineHint": "Comportement stylo, moteur gomme, formes et règles assistées",
    "eraseStroke": "Trait",
    "eraseStrokeHint": "Effacer traits entiers",
    "erasePrecision": "Précision",
    "erasePrecisionHint": "Gomme de précision",
    "eraserSmall": "Petite gomme (12px)",
    "eraserMedium": "Gomme moyenne (26px)",
    "eraserLarge": "Grande gomme (50px)",
    "eraserRadius": "rayon",
    "undo": "Annuler",
    "undoHint": "Annuler dernier trait",
    "redo": "Rétablir",
    "redoHint": "Rétablir",
    "zoomOut": "Dézoomer",
    "zoomIn": "Zoomer",
    "fit": "Ajuster",
    "fitHint": "Ajuster page à l'encre",
    "clearPage": "Effacer page",
    "clearPageHint": "Supprimer tous traits sur cette page",
    "coordinateGraph": "Graphique coordonnées",
    "coordinateGraphHint": "Insérer graphique coordonnées avec axes, grille et graduations",
    "addCoordinateGraph": "Ajouter graphique coordonnées",
    "insertSpaceToast": "Le texte ne bouge pas. L'encre sous la ligne s'éloigne du texte sur lequel elle a été écrite.",
    "snapShapes": "Accrocher formes",
    "snapShapesHint": "Convertir automatiquement traits libres en formes géométriques",
    "comingSoon": "Bientôt disponible",
    "saveFavPen": "Sauvegarder stylo actuel comme favori",
    "removeFavPen": "Supprimer stylo favori",
    "favPenEmpty": "enregistrez vos configurations de stylos préférées ici (max 8)",
    "strokeWidth": "largeur",
    "strokeOpacity": "opacité"
  },
  "color": {
    "current": "Actuel",
    "hexPlaceholder": "#RRGGBB",
    "hexAriaLabel": "Couleur hexadécimale",
    "hexHelpValid": "3 ou 6 chiffres hex, avec ou sans #",
    "hexHelpInvalid": "Hex invalide — appuyez Échap pour annuler",
    "quickInks": "Encres rapides",
    "recent": "Récents",
    "recentEmpty": "les couleurs que vous utilisez apparaissent ici",
    "studio": "Studio",
    "colorStudio": "Studio couleur",
    "colorStudioHint": "Mélangeur, palettes, opacité et couleurs personnalisées",
    "pick": "Pipette",
    "pickHint": "Choisir une couleur sur la page",
    "opacity": "opacité"
  },
  "select": {
    "select": "Sélection",
    "selectHint": "Sélectionner, déplacer, redimensionner et pivoter objets",
    "lasso": "Lasso",
    "lassoHint": "Sélectionner traits en les encerclant",
    "selectionInfo": "Objet: {type}",
    "strokesSelected": "{count} traits",
    "nothingSelected": "rien sélectionné",
    "apply": "Appliquer",
    "applyHint": "Valider déplacement, échelle ou rotation",
    "recolor": "Recolorer",
    "recolorHint": "Repeindre sélection avec encre actuelle",
    "delete": "Supprimer",
    "deleteHint": "Supprimer traits sélectionnés",
    "deselect": "Désélectionner",
    "deselectHint": "Effacer sélection",
    "transform": "Transformer",
    "selectionStudio": "Studio sélection",
    "selectionStudioHint": "Déplacer, redimensionner et pivoter sélection précisément",
    "selectFirst": "Sélectionnez d'abord les traits au lasso",
    "selectObjectFirst": "Sélectionnez un objet avec l'outil Sélection"
  },
  "paper": {
    "template": "Modèle",
    "paperTemplate": "Modèle papier",
    "paperTone": "Teinte papier",
    "pageSize": "Taille page",
    "pages": "Pages",
    "previousPage": "Page précédente",
    "nextPage": "Page suivante",
    "pageNumber": "page {num}",
    "studio": "Studio",
    "paperStudio": "Studio papier",
    "paperStudioHint": "Toutes options papier en un lieu",
    "clearPage": "Effacer page",
    "clearPageHint": "Supprimer tous traits sur cette page"
  },
  "frames": {
    "template": "Modèle",
    "paperTemplate": "Modèle papier",
    "paperTone": "Teinte papier",
    "pageSize": "Taille page",
    "pages": "Pages",
    "previousPage": "Page précédente",
    "nextPage": "Page suivante",
    "pageNumber": "page {num}",
    "studio": "Studio",
    "paperStudio": "Studio papier",
    "paperStudioHint": "Toutes options papier en un lieu",
    "coordinateGraph": "Graphique coordonnées",
    "coordinateGraphHint": "Insérer graphique coordonnées avec axes, grille et graduations",
    "addCoordinateGraph": "Ajouter graphique coordonnées",
    "clearPage": "Effacer page",
    "clearPageHint": "Supprimer tous traits sur cette page"
  },
  "objects": {
    "select": "Sélection",
    "selectHint": "Sélectionner, déplacer, redimensionner et pivoter objets",
    "lasso": "Lasso",
    "lassoHint": "Sélectionner traits en les encerclant",
    "shapes": "Formes",
    "shapesHint": "Insérer rectangles, cercles, lignes, flèches et polygones",
    "stickers": "Autocollants",
    "stickersHint": "Insérer autocollants décoratifs",
    "textbox": "Zone de texte",
    "textboxHint": "Insérer zone de texte",
    "sticky": "Note adhésive",
    "stickyHint": "Insérer note adhésive",
    "selectionInfo": "Objet: {type}",
    "strokesSelected": "{count} traits",
    "nothingSelected": "rien sélectionné",
    "apply": "Appliquer",
    "applyHint": "Valider déplacement, échelle ou rotation",
    "recolor": "Recolorer",
    "recolorHint": "Repeindre sélection avec encre actuelle",
    "delete": "Supprimer",
    "deleteHint": "Supprimer objet sélectionné",
    "deselect": "Désélectionner",
    "deselectHint": "Effacer sélection",
    "transform": "Transformer",
    "selectionStudio": "Studio sélection",
    "selectionStudioHint": "Déplacer, redimensionner et pivoter sélection précisément",
    "selectFirst": "Sélectionnez traits au lasso d'abord",
    "selectObjectFirst": "Sélectionnez objet avec outil Sélection"
  },
  "smart": {
    "recognise": "Reconnaître",
    "handwriting": "Écriture manuscrite",
    "handwritingHint": "Transformer sélection lasso ou page visible en texte",
    "equation": "Équation",
    "equationHint": "Convertir maths manuscrites en LaTeX",
    "resultsAndSearch": "Résultats et recherche",
    "resultsSearch": "Résultats et recherche",
    "resultsSearchHint": "Texte reconnu, insérer sur page, rechercher toute écriture"
  },
  "audio": {
    "record": "Enregistrer",
    "recordLabel": "Enregistrer audio pendant écriture; chaque trait horodaté",
    "stop": "Arrêter",
    "stopLabel": "Arrêter enregistrement",
    "playback": "Lecture",
    "play": "Lecture",
    "playHint": "Lire enregistrement et redessiner page comme écrite",
    "pause": "Pause",
    "replayInk": "Rejouer encre",
    "replayInkHint": "Rejouer traits sans son",
    "noRecording": "pas d'enregistrement",
    "manage": "Gérer",
    "audioStudio": "Studio audio",
    "audioStudioHint": "Naviguer dans l'enregistrement",
    "removeAudio": "Supprimer audio",
    "removeAudioHint": "Supprimer enregistrement de cette page",
    "recordFirst": "Enregistrez d'abord de l'audio"
  },
  "tab": {
    "ink": "Encre",
    "handwriting": "Écriture manuscrite",
    "startInking": "Commencer encrage",
    "startInkingHint": "Ajouter page écriture à cette note",
    "attachOldPage": "Attacher ancienne page",
    "attachOldPageHint": "Récupérer page écriture avant qu'Ink ne passe dans notes",
    "noUnattachedPages": "Aucune page encre non attachée.",
    "about": "À propos",
    "aboutText": "Chaque note peut porter sa propre page écriture. Stylos, couleurs, sélection, papier, encre intelligente et audio apparaissent ici une fois commencé.",
    "subtabDraw": "Dessin",
    "subtabFrames": "Cadres",
    "subtabObjects": "Objets",
    "subtabView": "Vue",
    "subtabColor": "Couleur",
    "subtabSelect": "Sélection",
    "subtabPaper": "Papier",
    "subtabSmart": "Encre intelligente",
    "subtabAudio": "Audio",
    "overlay": "Superposition",
    "fullPage": "Pleine page",
    "inkOverText": "Encre sur texte",
    "fullPageHint": "Basculer vers surface encre pleine page",
    "inkOverTextHint": "Afficher encre sur texte note en mode lecture",
    "marks": "{count} marques",
    "statusSaving": "sauvegarde…",
    "statusSaved": "sauvegardé",
    "statusAutosave": "sauvegarde auto activée",
    "removeInk": "Supprimer encre",
    "removeInkHint": "Supprimer toute écriture dans cette note"
  },
  "eraserModes": {
    "stroke": "Trait",
    "precision": "Précision"
  },
  "groups": {
    "draw": "Dessin",
    "frames": "Cadres",
    "objects": "Objets",
    "view": "Vue",
    "more": "Plus"
  },
  "more": {
    "label": "Plus",
    "hint": "Outils rarement utilisés",
    "modes": "Modes",
    "eraser": "Réglages gomme",
    "brushEngine": "Moteur pinceau",
    "brushEngineHint": "Comportement stylo, moteur gomme, formes et règles assistées",
    "shapes": "Formes",
    "coordinateGraph": "Graphique coordonnées",
    "paper": "Papier",
    "paperStudio": "Studio papier",
    "smartInk": "Encre intelligente",
    "handwriting": "Écriture manuscrite",
    "equation": "Équation",
    "resultsSearch": "Résultats et recherche",
    "audio": "Audio",
    "record": "Enregistrer",
    "stop": "Arrêter",
    "play": "Lecture",
    "pause": "Pause",
    "replayInk": "Rejouer encre",
    "removeAudio": "Supprimer audio",
    "overlay": "Superposition",
    "fullPage": "Pleine page",
    "inkOverText": "Encre sur texte",
    "destructive": "Destructif",
    "removeInk": "Supprimer encre",
    "attachOld": "Attacher ancienne page",
    "disabled": "Sélectionnez d'abord les traits au lasso"
  },
  "draw": {
    "pen": "Stylo",
    "penHint": "Choisir un stylo",
    "eraser": "Gomme",
    "eraserHint": "Effacer traits",
    "lasso": "Lasso",
    "lassoHint": "Sélectionner traits en les encerclant",
    "width": "Largeur",
    "saveFavPen": "Sauvegarder stylo actuel comme favori",
    "removeFavPen": "Supprimer stylo favori",
    "noFavPens": "enregistrez vos configurations de stylos préférées ici (max 8)"
  },
  "color": {
    "picker": "Couleur",
    "pickerHint": "Ouvrir mélangeur couleurs, palettes et historique"
  },
  "tab": {
    "handwriting": "Écriture manuscrite",
    "startInking": "Commencer encrage",
    "startInkingHint": "Ajouter page écriture à cette note",
    "attachOldPage": "Attacher ancienne page",
    "attachOldPageHint": "Récupérer page écriture avant qu'Ink ne passe dans notes",
    "noAttachable": "Aucune page encre non attachée.",
    "ink": "Encre",
    "overlay": "Superposition",
    "fullPage": "Pleine page",
    "inkOverText": "Encre sur texte",
    "fullPageHint": "Basculer vers surface encre pleine page",
    "inkOverTextHint": "Afficher encre sur texte note en mode lecture",
    "handwritingPage": "Page écriture manuscrite",
    "marks": "{count} marques",
    "statusSaving": "sauvegarde…",
    "statusSaved": "sauvegardé",
    "statusAutosave": "sauvegarde auto activée",
    "removeInk": "Supprimer encre",
    "removeInkHint": "Supprimer toute écriture dans cette note"
  }
};

// Add missing ribbon.view keys
fr.ribbon.view = {
  ...fr.ribbon.view,
  "navigation": "Navigation",
  "pageWidth": "Largeur page",
  "onePage": "Une page",
  "twoPages": "Deux pages",
  "pageScroll": "Page et défilement",
  "narrow": "Étroit",
  "medium": "Moyen",
  "wide": "Large",
  "full": "Plein",
  "attachTable": "Attacher tableau",
  "importPdf": "Importer PDF",
  "importPdfHint": "Importer fichier PDF comme nouvelle note",
  "importPdfPrompt": "Importer ce PDF comme nouvelle note ?",
  "pdfImported": "PDF importé comme note",
  "pdfImportError": "Échec importation PDF",
  "prevPage": "Page précédente",
  "nextPage": "Page suivante",
  "page": "Page {current} / {total}",
  "resetZoom": "Réinitialiser zoom",
  "print": "Imprimer",
  "download": "Télécharger",
  "loadingPdf": "Chargement PDF…",
  "pdfLoadError": "Échec chargement PDF",
  "noPdf": "Aucun PDF chargé",
  "editorA11y": "Éditeur et accessibilité",
  "annotate": {
    "enter": "Annoter",
    "enterHint": "Dessiner sur cette page PDF",
    "exit": "Quitter annotation",
    "exitHint": "Arrêter dessin et revenir à affichage",
    "save": "Sauvegarder en PDF",
    "saveHint": "Sauvegarder annotations dans fichier PDF",
    "saved": "Annotations sauvegardées en PDF",
    "export": "Exporter PDF",
    "exportHint": "Télécharger copie avec ou sans annotations éditables",
    "exportAnnotated": "Exporter annoté",
    "exportAnnotatedHint": "Télécharger avec annotations (éditable à la réouverture)",
    "exportFlattened": "Exporter aplati",
    "exportFlattenedHint": "Télécharger annotations aplaties (non éditable)",
    "exported": "PDF exporté",
    "exportedFlattened": "PDF aplati exporté"
  }
};

// Add missing ribbon.insert keys
fr.ribbon.insert = {
  ...fr.ribbon.insert,
  "mathBlock": "Bloc math",
  "mathBlockHint": "Insérer bloc math ($$ … $$)",
  "htmlMath": "Math (KaTeX)",
  "htmlMathHint": "Insérer balisage math KaTeX rendu avec référence CSS locale (format HTML uniquement)"
};

// Add missing fileMenu keys
fr.fileMenu = {
  ...fr.fileMenu,
  "printExport": {
    ...fr.fileMenu.printExport,
    "htmlEmbedded": "Fichier unique (images intégrées)",
    "openAsCanvas": "Ouvrir comme toile",
    "openAsCanvasHint": "Créer une toile avec contenu de cette note dans cadre A4",
    "canvasCreated": "Toile créée : {name}"
  },
  "migration": {
    "title": "Migration format note",
    "message": "Cette version LemonNote simplifie formats notes. Notes YAML, XML, JSON, TOML, CSV, INI, CSS, JavaScript, TypeScript, Python, Rust, Bash, SQL seront converties en Markdown avec blocs code clôturés, conservant leur contenu exact.",
    "backupTitle": "Créer sauvegarde avant migration",
    "backupMessage": "Avant migration, sauvegarde complète du coffre sera créée. Fortement recommandé pour pouvoir restaurer si problème.",
    "backupButton": "Créer sauvegarde et migrer",
    "skipButton": "Ignorer sauvegarde (non recommandé)",
    "backupSuccess": "Sauvegarde créée avec succès. Migration démarre…",
    "backupFailed": "Échec sauvegarde: {error}. Migration annulée pour protéger vos données.",
    "migrationComplete": "Migration terminée. {count} note(s) convertie(s).",
    "migrationFailed": "Migration échouée: {error}"
  }
};

// Add missing backup keys
fr.backup = {
  ...fr.backup,
  "exportSuccess": "Sauvegarde exportée avec succès.",
  "largeWarning": "Gros fichier sauvegarde — envisager division ou stockage externe.",
  "exportFailed": "Échec export sauvegarde.",
  "readFailed": "Échec lecture fichier sauvegarde.",
  "importFailed": "Échec importation sauvegarde.",
  "previewFailed": "Échec aperçu importation.",
  "selectFilesAgain": "Sélectionnez à nouveau les fichiers.",
  "selectFolderAgain": "Sélectionnez à nouveau le dossier.",
  "inFile": "Dans fichier",
  "willImport": "Sera importé",
  "replaceWarning": "Ceci remplacera toutes données existantes du coffre.",
  "attachmentsWarning": "Sauvegarde contient pièces jointes ({size}). Importation peut prendre temps.",
  "confirmFolderImport": "Confirmer importation dossier",
  "confirmFileImport": "Confirmer importation fichier",
  "filesFound": "Fichiers trouvés",
  "notesToImport": "Notes à importer",
  "duplicatesFound": "Doublons trouvés",
  "duplicateAction": "Action sur doublons",
  "andMore": "+{count} de plus",
  "preserveFolders": "Préserver structure dossiers",
  "wholeVault": "Coffre complet",
  "exportBackup": "Exporter sauvegarde",
  "importBackup": "Importer sauvegarde",
  "importFiles": "Importer fichiers Markdown",
  "importMarkdown": "Importer Markdown / fichiers texte",
  "importMarkdownDesc": "Sélectionner fichiers .md, .markdown ou .txt à importer comme notes.",
  "importFilesBtn": "Sélectionner fichiers",
  "importFolderBtn": "Sélectionner dossier",
  "onImport": "À l'importation",
  "keepExisting": "Conserver existant",
  "replaceEverything": "Remplacer tout",
  "confirmImport": "Confirmer importation"
};

// Add missing vault.canvas keys
fr.vault = {
  ...fr.vault,
  "canvas": {
    ...fr.vault.canvas,
    "addFrame": "Ajouter cadre",
    "fitToPage": "Ajuster à la page",
    "fitToWidth": "Ajuster à la largeur",
    "zoomOut": "Dézoomer",
    "zoomIn": "Zoomer",
    "resetView": "Réinitialiser vue",
    "export": "Exporter",
    "import": "Importer",
    "exportTooltip": "Exporter en .lemoncanvas",
    "importTooltip": "Importer fichier .lemoncanvas",
    "importSuccess": "Toile importée avec succès",
    "exportPdf": "Exporter en PDF",
    "exportPng": "Exporter en PNG",
    "exportWholeCanvas": "Toile entière",
    "exportSelectedFrame": "Cadre sélectionné",
    "exportPdfTooltip": "Exporter toile en PDF",
    "exportPngTooltip": "Exporter toile en PNG",
    "selectFrameFirst": "Sélectionner cadre d'abord pour export individuel",
    "newDesign": "Nouveau design",
    "modeDesign": "Design",
    "kindDesign": "Design",
    "frameTypes": {
      "a4": "A4 Portrait",
      "a4-landscape": "A4 Paysage",
      "letter": "Lettre",
      "3:4": "3:4",
      "4:3": "4:3",
      "16:9": "16:9",
      "square": "Carré",
      "free": "Libre"
    },
    "textFrame": {
      "locked": "Texte verrouillé car encre dessinée dessus",
      "unlock": "Déverrouiller",
      "unlockWarning": "Le déverrouillage permettra l'édition, mais traits encre peuvent ne plus correspondre au contenu texte."
    }
  }
};

// Add format capability
fr.format = {
  "capability": {
    "markdown": {
      "ink": "Non disponible en Markdown",
      "shapes": "Non disponible en Markdown"
    },
    "plain": {
      "richFormat": "Non disponible en texte brut",
      "codeBlocks": "Non disponible en texte brut",
      "math": "Non disponible en texte brut",
      "images": "Non disponible en texte brut",
      "tables": "Non disponible en texte brut",
      "ink": "Non disponible en texte brut",
      "shapes": "Non disponible en texte brut",
      "insert": "Non disponible en texte brut",
      "design": "Non disponible en texte brut",
      "layout": "Non disponible en texte brut",
      "exportPdf": "Non disponible en texte brut"
    },
    "html": {
      "ink": "Non disponible en HTML",
      "shapes": "Non disponible en HTML",
      "design": "Style HTML dans source",
      "layout": "Style HTML dans source"
    },
    "pdf": {
      "editText": "Non disponible en PDF",
      "richFormat": "Non disponible en PDF",
      "codeBlocks": "Non disponible en PDF",
      "math": "Non disponible en PDF",
      "images": "Non disponible en PDF",
      "tables": "Non disponible en PDF",
      "links": "Non disponible en PDF",
      "insert": "Non disponible en PDF",
      "design": "Non disponible en PDF",
      "layout": "Non disponible en PDF"
    },
    "canvas": {}
  }
};

// Remove extra keys
// Remove old ribbon.ink keys that don't match en.json structure
delete fr.ribbon.ink.color.colorStudio;
delete fr.ribbon.ink.color.colorStudioHint;
delete fr.ribbon.ink.color.current;
delete fr.ribbon.ink.color.hexAriaLabel;
delete fr.ribbon.ink.color.hexHelpInvalid;
delete fr.ribbon.ink.color.hexHelpValid;
delete fr.ribbon.ink.color.hexPlaceholder;
delete fr.ribbon.ink.color.opacity;
delete fr.ribbon.ink.color.pick;
delete fr.ribbon.ink.color.pickHint;
delete fr.ribbon.ink.color.quickInks;
delete fr.ribbon.ink.color.recent;
delete fr.ribbon.ink.color.recentEmpty;
delete fr.ribbon.ink.color.studio;
delete fr.ribbon.ink.draw.addCoordinateGraph;
delete fr.ribbon.ink.draw.brushEngine;
delete fr.ribbon.ink.draw.brushEngineHint;
delete fr.ribbon.ink.draw.clearPage;
delete fr.ribbon.ink.draw.clearPageHint;
delete fr.ribbon.ink.draw.coordinateGraph;
delete fr.ribbon.ink.draw.coordinateGraphHint;
delete fr.ribbon.ink.draw.drawMode;
delete fr.ribbon.ink.draw.drawModeHint;
delete fr.ribbon.ink.draw.eraseMode;
delete fr.ribbon.ink.draw.eraseModeHint;
delete fr.ribbon.ink.draw.erasePrecision;
delete fr.ribbon.ink.draw.erasePrecisionHint;
delete fr.ribbon.ink.draw.eraseStroke;
delete fr.ribbon.ink.draw.eraseStrokeHint;
delete fr.ribbon.ink.draw.eraserLarge;
delete fr.ribbon.ink.draw.eraserMedium;
delete fr.ribbon.ink.draw.eraserRadius;
delete fr.ribbon.ink.draw.eraserSmall;
delete fr.ribbon.ink.draw.eyedropperMode;
delete fr.ribbon.ink.draw.eyedropperModeHint;
delete fr.ribbon.ink.draw.favPenEmpty;
delete fr.ribbon.ink.draw.favouritePens;
delete fr.ribbon.ink.draw.fit;
delete fr.ribbon.ink.draw.fitHint;
delete fr.ribbon.ink.draw.history;
delete fr.ribbon.ink.draw.insertSpaceMode;
delete fr.ribbon.ink.draw.insertSpaceModeHint;
delete fr.ribbon.ink.draw.insertSpaceToast;
delete fr.ribbon.ink.draw.lassoMode;
delete fr.ribbon.ink.draw.lassoModeHint;
delete fr.ribbon.ink.draw.mode;
delete fr.ribbon.ink.draw.panMode;
delete fr.ribbon.ink.draw.panModeHint;
delete fr.ribbon.ink.draw.pens;
delete fr.ribbon.ink.draw.redo;
delete fr.ribbon.ink.draw.redoHint;
delete fr.ribbon.ink.draw.selectMode;
delete fr.ribbon.ink.draw.selectModeHint;
delete fr.ribbon.ink.draw.shapeMode;
delete fr.ribbon.ink.draw.shapeModeHint;
delete fr.ribbon.ink.draw.shapes;
delete fr.ribbon.ink.draw.stroke;
delete fr.ribbon.ink.draw.strokeOpacity;
delete fr.ribbon.ink.draw.strokeWidth;
delete fr.ribbon.ink.draw.undo;
delete fr.ribbon.ink.draw.undoHint;
delete fr.ribbon.ink.draw.view;
delete fr.ribbon.ink.draw.zoomIn;
delete fr.ribbon.ink.draw.zoomOut;
delete fr.ribbon.ink.tab.about;
delete fr.ribbon.ink.tab.aboutText;
delete fr.ribbon.ink.tab.noUnattachedPages;
delete fr.ribbon.ink.tab.subtabAudio;
delete fr.ribbon.ink.tab.subtabColor;
delete fr.ribbon.ink.tab.subtabDraw;
delete fr.ribbon.ink.tab.subtabPaper;
delete fr.ribbon.ink.tab.subtabSelect;
delete fr.ribbon.ink.tab.subtabSmart;
delete fr.ribbon.view.pageDisplay;
delete fr.wordGoal.wordGoal;
delete fr.wordGoal.targetWords;
delete fr.wordGoal.setGoal;
delete fr.wordGoal.updateGoal;
delete fr.wordGoal.editGoal;
delete fr.wordGoal.clearGoal;
delete fr.macros;
delete fr.macrosHint;
delete fr.vault.shortcuts.cards.heroTitle;
delete fr.vault.shortcuts.cards.newCard;
delete fr.vault.shortcuts.cards.stats;
delete fr.vault.shortcuts.cards.nothingDue;
delete fr.vault.shortcuts.cards.noCards;
delete fr.vault.shortcuts.cards.nextCard;
delete fr.vault.shortcuts.cards.emptyHint;
delete fr.vault.shortcuts.cards.allCards;
delete fr.vault.shortcuts.cards.reps;
delete fr.vault.shortcuts.cards.deleteCard;
delete fr.vault.shortcuts.graph.heroTitle;
delete fr.vault.shortcuts.graph.subtitle;
delete fr.vault.shortcuts.graph.emptyState;
delete fr.vault.shortcuts.graph.backToVault;
delete fr.vault.shortcuts.canvas.heroTitle;
delete fr.vault.shortcuts.canvas.subtitle;
delete fr.vault.shortcuts.canvas.emptyState;
delete fr.vault.shortcuts.canvas.backToCanvases;
delete fr.vault.shortcuts.canvas.cardInspector;
delete fr.vault.shortcuts.canvas.canvasGuide;
delete fr.vault.shortcuts.canvas.guideText1;
delete fr.vault.shortcuts.canvas.guideText2;
delete fr.vault.shortcuts.canvas.stats;
delete fr.vault.shortcuts.canvas.newCardTitle;
delete fr.vault.shortcuts.canvas.addCard;
delete fr.vault.shortcuts.canvas.saving;
delete fr.vault.shortcuts.canvas.saved;
delete fr.vault.shortcuts.canvas.autosaveOn;
delete fr.vault.shortcuts.canvas.canvasName;
delete fr.vault.shortcuts.canvas.status.saving;
delete fr.vault.shortcuts.canvas.status.saved;
delete fr.vault.shortcuts.canvas.status.autosaveOn;
delete fr.vault.shortcuts.canvas.addFrame;
delete fr.vault.shortcuts.canvas.fitToPage;
delete fr.vault.shortcuts.canvas.fitToWidth;
delete fr.vault.shortcuts.canvas.zoomOut;
delete fr.vault.shortcuts.canvas.zoomIn;
delete fr.vault.shortcuts.canvas.resetView;
delete fr.vault.shortcuts.canvas.export;
delete fr.vault.shortcuts.canvas.import;
delete fr.vault.shortcuts.canvas.exportTooltip;
delete fr.vault.shortcuts.canvas.importTooltip;
delete fr.vault.shortcuts.canvas.importSuccess;
delete fr.vault.shortcuts.canvas.exportPdf;
delete fr.vault.shortcuts.canvas.exportPng;
delete fr.vault.shortcuts.canvas.exportWholeCanvas;
delete fr.vault.shortcuts.canvas.exportSelectedFrame;
delete fr.vault.shortcuts.canvas.exportPdfTooltip;
delete fr.vault.shortcuts.canvas.exportPngTooltip;
delete fr.vault.shortcuts.canvas.selectFrameFirst;
delete fr.vault.shortcuts.canvas.newDesign;
delete fr.vault.shortcuts.canvas.modeDesign;
delete fr.vault.shortcuts.canvas.kindDesign;
delete fr.vault.shortcuts.canvas.frameTypes.a4;
delete fr.vault.shortcuts.canvas.frameTypes["a4-landscape"];
delete fr.vault.shortcuts.canvas.frameTypes.letter;
delete fr.vault.shortcuts.canvas.frameTypes["3:4"];
delete fr.vault.shortcuts.canvas.frameTypes["4:3"];
delete fr.vault.shortcuts.canvas.frameTypes["16:9"];
delete fr.vault.shortcuts.canvas.frameTypes.square;
delete fr.vault.shortcuts.canvas.frameTypes.free;
delete fr.vault.shortcuts.canvas.textFrame.locked;
delete fr.vault.shortcuts.canvas.textFrame.unlock;
delete fr.vault.shortcuts.canvas.textFrame.unlockWarning;
delete fr.vault.shortcuts.tables.heroTitle;
delete fr.vault.shortcuts.tables.subtitle;
delete fr.vault.shortcuts.tables.emptyState;
delete fr.vault.shortcuts.tables.backToTables;
delete fr.vault.shortcuts.tables.viewTable;
delete fr.vault.shortcuts.tables.viewBoard;
delete fr.vault.shortcuts.tables.viewGallery;
delete fr.vault.shortcuts.tables.addColumn;
delete fr.vault.shortcuts.tables.addRow;
delete fr.vault.shortcuts.tables.priorityPlaceholder;
delete fr.vault.shortcuts.tables.typePlaceholder;
delete fr.vault.shortcuts.tables.optionsPlaceholder;
delete fr.vault.shortcuts.tables.tablePickerPlaceholder;
delete fr.vault.shortcuts.tables.addButton;
delete fr.vault.shortcuts.tables.status.saving;
delete fr.vault.shortcuts.tables.status.saved;
delete fr.vault.shortcuts.tables.status.autosaveOn;
delete fr.vault.shortcuts.tables.stats;
delete fr.vault.shortcuts.tables.tableName;
delete fr.vault.shortcuts.tables.columnTypes.text;
delete fr.vault.shortcuts.tables.columnTypes.number;
delete fr.vault.shortcuts.tables.columnTypes.select;
delete fr.vault.shortcuts.tables.columnTypes.date;
delete fr.vault.shortcuts.tables.columnTypes.checkbox;
delete fr.vault.shortcuts.tables.columnTypes.relation;
delete fr.vault.shortcuts.tables.typeBadge.text;
delete fr.vault.shortcuts.tables.typeBadge.number;
delete fr.vault.shortcuts.tables.typeBadge.select;
delete fr.vault.shortcuts.tables.typeBadge.date;
delete fr.vault.shortcuts.tables.typeBadge.checkbox;
delete fr.vault.shortcuts.tables.typeBadge.relation;
delete fr.vault.shortcuts.tables.tableGrid.placeholder;
delete fr.vault.shortcuts.tables.tableGrid.numberPlaceholder;
delete fr.vault.shortcuts.tables.tableGrid.renameColumn;
delete fr.vault.shortcuts.tables.tableGrid.deleteColumn;
delete fr.vault.shortcuts.tables.tableGrid.deleteRow;
delete fr.vault.shortcuts.tables.tableGrid.noRows;
delete fr.vault.shortcuts.tables.boardView.needsSelect;
delete fr.vault.shortcuts.tables.boardView.addSelect;
delete fr.vault.shortcuts.tables.boardView.ungrouped;
delete fr.vault.shortcuts.tables.galleryView.noRows;
delete fr.vault.shortcuts.tables.galleryView.addRow;
delete fr.vault.shortcuts.tables.galleryView.checkboxYes;
delete fr.vault.shortcuts.code.heroTitle;
delete fr.vault.shortcuts.code.subtitle;
delete fr.vault.shortcuts.code.emptyState;
delete fr.vault.shortcuts.code.backToCode;
delete fr.vault.shortcuts.code.fileName;
delete fr.vault.shortcuts.code.languagePlaceholder;
delete fr.vault.shortcuts.code.findButton;
delete fr.vault.shortcuts.code.status.saving;
delete fr.vault.shortcuts.code.status.saved;
delete fr.vault.shortcuts.code.status.autosaveOn;
delete fr.vault.shortcuts.queries.heroTitle;
delete fr.vault.shortcuts.queries.description;
delete fr.vault.shortcuts.queries.placeholder;
delete fr.vault.shortcuts.queries.saveButton;
delete fr.vault.shortcuts.queries.resultsLabel;
delete fr.vault.shortcuts.queries.indexing;
delete fr.vault.shortcuts.queries.notesCount;
delete fr.vault.shortcuts.queries.savedQueriesLabel;
delete fr.vault.shortcuts.queries.noSavedQueries;
delete fr.vault.shortcuts.queries.syntaxLabel;
delete fr.vault.shortcuts.extensions.heroTitle;
delete fr.vault.shortcuts.extensions.description;
delete fr.vault.shortcuts.extensions.installedLabel;
delete fr.vault.shortcuts.extensions.activeCount;
delete fr.vault.shortcuts.extensions.cssOverridesLabel;
delete fr.vault.shortcuts.extensions.cssOverridesDesc;
delete fr.vault.shortcuts.extensions.customThemeExample;
delete fr.vault.shortcuts.extensions.applyButton;
delete fr.vault.shortcuts.extensions.resetButton;
delete fr.vault.shortcuts.extensions.appliedStatus;
delete fr.vault.shortcuts.extensions.runtimeLogLabel;
delete fr.vault.shortcuts.extensions.liveStatus;
delete fr.vault.shortcuts.extensions.tabManifestLabel;
delete fr.vault.shortcuts.extensions.tabManifestDesc;
delete fr.vault.shortcuts.trash.heroTitle;
delete fr.vault.shortcuts.trash.description;
delete fr.vault.shortcuts.trash.itemCount;
delete fr.vault.shortcuts.trash.loading;
delete fr.vault.shortcuts.trash.emptyState;
delete fr.vault.shortcuts.trash.emptyDescription;
delete fr.vault.shortcuts.trash.noteSnippet;
delete fr.vault.shortcuts.trash.deletedAgo;
delete fr.vault.shortcuts.trash.expiresToday;
delete fr.vault.shortcuts.trash.daysLeft;
delete fr.vault.shortcuts.trash.restoreButton;
delete fr.vault.shortcuts.trash.toastRestored;
delete fr.vault.shortcuts.trash.deleteForeverDialog.title;
delete fr.vault.shortcuts.trash.deleteForeverDialog.description;
delete fr.vault.shortcuts.trash.deleteForeverDialog.keepButton;
delete fr.vault.shortcuts.trash.deleteForeverDialog.deleteButton;
delete fr.vault.shortcuts.trash.ariaDeleteForever;

// Write back
fs.writeFileSync('src/lib/locales/fr.json', JSON.stringify(fr, null, 2) + '\n', 'utf8');
console.log('Done!');