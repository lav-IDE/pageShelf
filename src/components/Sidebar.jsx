import React, { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { uploadBook } from '../utils/pdf';
import { BookCard } from './BookCard';
import { FolderItem } from './FolderItem';
import { SettingsModal } from './SettingsModal';
import { SortMenu, applySortBooks, applySortFolders } from './SortMenu';
import { useStore } from '../store';
import { Upload, Search, Plus, Settings, Sun, Moon, AlignJustify } from 'lucide-react';

export function Sidebar() {
  const books = useLiveQuery(() => db.books.orderBy('lastReadAt').reverse().toArray());
  const folders = useLiveQuery(() => db.folders.orderBy('createdAt').reverse().toArray());

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const { sidebarOpen, toggleSidebar, theme, setTheme, sortBy, sortDir } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleCreateFolderSave = async (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await db.folders.add({
        id: crypto.randomUUID(),
        name: newFolderName.trim(),
        createdAt: new Date(),
      });
    }
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) { alert(`File ${file.name} is strictly limited to 100MB`); continue; }
      if (file.type !== 'application/pdf' && !file.name.endsWith('.epub')) { alert(`File ${file.name} is not supported.`); continue; }
      try { await uploadBook(file); } catch (err) { console.error(err); alert(`Failed to upload ${file.name}`); }
    }
    setIsUploading(false);
    e.target.value = null;
  };

  const handleRootDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) await db.books.update(bookId, { folderId: null });
  };
  const handleRootDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleRootDragLeave = (e) => e.currentTarget.classList.remove('drag-over');

  const toggleSwitchTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  /* ── Hamburger toggle button — always rendered, absolutely positioned ── */
  const HamburgerBtn = () => (
    <button
      onClick={toggleSidebar}
      title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      style={{
        position: 'absolute',
        top: '14px',
        right: '12px',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        borderRadius: '6px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-on-shelf)',
        opacity: 0.65,
        transition: 'opacity 0.2s, background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.background = 'transparent'; }}
    >
      <AlignJustify size={17} strokeWidth={2} />
    </button>
  );

  /* ── Collapsed sidebar ── */
  if (!sidebarOpen) {
    return (
      <>
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '52px',
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '60px',
            paddingBottom: '16px',
            zIndex: 10,
            boxShadow: '2px 0 16px rgba(0,0,0,0.35)',
          }}
        >
          <HamburgerBtn />

          {/* Settings icon centred in collapsed bar */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '6px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-on-shelf)', opacity: 0.55,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.55'}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  const activeBooks = books || [];
  const activeFolders = folders || [];
  const booksInFolders = activeBooks.filter(b => b.folderId != null);
  const uncategorizedBooks = activeBooks.filter(b => b.folderId == null);

  // Build a map of folderId -> books[] so folder sort helpers can compute per-folder aggregates
  const booksByFolder = {};
  for (const f of activeFolders) booksByFolder[f.id] = booksInFolders.filter(b => b.folderId === f.id);

  // Apply sort to folders
  const sortedFolders = applySortFolders(activeFolders, booksByFolder, sortBy, sortDir);

  // Finished = 100% progress; Unfinished = everything else (incl. never opened)
  const finishedBooks   = applySortBooks(uncategorizedBooks.filter(b =>  (b.totalPages > 0 && b.currentPage >= b.totalPages)), sortBy, sortDir);
  const unfinishedBooks = applySortBooks(uncategorizedBooks.filter(b => !(b.totalPages > 0 && b.currentPage >= b.totalPages)), sortBy, sortDir);

  /* ── Expanded sidebar ── */
  return (
    <>
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: '300px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          zIndex: 10,
          boxShadow: '2px 0 24px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle wood-grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(255,255,255,0.012) 14px, rgba(255,255,255,0.012) 15px)',
        }} />

        <HamburgerBtn />

        {/* Header */}
        <div style={{ padding: '20px 20px 14px', position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: '"Lora", serif', fontWeight: 700,
            fontSize: '1.45rem', color: 'var(--text-on-shelf)',
            letterSpacing: '0.04em', marginBottom: '16px',
            paddingRight: '36px', /* room for hamburger */
          }}>
            PageShelf
          </h1>

          {/* Upload button */}
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid rgba(185,134,11,0.55)',
              borderRadius: '8px',
              color: '#C9A45A',
              fontFamily: '"Lora", serif', fontSize: '0.82rem', fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1,
              transition: 'background 0.18s, color 0.18s, border-color 0.18s',
              marginBottom: '10px',
            }}
            onMouseEnter={e => { if (!isUploading) { e.currentTarget.style.background = 'rgba(185,134,11,0.18)'; e.currentTarget.style.borderColor = 'rgba(185,134,11,0.85)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(185,134,11,0.55)'; }}
          >
            <Upload size={14} strokeWidth={2.2} />
            {isUploading ? 'Adding volume…' : 'Add Volume'}
          </button>
          <input type="file" accept="application/pdf,.epub" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />

          {/* Search + Sort */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-on-shelf)', opacity: 0.4, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search catalogue…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '7px 12px 7px 32px',
                  fontSize: '0.78rem', fontFamily: '"Lora", serif',
                  color: 'var(--text-on-shelf)',
                  outline: 'none',
                  transition: 'border-color 0.18s, background 0.18s',
                }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(185,134,11,0.5)'; }}
                onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
            <SortMenu />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '20px', marginRight: '20px', flexShrink: 0, position: 'relative', zIndex: 1 }} />

        {/* Book list */}
        <div
          className="scrollbar-vintage"
          style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', position: 'relative', zIndex: 1 }}
          onDrop={handleRootDrop}
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
        >
          {!books ? (
            <div style={{ textAlign: 'center', color: 'var(--text-on-shelf)', opacity: 0.4, fontSize: '0.8rem', marginTop: '20px', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
              Loading catalogue…
            </div>
          ) : books.length === 0 && activeFolders.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2.5rem' }}>📖</span>
              <p style={{ fontFamily: '"Lora", serif', color: 'var(--text-on-shelf)', opacity: 0.55, fontSize: '0.82rem', fontStyle: 'italic', maxWidth: '180px', lineHeight: 1.6 }}>
                Upload a book to begin your reading journey
              </p>
            </div>
          ) : (
            <>
              {/* ── Finished section ── */}
              {finishedBooks.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <SectionLabel
                    caption="Volumes you've read cover to cover"
                    badge={finishedBooks.length}
                    accent="#4D7C55"
                  >
                    Finished
                  </SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {finishedBooks
                      .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(book => <BookCard key={book.id} book={book} />)
                    }
                  </div>
                </div>
              )}

              {/* ── Unfinished section ── */}
              {unfinishedBooks.length > 0 && (
                <div style={{ marginBottom: '4px', marginTop: finishedBooks.length > 0 ? '14px' : '0' }}>
                  <SectionLabel
                    caption="Still in progress — keep reading"
                    badge={unfinishedBooks.length}
                    accent="#B8860B"
                  >
                    In Progress
                  </SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {unfinishedBooks
                      .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(book => <BookCard key={book.id} book={book} />)
                    }
                  </div>
                </div>
              )}

              {/* ── Collections ── */}
              {sortedFolders.length > 0 && (
                <div style={{ marginTop: (finishedBooks.length + unfinishedBooks.length) > 0 ? '14px' : '0' }}>
                  <SectionLabel caption="Organised shelves & reading lists">
                    Collections
                  </SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sortedFolders.map(folder => {
                      const fBooks = booksByFolder[folder.id] || [];
                      return <FolderItem key={folder.id} folder={folder} books={fBooks} searchQuery={searchQuery} />;
                    })}
                  </div>
                </div>
              )}

              {/* New Collection */}
              {isCreatingFolder ? (
                <form onSubmit={handleCreateFolderSave} style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  marginTop: '14px', padding: '8px 10px',
                  background: 'rgba(255,255,255,0.07)', borderRadius: '8px',
                  border: '1px solid rgba(185,134,11,0.4)',
                }}>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder="Collection name…"
                    autoFocus
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--text-on-shelf)', fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.82rem',
                    }}
                  />
                  <button type="submit" style={{ color: '#C9A45A', fontSize: '0.75rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                  <button type="button" onClick={() => setIsCreatingFolder(false)} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    marginTop: '14px', padding: '8px',
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.78rem',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                >
                  <Plus size={13} />
                  New collection
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.18)',
          position: 'relative', zIndex: 1,
        }}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-on-shelf)', opacity: 0.5,
              fontFamily: '"Lora", serif', fontSize: '0.78rem',
              padding: '5px 8px', borderRadius: '6px',
              transition: 'opacity 0.18s, background 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Settings size={14} />
            Settings
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleSwitchTheme}
            title={theme === 'dark' ? 'Switch to daytime library' : 'Switch to evening library'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', padding: '5px 10px',
              cursor: 'pointer', color: 'var(--text-on-shelf)', opacity: 0.65,
              fontFamily: '"Lora", serif', fontSize: '0.72rem',
              transition: 'opacity 0.18s, background 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          >
            {theme === 'dark'
              ? <><Sun size={12} /><span>Day</span></>
              : <><Moon size={12} /><span>Night</span></>
            }
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

function SectionLabel({ children, caption, badge, accent }) {
  return (
    <div style={{ padding: '10px 6px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{
          fontSize: '0.65rem', fontFamily: '"Lora", serif', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: accent || 'var(--text-on-shelf)', opacity: accent ? 0.85 : 0.35,
        }}>
          {children}
        </span>
        {badge != null && (
          <span style={{
            fontSize: '0.6rem', fontFamily: '"Lora", serif', fontWeight: 700,
            background: accent ? `${accent}33` : 'rgba(255,255,255,0.08)',
            color: accent || 'rgba(255,255,255,0.5)',
            border: `1px solid ${accent ? `${accent}55` : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '10px',
            padding: '1px 6px',
            lineHeight: '1.5',
          }}>
            {badge}
          </span>
        )}
      </div>
      {caption && (
        <p style={{
          margin: '2px 0 0',
          fontSize: '0.62rem', fontFamily: '"Lora", serif', fontStyle: 'italic',
          color: 'var(--text-on-shelf)', opacity: 0.28, lineHeight: 1.4,
        }}>
          {caption}
        </p>
      )}
    </div>
  );
}
