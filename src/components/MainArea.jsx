import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PdfViewer } from './PdfViewer';
import { BookOpen, PenTool, X } from 'lucide-react';

export function MainArea() {
  const selectedBookId = useStore((state) => state.selectedBookId);
  const book = useLiveQuery(
    () => selectedBookId ? db.books.get(selectedBookId) : Promise.resolve(null),
    [selectedBookId]
  );

  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState('');

  useEffect(() => {
    if (book) setLocalNotes(book.notes || '');
  }, [book?.id]);

  const handleNotesChange = (e) => setLocalNotes(e.target.value);
  const handleNotesBlur = () => {
    if (book && localNotes !== (book.notes || '')) {
      db.books.update(book.id, { notes: localNotes });
    }
  };

  // ── Shortcut: n → toggle notes panel ─────────────────────────────────
  const handleKeys = useCallback((e) => {
    if (!book) return;
    const tag = document.activeElement?.tagName;
    const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (inInput) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      setShowNotes((v) => !v);
    }
  }, [book]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [handleKeys]);

  if (!selectedBookId || !book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden viewer-vignette" style={{ background: 'var(--bg-primary)' }}>
        <div style={{
          width: '96px', height: '96px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          border: '3px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '28px',
          boxShadow: '0 8px 32px var(--shadow)',
        }}>
          <BookOpen size={38} strokeWidth={1.3} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h2 style={{
          fontFamily: '"Lora", serif', fontWeight: 700, fontSize: '1.9rem',
          color: 'var(--text-primary)', letterSpacing: '0.02em', marginBottom: '12px',
          position: 'relative', zIndex: 2,
        }}>Your reading room</h2>
        <p style={{
          fontFamily: '"Lora", serif', fontStyle: 'italic',
          color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '320px',
          textAlign: 'center', lineHeight: 1.8, position: 'relative', zIndex: 2,
        }}>
          Select a volume from your library shelf, or deposit a new manuscript to begin reading.
        </p>
      </div>
    );
  }

  const percent = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  return (
    <div id="main-area" className="flex-1 flex flex-col min-w-0 relative viewer-vignette" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        height: '52px', flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 12px var(--shadow)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: '16px', justifyContent: 'space-between',
        position: 'relative', zIndex: 30,
      }}>
        <h2 style={{
          fontFamily: '"Lora", serif', fontWeight: 700,
          fontSize: '1rem', color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '0.02em', margin: 0,
        }} title={book.title}>
          {book.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '5px 12px',
              borderRadius: '6px',
              fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.8rem',
              cursor: 'pointer',
              border: showNotes ? '1px solid var(--border)' : '1px solid transparent',
              background: showNotes ? 'var(--bg-tertiary)' : 'transparent',
              color: showNotes ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.18s',
              boxShadow: showNotes ? 'inset 0 1px 3px var(--shadow)' : 'none',
            }}
          >
            <PenTool size={13} />
            Notes
          </button>

          <div style={{
            fontSize: '0.73rem', fontFamily: '"Lora", serif', fontWeight: 700,
            color: 'var(--text-secondary)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '4px 12px',
            letterSpacing: '0.05em',
            boxShadow: 'inset 0 1px 3px var(--shadow)',
          }}>
            {percent}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex" style={{ position: 'relative', zIndex: 20 }}>
        <div className="flex-1 relative overflow-hidden" style={{ padding: '20px' }}>
          <PdfViewer key={book.id} book={book} />
        </div>

        {showNotes && (
          <div style={{
            width: '300px', flexShrink: 0,
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 20px var(--shadow)',
            zIndex: 30, transition: 'all 0.22s',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-tertiary)',
            }}>
              <h3 style={{ margin: 0, fontFamily: '"Lora", serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                Margin Notes
              </h3>
              <button
                onClick={() => setShowNotes(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '26px', height: '26px', borderRadius: '5px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              value={localNotes}
              onChange={handleNotesChange}
              onBlur={handleNotesBlur}
              placeholder="Jot down your thoughts, quotes, or key passages… (Autosaves)"
              className="scrollbar-vintage"
              style={{
                flex: 1, width: '100%', padding: '18px',
                resize: 'none', outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: '"Lora", serif', fontSize: '0.85rem', lineHeight: 1.85,
                border: 'none',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
