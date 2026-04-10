import React, { useState } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { Trash2, Clock, Book, Pencil, Check, X } from 'lucide-react';

const SPINE_COLORS = ['#8B2500', '#1C4D35', '#1B3060', '#B8860B', '#601A24', '#2E4A6B', '#5C3317'];

function getDeterminismColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

function getRelativeTime(lastReadAt) {
  if (!lastReadAt) return 'Never read';
  const diff = Date.now() - lastReadAt.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function BookCard({ book }) {
  const { selectedBookId, setSelectedBookId } = useStore();
  const isSelected = selectedBookId === book.id;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(book.title);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${book.title}"?\nThis will remove your reading progress.`)) {
      await db.books.delete(book.id);
      if (isSelected) setSelectedBookId(null);
    }
  };

  const startRename = (e) => {
    e.stopPropagation();
    setRenameValue(book.title);
    setIsRenaming(true);
  };

  const commitRename = async (e) => {
    e?.stopPropagation?.();
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== book.title) {
      await db.books.update(book.id, { title: trimmed });
    }
    setIsRenaming(false);
  };

  const cancelRename = (e) => {
    e?.stopPropagation?.();
    setRenameValue(book.title);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') commitRename(e);
    if (e.key === 'Escape') cancelRename(e);
  };

  const percent = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  const thumbnailUrl = React.useMemo(() => {
    if (!book.thumbnailBlob) return null;
    return URL.createObjectURL(book.thumbnailBlob);
  }, [book.thumbnailBlob]);

  const handleDragStart = (e) => e.dataTransfer.setData('bookId', book.id);

  const spineColor = isSelected ? 'var(--accent)' : getDeterminismColor(book.id);

  return (
    <div
      onClick={() => !isRenaming && setSelectedBookId(book.id)}
      draggable={!isRenaming}
      onDragStart={handleDragStart}
      className="book-card-root"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        borderRadius: '8px',
        cursor: isRenaming ? 'default' : 'pointer',
        marginBottom: '5px',
        overflow: 'hidden',
        border: isSelected
          ? '1px solid rgba(185,134,11,0.45)'
          : '1px solid rgba(255,255,255,0.06)',
        background: isSelected
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
        boxShadow: isSelected
          ? '0 2px 12px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(185,134,11,0.15)'
          : '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'background 0.18s, box-shadow 0.18s, border-color 0.18s',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
        }
      }}
    >
      {/* Spine colour strip */}
      <div style={{ width: '4px', flexShrink: 0, background: spineColor, borderRadius: '8px 0 0 8px' }} />

      {/* Thumbnail */}
      <div style={{
        flexShrink: 0, width: '44px', height: '62px',
        background: 'rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', margin: '8px 0 8px 8px',
        borderRadius: '3px',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
      }}>
        {thumbnailUrl
          ? <img src={thumbnailUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Book size={18} style={{ color: 'var(--text-on-shelf)', opacity: 0.4 }} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, padding: '9px 36px 9px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
        {isRenaming ? (
          /* ── Rename input ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={commitRename}
              style={{
                flex: 1, minWidth: 0,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(185,134,11,0.5)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontFamily: '"Lora", serif', fontWeight: 600, fontSize: '0.82rem',
                color: 'var(--text-on-shelf)',
                outline: 'none',
              }}
            />
            <button
              onMouseDown={e => { e.preventDefault(); commitRename(e); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A45A', padding: '2px', display: 'flex' }}
              title="Save"
            ><Check size={12} /></button>
            <button
              onMouseDown={e => { e.preventDefault(); cancelRename(e); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '2px', display: 'flex' }}
              title="Cancel"
            ><X size={12} /></button>
          </div>
        ) : (
          <h3
            onDoubleClick={startRename}
            style={{
              margin: 0, fontFamily: '"Lora", serif', fontWeight: 600,
              fontSize: '0.82rem', color: 'var(--text-on-shelf)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '0.01em',
            }}
            title="Double-click to rename"
          >
            {book.title}
          </h3>
        )}

        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-on-shelf)', opacity: 0.45, fontStyle: 'italic' }}>
          <Clock size={10} />
          {getRelativeTime(book.lastReadAt)}
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '2px' }}>
          <div style={{ flex: 1, height: '3px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, borderRadius: '3px', background: spineColor, opacity: 0.85, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-on-shelf)', opacity: 0.45, minWidth: '28px', textAlign: 'right' }}>{percent}%</span>
        </div>
      </div>

      {/* Action buttons (rename + delete) — shown on hover */}
      {!isRenaming && (
        <>
          <button
            onClick={startRename}
            style={{
              position: 'absolute', top: '8px', right: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '5px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: 'var(--text-on-shelf)', opacity: 0,
              transition: 'opacity 0.18s, background 0.18s',
            }}
            className="book-rename-btn"
            title="Rename (or double-click title)"
          >
            <Pencil size={10} />
          </button>

          <button
            onClick={handleDelete}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '5px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: 'var(--text-on-shelf)', opacity: 0,
              transition: 'opacity 0.18s, background 0.18s',
            }}
            className="book-delete-btn"
            title="Discard Volume"
          >
            <Trash2 size={11} />
          </button>
        </>
      )}

      <style>{`
        .book-card-root:hover .book-rename-btn { opacity: 0.55 !important; }
        .book-rename-btn:hover { opacity: 1 !important; background: rgba(185,134,11,0.25) !important; }
        .book-card-root:hover .book-delete-btn { opacity: 0.55 !important; }
        .book-delete-btn:hover { opacity: 1 !important; background: rgba(180,30,10,0.35) !important; }
      `}</style>
    </div>
  );
}
