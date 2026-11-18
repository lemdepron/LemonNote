import fs from 'fs';

const content = fs.readFileSync('src/lib/locales/fr.json', 'utf8');
const fr = JSON.parse(content);

// Add missing ribbon.wordGoal and ribbon.macros keys
fr.ribbon.wordGoal = {
  "wordGoal": "Objectif mots",
  "targetWords": "Mots cibles",
  "setGoal": "Définir objectif",
  "updateGoal": "Mettre à jour objectif",
  "editGoal": "Modifier objectif",
  "clearGoal": "Effacer objectif"
};

fr.ribbon.macros = "Macros";
fr.ribbon.macrosHint = "Enregistrer et rejouer macros d'édition";

// Write back
fs.writeFileSync('src/lib/locales/fr.json', JSON.stringify(fr, null, 2) + '\n', 'utf8');
console.log('Done!');