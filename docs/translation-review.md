# Translation Review — Unsure Terms

This document lists translation choices where the English term may have multiple valid translations in target languages, or where the context is ambiguous. Reviewers should verify these choices.

## General Guidelines

- Brand names (LemonNote, Markdown, Markdown, GitHub, Tauri, React, TypeScript) kept in English
- Technical terms (HTML, CSS, JSON, CSV, YAML, SQL, Regex, URL, URI, API, SDK, CLI, GUI, IDE) kept in English
- Keyboard keys (Ctrl, Cmd, Alt, Shift, Enter, Tab, Escape, Backspace, Delete, Arrow keys) kept in English
- Format examples (due:YYYY-MM-DD HH:MM, tag:name, sort:-updated, limit:40) kept in English
- Language names (Arabic, Chinese, English, French, German, Hindi, Japanese, Persian, Russian, Spanish, Urdu) kept in English when referenced in UI

## Per-Language Notes

### Arabic (ar)
- **"Board" (Kanban view)** → "لوحة" (board/panel) — could also be "كانبان" (kanban)
- **"Gallery" (card view)** → "معرض" (gallery/exhibition)
- **"Canvas"** → "لوحة" (same as Board) — context distinguishes
- **"Trash"** → "المهملات" (trash/refuse) — "سلة المهملات" more common but longer
- **"Toast"** (notification) → Not translated directly; messages use "تمت استعادة" (restored)

### German (de)
- **"Board" (Kanban)** → "Board" (kept English, common in German tech) — could be "Kanban-Board"
- **"Gallery"** → "Galerie"
- **"Canvas"** → "Leinwand" (literal canvas) — technical term
- **"Trash"** → "Papierkorb" (standard desktop metaphor)
- **"Toast"** → Not translated; messages use "wiederhergestellt"

### Spanish (es)
- **"Board" (Kanban)** → "Tablero" (board) — could be "Kanban"
- **"Gallery"** → "Galería"
- **"Canvas"** → "Lienzo" (literal canvas)
- **"Trash"** → "Papelera" (standard)
- **"Toast"** → Not translated; messages use "Restaurado"

### French (fr)
- **"Board" (Kanban)** → "Tableau" (board) — could be "Kanban"
- **"Gallery"** → "Galerie"
- **"Canvas"** → "Toile" (literal canvas)
- **"Trash"** → "Corbeille" (standard)
- **"Toast"** → Not translated; messages use "restauré"

### Japanese (ja)
- **"Board" (Kanban)** → "ボード" (board, katakana) — standard
- **"Gallery"** → "ギャラリー" (gallery, katakana)
- **"Canvas"** → "キャンバス" (canvas, katakana) — standard tech term
- **"Trash"** → "ゴミ箱" (trash box) — standard desktop metaphor
- **"Toast"** → Not translated; messages use "復元しました" (restored)

### Chinese Simplified (zh)
- **"Board" (Kanban)** → "看板" (kanban) — standard term
- **"Gallery"** → "图库" (image library/gallery)
- **"Canvas"** → "画布" (canvas cloth) — standard tech term
- **"Trash"** → "回收站" (recycling station) — standard Windows metaphor
- **"Toast"** → Not translated; messages use "已还原" (restored)

### Russian (ru)
- **"Board" (Kanban)** → "Доска" (board) — could be "Канбан"
- **"Gallery"** → "Галерея"
- **"Canvas"** → "Холст" (canvas) — standard
- **"Trash"** → "Корзина" (basket) — standard desktop metaphor
- **"Toast"** → Not translated; messages use "восстановлено"

### Persian/Farsi (fa)
- **"Board" (Kanban)** → "تخته" (board/plank) — could be "کانبان"
- **"Gallery"** → "گالری" (gallery, loanword)
- **"Canvas"** → "بوم" (canvas) — art term
- **"Trash"** → "زباله‌دان" (trash can) — standard
- **"Toast"** → Not translated; messages use "بازگردانده شد" (returned/restored)

### Hindi (hi)
- **"Board" (Kanban)** → "बोर्ड" (board, transliterated) — could be "कानबन"
- **"Gallery"** → "गैलरी" (gallery, transliterated)
- **"Canvas"** → "कैनवास" (canvas, transliterated)
- **"Trash"** → "ट्रैश" (trash, transliterated) — "कचरा" more natural but less tech
- **"Toast"** → Not translated; messages use "रिस्टोर किया गया" (restored)

### Urdu (ur)
- **"Board" (Kanban)** → "بورڈ" (board, transliterated) — could be "کانبن"
- **"Gallery"** → "گیلری" (gallery, transliterated)
- **"Canvas"** → "کینوس" (canvas, transliterated)
- **"Trash"** → "ٹراش" (trash, transliterated) — "کوڑا دان" more natural
- **"Toast"** → Not translated; messages use "ریستور کیا گیا" (restored)

## Pluralization Notes

All languages use `{count} item{plural}` pattern. The i18n system handles plural rules. Verify:
- Arabic: 6 plural forms (zero, one, two, few, many, other)
- Russian: 3 plural forms (one, few, many)
- Other languages: 2 plural forms (one, other) or similar

## RTL Support

Arabic (ar), Persian (fa), Urdu (ur) are RTL languages. The app uses `dir="auto"` on mixed-content elements (counters, note titles, tags). Verify:
- Counters show correctly: `{count} items` — numbers LTR, text RTL
- Note titles with mixed scripts display correctly
- Tag pills with mixed content align properly

## Terms Kept in English (Allow-List)

These terms appear in translations but are intentionally kept in English:
- LemonNote (brand)
- Markdown
- GitHub
- Tauri
- React
- TypeScript
- HTML, CSS, JSON, CSV, YAML, SQL
- Regex
- URL, URI, API, SDK, CLI, GUI, IDE
- Ctrl, Cmd, Alt, Shift, Enter, Tab, Escape, Backspace, Delete
- due:YYYY-MM-DD HH:MM
- tag:name, sort:-updated, limit:40
- Language names: Arabic, Chinese, English, French, German, Hindi, Japanese, Persian, Russian, Spanish, Urdu

## Review Checklist

- [ ] All vault pages (Home, Journal, Tasks, Cards, Graph, Canvas, Tables, Code, Queries, Extensions, Trash) have no English strings when language switched
- [ ] Settings page fully translated
- [ ] Ribbon tabs (Home, Ink, Insert, Design, Layout, View, Share) fully translated
- [ ] Dialogs, toasts, alerts fully translated
- [ ] RTL languages display correctly with `dir="auto"`
- [ ] Plural forms work correctly for all languages
- [ ] No hard-coded English remains in UI components

## Next Steps

1. Manual testing: Switch to Arabic, open every Vault page and Settings — verify no English remains
2. Quick check German and Japanese for completeness
3. Fix any remaining hard-coded strings found during testing
4. Update this document with any new unsure terms discovered