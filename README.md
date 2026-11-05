# LemonNote

A local-first knowledge workspace. Plain Markdown notes connected by wiki-links, backlinks, tags and instant full-text search, plus canvas, tables, code files, flashcards and ink pages.

Everything is stored on your own computer. There is no account and no server.

## Status

Early work in progress. The web version runs today. A native desktop version built on a Rust (Tauri) engine is planned.

## Run it

You need [Node.js](https://nodejs.org) and [Git](https://git-scm.com).

```bash
git clone https://github.com/YOUR-USERNAME/LemonNote.git
cd LemonNote
npm install
npm run dev
```

Open the address the terminal prints (usually http://localhost:5173).

## Where your data lives

In the browser's IndexedDB on this device, through one file: `src/api/localDb.js`. Clearing the site's data erases your notes. Keep that in mind until the Rust engine saves real files on disk.

## License

LemonNote is free software, released under the [GNU General Public License v3.0](LICENSE). You may use, study, share and modify it, and modified versions you distribute must stay under the same license.

Copyright (C) 2026 Lemon Depron
