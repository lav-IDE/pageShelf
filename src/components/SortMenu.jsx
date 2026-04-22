import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { ArrowDownUp, Clock, CaseSensitive, BookMarked, ArrowUp, ArrowDown } from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'lastRead', label: 'Last Read',    Icon: Clock          },
  { key: 'name',     label: 'Name (A–Z)',   Icon: CaseSensitive  },
  { key: 'pages',    label: 'No. of Pages', Icon: BookMarked     },
];

/** Applies client-side sort to an array of books. */
export function applySortBooks(books, sortBy, sortDir) {
  const sorted = [...books].sort((a, b) => {
    switch (sortBy) {
      case 'lastRead': {
        const ta = a.lastReadAt ? a.lastReadAt.getTime() : 0;
        const tb = b.lastReadAt ? b.lastReadAt.getTime() : 0;
        return tb - ta;
      }
      case 'name':
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base', numeric: true });
      case 'pages':
        return (b.totalPages || 0) - (a.totalPages || 0);
      default:
        return 0;
    }
  });
  return sortDir === 'asc' ? sorted.reverse() : sorted;
}

/** Applies client-side sort to an array of folders. */
export function applySortFolders(folders, booksByFolder, sortBy, sortDir) {
  const sorted = [...folders].sort((a, b) => {
    switch (sortBy) {
      case 'lastRead': {
        const latest = (folder) => {
          const books = booksByFolder[folder.id] || [];
          return books.reduce((max, bk) => {
            const t = bk.lastReadAt ? bk.lastReadAt.getTime() : 0;
            return t > max ? t : max;
          }, 0);
        };
        return latest(b) - latest(a);
      }
      case 'name':
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true });
      case 'pages': {
        const sum = (folder) =>
          (booksByFolder[folder.id] || []).reduce((s, bk) => s + (bk.totalPages || 0), 0);
        return sum(b) - sum(a);
      }
      default:
        return 0;
    }
  });
  return sortDir === 'asc' ? sorted.reverse() : sorted;
}

export function SortMenu() {
  const { sortBy, sortDir, setSortBy, setSortDir } = useStore();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);

  // Position the portal dropdown relative to the trigger button
  const openMenu = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(o => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (key) => {
    if (key === sortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
    setOpen(false);
  };

  const dropdown = open ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        right: dropdownPos.right,
        width: '190px',
        background: '#1e1208',   /* hard-coded opaque fallback matching dark theme */
        backgroundColor: 'var(--bg-primary, #1e1208)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
        zIndex: 99999,
        padding: '6px',
      }}
    >
      {/* Header label */}
      <p style={{
        margin: '0 0 4px', padding: '2px 8px 6px',
        fontSize: '0.6rem', fontFamily: '"Lora", serif', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text-on-shelf)', opacity: 0.35,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>Sort by</p>

      {/* Options */}
      {SORT_OPTIONS.map(({ key, label, Icon }) => {
        const isActive = key === sortBy;
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              width: '100%', padding: '8px 10px',
              borderRadius: '7px',
              background: isActive ? 'rgba(185,134,11,0.18)' : 'rgba(255,255,255,0.04)',
              border: 'none', cursor: 'pointer',
              color: isActive ? '#C9A45A' : 'var(--text-on-shelf)',
              fontFamily: '"Lora", serif', fontSize: '0.8rem',
              textAlign: 'left',
              marginBottom: '2px',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = isActive ? 'rgba(185,134,11,0.25)' : 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(185,134,11,0.18)' : 'rgba(255,255,255,0.04)'; }}
          >
            <Icon size={13} strokeWidth={1.8} />
            <span style={{ flex: 1 }}>{label}</span>
            {isActive && (
              sortDir === 'asc'
                ? <ArrowDown size={11} strokeWidth={2.2} style={{ color: '#C9A45A' }} />
                : <ArrowUp   size={11} strokeWidth={2.2} style={{ color: '#C9A45A' }} />
            )}
          </button>
        );
      })}

      {/* Direction row */}
      <div style={{
        display: 'flex', gap: '4px',
        marginTop: '6px', padding: '6px 4px 0',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        {[
          { dir: 'desc', label: '↑ Most first'  },
          { dir: 'asc',  label: '↓ Least first' },
        ].map(({ dir, label }) => (
          <button
            key={dir}
            onClick={() => { setSortDir(dir); setOpen(false); }}
            style={{
              flex: 1, padding: '6px 4px',
              borderRadius: '6px',
              background: sortDir === dir ? 'rgba(185,134,11,0.18)' : 'rgba(255,255,255,0.06)',
              border: sortDir === dir ? '1px solid rgba(185,134,11,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: sortDir === dir ? '#C9A45A' : 'var(--text-on-shelf)',
              opacity: sortDir === dir ? 1 : 0.55,
              fontFamily: '"Lora", serif', fontSize: '0.68rem',
              cursor: 'pointer', transition: 'all 0.13s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = sortDir === dir ? '1' : '0.55'; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={openMenu}
        title="Sort order"
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: open ? 'rgba(185,134,11,0.16)' : 'rgba(255,255,255,0.06)',
          border: open ? '1px solid rgba(185,134,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '7px',
          padding: '5px 9px',
          cursor: 'pointer',
          color: open ? '#C9A45A' : 'var(--text-on-shelf)',
          opacity: open ? 1 : 0.65,
          fontFamily: '"Lora", serif', fontSize: '0.72rem',
          transition: 'all 0.18s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; } }}
      >
        <ArrowDownUp size={11} strokeWidth={2.2} />
      </button>

      {dropdown}
    </>
  );
}
