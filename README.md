# PageShelf

A local-first, privacy-respecting PDF reader that lives entirely in your browser. No accounts, no cloud uploads, your books stay on your machine.

---

## Features

### Reading
- **PDF rendering** powered by PDF.js with high-DPI canvas output
- **Per-book zoom** — zoom level is saved per book and restored on re-open
- **Page navigation** via toolbar buttons, direct page-number input, or **← / → arrow keys**
- **Progress tracking** — reading percentage displayed in the top bar; books automatically sorted into *In Progress* and *Finished* shelves
- **Fullscreen mode** for distraction-free reading

### Library
- **Drag-and-drop upload** — drop PDFs onto the sidebar or use the *Add Volume* button (up to 100 MB per file)
- **Auto metadata extraction** — title and author pulled from the PDF's built-in metadata on import; first-page thumbnail generated automatically
- **Search** — live search filters the entire catalogue as you type
- **Collections** — create named folders and drag books into them to organise your shelf
- **Margin Notes** — a per-book notepad panel that auto-saves as you type

### App
- **Dark / Light theme** toggle (defaults to dark)
- **Collapsible sidebar** — collapses to a slim icon bar; Settings remain accessible in either state
- **Backup & Restore** — export your entire library (books + notes + progress) as a JSON file and restore it later, via the Settings modal
- **Fully offline** — all data stored in IndexedDB via Dexie; zero network requests after the initial page load

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| State management | Zustand |
| Local database | Dexie (IndexedDB) |
| PDF rendering | pdfjs-dist 5 |
| Icons | Lucide React |
| Styling | Tailwind CSS 3 + Vanilla CSS custom properties |
| Font | Lora (serif, Google Fonts) |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Production build
npm run build

# Preview the production build locally
npm run preview
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` | Next page |
| `←` | Previous page |

> Arrow keys are suppressed when focus is inside a text input (e.g. the page-number field or the Notes panel).

---

## Project Structure

```
pageShelf/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BookCard.jsx        # Sidebar book entry with thumbnail & progress ring
│   │   ├── FolderItem.jsx      # Collapsible collection with drag-and-drop
│   │   ├── MainArea.jsx        # Reading pane shell + Notes panel
│   │   ├── PdfViewer.jsx       # PDF canvas, toolbar, zoom & page controls
│   │   ├── SettingsModal.jsx   # Backup / Restore modal
│   │   └── Sidebar.jsx         # Library navigation & upload
│   ├── utils/
│   │   └── pdf.js              # PDF upload helper (metadata + thumbnail extraction)
│   ├── db.js                   # Dexie schema (books, folders)
│   ├── store.js                # Zustand global state (selectedBookId, theme, sidebar)
│   ├── App.jsx
│   ├── index.css               # Global design tokens & custom scrollbar
│   └── main.jsx
├── index.html
├── vite.config.js
└── Start_PageShelf.bat         # Windows launcher shortcut
```

---

## Data & Privacy

PageShelf stores everything — including the raw PDF blobs — in your browser's IndexedDB. Nothing is ever sent to a server. Clearing browser site data will erase your library; use **Settings → Backup** to export a copy beforehand.
