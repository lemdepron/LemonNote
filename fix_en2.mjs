import fs from 'fs';
const content = fs.readFileSync('src/lib/locales/en.json', 'utf8');
const en = JSON.parse(content);

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
en.ribbon.ink.frames.template = "Template";
en.ribbon.ink.frames.pages = "Pages";
en.ribbon.ink.frames.shapes = "Shapes";
en.ribbon.ink.objects.select = "Select";
en.ribbon.ink.objects.lasso = "Lasso";
en.ribbon.ink.objects.delete = "Delete";
en.ribbon.ink.objects.front = "Front";
en.ribbon.ink.objects.back = "Back";
en.ribbon.ink.objects.apply = "Apply";
en.ribbon.ink.objects.recolor = "Recolor";
en.ribbon.ink.objects.deselect = "Deselect";
en.ribbon.ink.groups.shapes = "Shapes";
en.ribbon.ink.objects.shapes = "Shapes";
en.ribbon.ink.objects.stickers = "Stickers";
en.ribbon.ink.objects.textbox = "Textbox";
en.ribbon.ink.objects.sticky = "Sticky";
en.ribbon.ink.groups.overlay = "Overlay";
en.ribbon.ink.tab.collapse = "Collapse";
en.ribbon.ink.tab.expand = "Expand";

// Add pdf keys
en.pdf = {
  annotate: {
    saved: "Saved",
    exit: "Exit",
    enter: "Enter",
    save: "Save",
    export: "Export"
  }
};

// Add settings.appearance
en.settings.appearance = "Appearance";

// Add lang and digits
en.lang = "Language";
en.digits = "Digits";

fs.writeFileSync('src/lib/locales/en.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log('en.json done!');