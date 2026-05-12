# PageShelf

[![Live on Vercel](https://img.shields.io/badge/Live%20Demo-page--shelf.vercel.app-black?logo=vercel&logoColor=white)](https://page-shelf.vercel.app/)

A local-first, privacy-respecting PDF reader that lives entirely in your browser. No accounts, no cloud uploads — your books stay on your machine. Try it instantly at **[page-shelf.vercel.app](https://page-shelf.vercel.app/)**.

---

## Features

### Reading
- **PDF rendering** powered by PDF.js with high-DPI canvas output
- **Single & double-page view** — toggle a side-by-side two-page layout for portrait PDFs
- **Per-book zoom** — zoom level is saved per book and restored on re-open; entering fullscreen auto-increases zoom by 25% and restores it on exit
- **Page navigation** via toolbar buttons, direct page-number input, or **← / → arrow keys**
- **Progress tracking** — reading percentage shown in the top bar; books automatically sorted into *In Progress* and *Finished* shelves
- **Fullscreen mode** for distraction-free reading
- **Margin Notes** — a per-book notepad panel that auto-saves as you type

### Smart Dark Mode
- **Theme-aware PDF rendering** — pages that are already dark (dark-background PDFs, night-mode slides) are left untouched in night mode; only light pages are inverted, preventing the "polar opposite" flip
- **Invariant shelf surface** — the sidebar is permanently a dark mahogany surface and does not change between day and night mode; only the main reading area transitions between warm parchment and near-black
- **Smooth theme transitions** — all background, text, border and shadow values cross-fade at 300 ms

### Library
- **Drag-and-drop upload** — drop PDFs onto the sidebar or use *Add Volume* (up to 100 MB per file)
- **Auto metadata extraction** — title pulled from the PDF's built-in metadata on import; first-page thumbnail generated automatically
- **Inline rename** — double-click any book title in the sidebar to rename it in place
- **Search** — live search filters the entire catalogue as you type
- **Collections** — create named folders and drag books into them to organise your shelf
- **Sorting** — sort books and folders by *Last Read*, *Name (A–Z)*, or *Page Count*, in ascending or descending order

### App
- **Day / Night theme** toggle (defaults to night)
- **Collapsible sidebar** — collapses to a slim icon bar; Settings remain accessible in either state
- **Backup & Restore** — export your entire library (books + notes + progress + folders) as a `.zip` archive and restore it at any time via Settings
- **Fully offline after load** — all data stored in IndexedDB via Dexie; zero network requests during a reading session. The app is hosted on Vercel but every book, note, and progress entry lives exclusively in your browser.

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

PageShelf is deployed on [Vercel](https://vercel.com) and available at:

> **<https://page-shelf.vercel.app/>**

Vercel is configured via [`vercel.json`](./vercel.json) with a single SPA rewrite rule so that all routes fall through to `index.html`. To deploy your own fork:

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
| `Shift+T` | Toggle between day/night mode |
| `F` | Toggle fullscreen mode |
| `N` | Toggle Notes panel |

> Arrow keys are suppressed when focus is inside a text input (e.g. the page-number field or the Notes panel).

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
│   │   ├── MainArea.jsx        # Reading pane shell + Notes panel
│   │   ├── PdfViewer.jsx       # PDF canvas, toolbar, zoom, page controls & smart dark filter
│   │   ├── SettingsModal.jsx   # Backup / Restore modal
│   │   ├── Sidebar.jsx         # Library navigation, search, sort & upload
│   │   └── SortMenu.jsx        # Sort picker (last read / name / pages, asc / desc)
│   ├── utils/
│   │   └── pdf.js              # PDF upload helper (metadata + thumbnail extraction)
│   ├── db.js                   # Dexie schema (books, folders)
│   ├── store.js                # Zustand global state (selectedBookId, theme, sort, sidebar)
│   ├── App.jsx
│   ├── index.css               # Design tokens, shelf-invariant CSS vars, theme transitions
│   └── main.jsx
├── index.html
├── vite.config.js
└── Start_PageShelf.bat         # Windows launcher shortcut
```

---

## Data & Privacy

PageShelf stores everything — including the raw PDF blobs — in your browser's IndexedDB. Nothing is ever sent to a server. Clearing browser site data will erase your library; use **Settings → Export Archive** to save a `.zip` backup beforehand.
