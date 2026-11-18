# Canvas and formats: decisions (18 Nov 2026)

Formats: Markdown (.md), plain text (.txt), HTML (.html), PDF (.pdf), Canvas (infinite canvas).
- Markdown: text, code blocks, $$ math, linked images in ./assets/<uuid>.<ext>, rich formatting. No Ink tab; an "Open as canvas" button instead.
- Plain text: text only. Ink, Insert, Design, Layout are greyed.
- HTML: edited as source, previewed in a sandbox; every tab that works for HTML is enabled.
- PDF: import, view, annotate (ink), export. Annotations are written into the PDF file, not the app database. Text editing is not available.
- Canvas: its own format. Default page frame A4 portrait; other frames 3:4, 16:9 and more. Text frames hold Markdown. Text under ink is locked.
- Old 16 note formats become Markdown notes with one fenced code block (after a full backup). Import/export of those formats stays. CSV is no longer a note format.
- Math is $$...$$ only (single dollars are currency).
- Tools a format cannot do are greyed with a tooltip, never hidden.
- Typography and page colour move from the note record to front matter.
- Recognition: shapes first (already built). Handwriting, math and code only with an offline engine that passes the C14 test.