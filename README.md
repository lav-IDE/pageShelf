# PageShelf

[![Live on Vercel](https://img.shields.io/badge/Live%20Demo-page--shelf.vercel.app-black?logo=vercel&logoColor=white)](https://page-shelf.vercel.app/)

A local-first PDF reader that runs entirely in your browser. No accounts, no uploads, your books stay on your machine. Give it a shot at **[page-shelf.vercel.app](https://page-shelf.vercel.app/)**.

---

## Features

### Reading
- **PDF rendering** powered by PDF.js with high-DPI canvas output
- **Single & double-page view** - toggle a side-by-side layout for portrait PDFs
- **Per-book zoom** - zoom level is saved per book and restored on re-open; entering fullscreen bumps zoom by 25% and restores it on exit
- **Page navigation** via toolbar buttons, direct page-number input, or **← / → arrow keys**
- **Progress tracking** - reading percentage shown in the top bar; books are sorted into *In Progress* and *Finished* shelves automatically
- **Fullscreen mode** for distraction-free reading
- **Margin Notes** - a per-book notepad that auto-saves as you type

### Smart Dark Mode
- **Theme-aware PDF rendering** - pages that are already dark (dark-background PDFs, night-mode slides) are left untouched; only light pages get inverted
- **Invariant shelf surface** - the sidebar stays dark mahogany in both day and night mode; only the reading area switches between warm parchment and near-black
- **Smooth transitions** - all colors cross-fade at 300ms

### Library
- **Drag-and-drop upload** - drop PDFs onto the sidebar or use *Add Volume* (up to 100 MB per file)
- **Auto metadata extraction** - title pulled from the PDF's built-in metadata on import; thumbnail generated from the first page
- **Inline rename** - double-click any book title in the sidebar to rename it
- **Search** - live search filters the catalogue as you type
- **Collections** - create named folders and drag books into them
- **Sorting** - sort by *Last Read*, *Name (A-Z)*, or *Page Count*, ascending or descending

### App
- **Day / Night theme** toggle (defaults to night)
- **Collapsible sidebar** - collapses to a slim icon bar; Settings are still accessible in either state
- **Backup & Restore** - export your entire library (books + notes + progress + folders) as a `.zip` and restore it anytime via Settings
- **Fully offline after load** - all data lives in IndexedDB via Dexie, no network requests during a reading session. The app is hosted on Vercel but every book, note and progress entry stays in your browser.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI framework | React 19 |
| Build tool | Vite |
| State management | Zustand |
| Local database | Dexie (IndexedDB) |
| PDF rendering | pdfjs-dist 5 |
| Backup format | JSZip |
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

Open [http://localhost:5173](http://localhost:5173) in your browser.

```bash
# Production build
npm run build

# Preview the production build locally
npm run preview
```

Windows users can also double-click **`Start_PageShelf.bat`** to launch the dev server.

---

## Deployment

PageShelf is deployed on [Vercel](https://vercel.com) and live at:

> **<https://page-shelf.vercel.app/>**

`vercel.json` has a single SPA rewrite rule so all routes fall through to `index.html`. To deploy your own fork:

```bash
npm i -g vercel
vercel --prod
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` | Next page (advances by 2 in double-page mode) |
| `←` | Previous page (retreats by 2 in double-page mode) |
| `Shift+T` | Toggle day/night mode |
| `F` | Toggle fullscreen |
| `N` | Toggle Notes panel |

> All shortcuts are disabled when focus is inside a text input (e.g. the page-number field or the Notes panel).

---

## Project Structure

```
pageShelf/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BookCard.jsx        # Sidebar book entry with thumbnail, progress bar & rename
│   │   ├── FolderItem.jsx      # Collapsible collection with drag-and-drop
│   │   ├── MainArea.jsx        # Reading pane + Notes panel
│   │   ├── PdfViewer.jsx       # PDF canvas, toolbar, zoom, page controls & smart dark filter
│   │   ├── SettingsModal.jsx   # Backup / Restore modal
│   │   ├── Sidebar.jsx         # Library navigation, search, sort & upload
│   │   └── SortMenu.jsx        # Sort picker (last read / name / pages, asc / desc)
│   ├── utils/
│   │   └── pdf.js              # PDF upload helper (metadata + thumbnail extraction)
│   ├── db.js                   # Dexie schema (books, folders)
│   ├── store.js                # Zustand global state (selectedBookId, theme, sort, sidebar)
│   ├── App.jsx
│   ├── index.css               # Design tokens, CSS vars, theme transitions
│   └── main.jsx
├── index.html
├── vite.config.js
└── Start_PageShelf.bat         # Windows launcher shortcut
```

---

## Data & Privacy

PageShelf stores everything, including the raw PDF blobs, in your browser's IndexedDB. Nothing is ever sent to a server. Clearing browser site data will wipe your library, so use **Settings -> Export Archive** to save a `.zip` backup first.
