import React, { useState } from 'react';
import { db } from '../db';
import { Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { BookCard } from './BookCard';
import { useStore } from '../store';

const FOLDER_COLORS = ['#8B2500', '#1C4D35', '#1B3060', '#B8860B', '#601A24', '#2E4A6B'];

function getDeterminismColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
}

export function FolderItem({ folder, books, searchQuery }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const selectedBookId = useStore(s => s.selectedBookId);
  const hasActiveBook = books.some(b => b.id === selectedBookId);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete folder "${folder.name}"?\nBooks inside will be moved to the main library.`)) {
      const booksToUpdate = await db.books.where({ folderId: folder.id }).toArray();
      for (const b of booksToUpdate) await db.books.update(b.id, { folderId: null });
      await db.folders.delete(folder.id);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.stopPropagation(); setIsDragOver(false); };
  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    const bookId = e.dataTransfer.getData('bookId');
    if (bookId) { await db.books.update(bookId, { folderId: folder.id }); setIsOpen(true); }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const shouldOpen = isOpen || (searchQuery && filteredBooks.length > 0);

  if (searchQuery && filteredBooks.length === 0) return null;

  const tabColor = getDeterminismColor(folder.id);

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Folder row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px',
          borderRadius: '7px',
          cursor: 'pointer',
          background: isDragOver ? 'rgba(185,134,11,0.12)' : (shouldOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)'),
          border: isDragOver ? '1px dashed rgba(185,134,11,0.5)' : `1px solid ${shouldOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
          transition: 'background 0.18s, border-color 0.18s',
          position: 'relative',
        }}
        className="folder-row"
      >
        {/* Left accent strip */}
        <div style={{ position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '3px', borderRadius: '3px', background: tabColor, opacity: 0.8 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
          {shouldOpen
            ? <ChevronDown size={13} style={{ color: 'var(--text-on-shelf)', opacity: 0.5 }} />
            : <ChevronRight size={13} style={{ color: 'var(--text-on-shelf)', opacity: 0.5 }} />
          }
          <span style={{
            fontFamily: '"Lora", serif', fontStyle: 'italic', fontWeight: 600,
            fontSize: '0.82rem', color: 'var(--text-on-shelf)',
            opacity: hasActiveBook ? 1 : 0.75,
          }}>
            {folder.name}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-on-shelf)', opacity: 0.35, fontFamily: '"Lora", serif' }}>
            {books.length}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className="folder-delete"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '22px', height: '22px', borderRadius: '4px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-on-shelf)', opacity: 0,
            transition: 'opacity 0.18s, background 0.18s',
          }}
          title="Delete Collection"
        >
          <Trash2 size={11} />
        </button>

        <style>{`.folder-row:hover .folder-delete { opacity: 0.45 !important; } .folder-delete:hover { opacity: 1 !important; background: rgba(180,30,10,0.25) !important; }`}</style>
      </div>

      {/* Books inside */}
      {shouldOpen && (
        <div style={{ paddingLeft: '12px', paddingTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredBooks.map(book => <BookCard key={book.id} book={book} />)}
          {filteredBooks.length === 0 && !searchQuery && (
            <div style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--text-on-shelf)', opacity: 0.35, padding: '8px 6px' }}>
              This shelf is empty…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
