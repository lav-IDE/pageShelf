# PageShelf — Visual Theme & Design System Prompt

Build the entire visual theme of PageShelf around the aesthetic of a warm, vintage library. Every design decision — colors, textures, typography, spacing, and components — should feel like stepping into a well-loved private study filled with wooden bookshelves, leather chairs, and aged paper. The app should feel cozy, intentional, and timeless, not like a modern SaaS product.

---

## Color System

Define two themes — `light` and `dark` — both rooted in brown, never in black, white, or grey.

**Light theme (daytime library):**

```css
--bg-primary:      #F5ECD7   /* warm parchment — main background */
--bg-secondary:    #EDE0C4   /* slightly darker parchment — sidebar, cards */
--bg-tertiary:     #E0CEAC   /* subtle depth — hover states, inset areas */
--bg-sidebar:      #6B3F1E   /* deep mahogany — bookshelf panel */
--surface:         #FAF3E0   /* near-parchment — viewer background */
--text-primary:    #2C1A0E   /* near-black brown — body text */
--text-secondary:  #6B4C2A   /* medium brown — labels, timestamps */
--text-muted:      #9C7A52   /* muted tan — placeholders, disabled */
--text-on-shelf:   #F5ECD7   /* parchment — text on the dark sidebar */
--accent:          #8B2500   /* oxblood red — CTAs, active states, progress fills */
--accent-hover:    #6B1C00   /* deeper oxblood — hover on accent elements */
--border:          #C9A97A   /* tan — borders, dividers */
--shadow:          rgba(44, 26, 14, 0.15)
```

**Dark theme (evening library — warm, never cold):**

```css
--bg-primary:      #2A1A0E   /* dark walnut — main background */
--bg-secondary:    #3B2410   /* medium walnut — sidebar, cards */
--bg-tertiary:     #4A2E14   /* lighter walnut — hover states */
--bg-sidebar:      #1C0F07   /* very dark espresso — bookshelf panel */
--surface:         #2F1D0F   /* deep parchment — viewer background */
--text-primary:    #F0DFB8   /* aged parchment — body text */
--text-secondary:  #C9A97A   /* warm tan — labels, timestamps */
--text-muted:      #8C6A42   /* muted brown — placeholders, disabled */
--text-on-shelf:   #F0DFB8   /* parchment — text on sidebar */
--accent:          #C0392B   /* warm red — CTAs, active states */
--accent-hover:    #E74C3C   /* brighter red — hover */
--border:          #5C3A1E   /* dark brown — borders, dividers */
--shadow:          rgba(0, 0, 0, 0.4)
```

Apply themes using a `data-theme="light"` / `data-theme="dark"` attribute on the `<html>` element. All colors must reference CSS variables only — no hardcoded hex values anywhere in component styles.

---

## Typography

Use two Google Fonts:
- `Playfair Display` — headings, book titles, the app logo. Gives an old editorial feel.
- `Lora` — body text, sidebar labels, toolbar text. A warm serif that reads well at small sizes.

```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body:    'Lora', 'Times New Roman', serif;
```

| Usage | Size | Font | Style |
|-------|------|------|-------|
| App logo / hero | 2.25rem | Playfair Display | Bold |
| Book titles | 1rem | Playfair Display | Semibold |
| Folder names | 0.95rem | Playfair Display | Semibold, italic |
| Section headings | 0.875rem | Lora | Bold, uppercase, letter-spacing: 0.08em |
| Body / labels | 0.875rem | Lora | Normal |
| Timestamps / meta | 0.75rem | Lora | Italic |
| Page numbers | 0.8rem | Lora | Normal |

---

## The Sidebar — Bookshelf Design

The sidebar must look like a physical wooden bookshelf. It contains two types of objects: **loose books** and **folders** (user-created collections of related books). Both live on the same shelf and must feel visually cohesive.

### Shelf Structure

- Background: `--bg-sidebar` (deep mahogany in light mode, espresso in dark mode).
- Apply a subtle wood-grain texture using a CSS repeating linear gradient:
  ```css
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 12px,
    rgba(0, 0, 0, 0.03) 12px,
    rgba(0, 0, 0, 0.03) 13px
  );
  ```
- Add a right-side border acting as the shelf edge: `border-right: 3px solid var(--border)` with a subtle inset `box-shadow`.
- Add horizontal "shelf dividers" between every 3–4 items (books or folders) using a `border-bottom` line styled like a wooden shelf plank.

### Book Cards

Each `BookCard` should feel like a book spine standing upright on a shelf.

- Give each card a left border (4–5px wide) in a randomised-but-consistent warm color drawn from a palette of deep library tones: oxblood, forest green, navy, dark gold, burgundy. Derive the color deterministically from the book's `id` so it never changes.
- Card background: slightly lighter than the sidebar, giving depth like a book sitting slightly forward on the shelf.
- On hover: `transform: translateX(4px)` and increase left-border brightness — like pulling a book off a shelf. Add a subtle warm `box-shadow`.
- Active/open book: left border is `--accent` (oxblood), card has a persistent highlight.

### Folders (User-Created Collections)

Folders are the primary way users group related books (e.g. *"Science Fiction"*, *"Design"*, *"To Read"*). They sit on the shelf alongside loose books and must look like a physical **bookend set** or a **labelled section divider** — not a generic file-system folder.

**Folder appearance:**
- Render each folder as a slightly taller card than a book card, with a distinct top-tab — like the tab on a manila folder or a library card section divider.
- The tab protrudes ~8px above the card body and contains the folder name in Playfair Display italic.
- Folder background: one shade darker than a regular book card (`--bg-tertiary` with reduced opacity over the sidebar), giving it a recessed look as though the folder sits behind the books.
- Left border: a double-line border (3px solid + 1px gap + 1px solid) in `--border` to distinguish it from single-spine book cards.
- Inside the folder card (when collapsed): show a small count badge, e.g. *"4 books"*, in Lora italic `--text-muted`.
- Folder label color options (user picks when creating): the same deterministic warm palette used for book spines — oxblood, forest green, navy, dark gold, burgundy — applied to the tab background.

**Folder states:**

- **Collapsed:** Shows the folder tab + name + book count. Books inside are hidden.
- **Expanded:** Folder tab remains at top; book cards inside are indented 12px from the left and displayed below it, maintaining the shelf visual. An animated expand/collapse using `max-height` transition (300ms ease).
- **Hover:** Tab brightens slightly; `transform: translateX(2px)` — subtler than a book hover since folders are heavier objects.
- **Active (a book inside is open):** Folder tab gets a thin `--accent` underline to indicate it contains the active book.

**Folder interactions:**
- Click folder tab → expand/collapse.
- Right-click or `⋮` icon on hover → context menu: Rename, Add books, Remove books, Delete folder.
- Drag a book card onto a folder to add it to the collection (with a visual drop-highlight on the folder tab).
- Books can live in only one folder at a time; dragging to another folder moves them.
- A **"+ New Folder"** button sits at the bottom of the sidebar content area, styled as a faint dashed-border row with a `+` icon and the label *"New collection"* in Lora italic `--text-muted`. On click, it becomes an inline text input for the folder name.

### Sidebar Header

- App name "PageShelf" in Playfair Display, `--text-on-shelf`, large.
- Tagline in Lora small italic: *"Your reading room"*
- Upload button: brass-colored (`#B8860B`) outlined button, rounded corners, hover fills it.
- Search input: dark inset background, parchment text, `border: 1px solid var(--border)` low opacity. Searching filters both loose books and folder contents simultaneously; matched books inside folders auto-expand their parent folder.

### Sidebar Collapse Toggle

- A small tab on the right edge of the sidebar styled like a wooden tab or ribbon bookmark.
- Uses a `‹` / `›` chevron icon.
- When collapsed, only the colored left borders of books and folder tabs are visible — an icon rail that still communicates the shelf structure.

---

## Theme Toggle

Place the theme toggle in the sidebar footer (bottom of the sidebar, always visible).

**Design:**
- A pill-shaped toggle switch, not a button.
- Left icon: ☀️ or a sun SVG (light mode).
- Right icon: 🕯️ candle SVG (dark mode) — lean toward a candle for library vibes.
- Toggle track transitions between `#C9A97A` (light) and `#3B2410` (dark).
- Animate the full page transition:
  ```css
  html {
    transition: background-color 300ms ease, color 300ms ease;
  }
  ```
- Persist preference in `localStorage` under the key `pageshelf-theme`. Read it before first render to avoid a flash of the wrong theme.

---

## Main Area & Viewer

The main reading area should feel like an open book lying on a reading desk.

- Background: `--bg-primary` (parchment in light, dark walnut in dark mode).
- PDF viewer canvas: `box-shadow: 0 4px 24px var(--shadow)` — like a physical book casting a shadow on a desk.
- Surround the viewer with at least 24px padding on all sides — it should never bleed to the edges.
- In light mode, add a faint radial vignette around the viewer area using a pseudo-element to simulate reading under a desk lamp:
  ```css
  .viewer-area::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 60%, rgba(44,26,14,0.08) 100%);
    pointer-events: none;
  }
  ```

**Viewer toolbar:**
- Background: `--bg-secondary`, bottom border: `1px solid var(--border)`.
- All icons: `color: var(--text-secondary)` using Lucide icons.
- Page input: inset look, parchment background, brown border.
- Zoom percentage label: Lora font, `--text-secondary`.

---

## Empty State

When no books are uploaded:

- Large open book glyph `📖` at ~80px.
- Heading: *"Your shelves are empty"* — Playfair Display, `--text-primary`.
- Subtext: *"Upload a book to begin your reading journey"* — Lora italic, `--text-muted`.
- Upload CTA: `--accent` background, parchment text, slightly rounded, `hover: scale(1.02)`.

When a folder exists but contains no books:

- Heading: *"This shelf is empty"* — Playfair Display, `--text-primary`.
- Subtext: *"Drag books here or add them from your library"* — Lora italic, `--text-muted`.

---

## Micro-interactions & Polish

- All transitions: `150–300ms ease` — never instant, never slow.
- Hover on book cards: warm `box-shadow` glow, not color inversion.
- Hover on folder tabs: brightness lift + subtle `translateX`.
- Drag-and-drop onto a folder: folder tab glows with a `--accent` border pulse animation.
- Progress bars: fill `--accent`, track `--bg-tertiary`, height `6px`, `border-radius: 3px`.
- Toast notifications: parchment background, dark brown text, `--accent` left border, slight drop shadow, positioned bottom-right.
- Sidebar scrollbar:
  ```css
  ::-webkit-scrollbar       { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-secondary); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  ```
- Focus rings: `outline: 2px solid var(--accent); outline-offset: 2px` on all focusable elements.

---

## Tailwind Configuration

Extend `tailwind.config.js` to map all CSS variables into the Tailwind theme:

```js
theme: {
  extend: {
    colors: {
      'bg-primary':    'var(--bg-primary)',
      'bg-secondary':  'var(--bg-secondary)',
      'bg-tertiary':   'var(--bg-tertiary)',
      'bg-sidebar':    'var(--bg-sidebar)',
      'surface':       'var(--surface)',
      'text-primary':  'var(--text-primary)',
      'text-secondary':'var(--text-secondary)',
      'text-muted':    'var(--text-muted)',
      'on-shelf':      'var(--text-on-shelf)',
      'accent':        'var(--accent)',
      'accent-hover':  'var(--accent-hover)',
      'border-warm':   'var(--border)',
    },
    fontFamily: {
      display: ['Playfair Display', 'Georgia', 'serif'],
      body:    ['Lora', 'Times New Roman', 'serif'],
    },
    boxShadow: {
      'book':   '0 4px 24px var(--shadow)',
      'card':   '2px 2px 8px var(--shadow)',
      'folder': '0 2px 12px var(--shadow)',
    }
  }
}
```

---

## Design Principle

Apply this design system globally and consistently. Every component — sidebar, folders, book cards, viewer, toolbar, dialogs, toasts, toggles — must feel like it belongs in the same warm, vintage library. When in doubt, ask: *does this look like it belongs in a cozy reading room?* If not, adjust toward warmth, texture, and quiet elegance.
