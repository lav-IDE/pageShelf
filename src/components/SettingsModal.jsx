import React, { useRef, useState } from 'react';
import JSZip from 'jszip';
import { db } from '../db';
import { DownloadCloud, UploadCloud, X, Settings } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, label: '' });
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const zip = new JSZip();
      
      const books = await db.books.toArray();
      const folders = await db.folders.toArray();
      
      const booksMetadata = [];
      
      for (const book of books) {
        const { fileBlob, thumbnailBlob, ...meta } = book;
        booksMetadata.push(meta);
        
        if (fileBlob) zip.file(`files/${book.id}`, fileBlob);
        if (thumbnailBlob) zip.file(`thumbnails/${book.id}`, thumbnailBlob);
      }
      
      zip.file('data.json', JSON.stringify({ version: 1, folders, books: booksMetadata }));
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pageshelf-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export library.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportProgress({ current: 0, total: 0, label: 'Reading archive…' });

      const zip = await JSZip.loadAsync(file, {
        onUpdate: (meta) => {
          setImportProgress(p => ({ ...p, label: `Unpacking… ${meta.percent.toFixed(0)}%` }));
        },
      });

      const dataFile = zip.file('data.json');
      if (!dataFile) {
        alert('Invalid backup file. Could not find data.json');
        return;
      }

      setImportProgress(p => ({ ...p, label: 'Reading catalogue…' }));
      const dataStr = await dataFile.async('string');
      const data = JSON.parse(dataStr);

      if (!data || typeof data !== 'object' || !Array.isArray(data.books)) {
        alert('Invalid backup format — the data.json inside the zip is not a valid PageShelf export.');
        return;
      }

      // Helper: safely coerce ISO strings back to Date objects after JSON round-trip
      const toDate = (v) => v ? (v instanceof Date ? v : new Date(v)) : null;

      if (data.folders) {
        setImportProgress(p => ({ ...p, label: 'Restoring collections…' }));
        for (const f of data.folders) {
          await db.folders.put({
            ...f,
            createdAt: toDate(f.createdAt),
          });
        }
      }

      if (data.books) {
        const total = data.books.length;
        for (let i = 0; i < total; i++) {
          const b = data.books[i];
          setImportProgress({ current: i + 1, total, label: `Restoring "${b.title || 'book'}"…` });
          try {
            const fileZipEntry = zip.file(`files/${b.id}`);
            const thumbZipEntry = zip.file(`thumbnails/${b.id}`);
            const fileBlob = fileZipEntry ? await fileZipEntry.async('blob') : null;
            const thumbnailBlob = thumbZipEntry ? await thumbZipEntry.async('blob') : null;
            if (fileBlob) {
              await db.books.put({
                ...b,
                fileBlob,
                thumbnailBlob,
                addedAt:    toDate(b.addedAt),
                lastReadAt: toDate(b.lastReadAt),
              });
            }
          } catch (err) {
            console.error(`Failed to import book ${b.id}`, err);
          }
        }
      }

      setImportProgress({ current: 0, total: 0, label: '' });
      alert('Library successfully restored!');
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import library. The zip file may be corrupted.');
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0, label: '' });
      if (e.target) e.target.value = null;
    }
  };

  const btnStyle = {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontFamily: '"Lora", serif', fontSize: '0.82rem', fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background 0.18s, transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 4px var(--shadow)',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
        width: '100%', maxWidth: '360px',
        overflow: 'hidden',
        color: 'var(--text-primary)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <h2 style={{ margin: 0, fontFamily: '"Lora", serif', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} style={{ color: 'var(--accent)' }} />
            Library Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'color 0.15s, background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{
              margin: '0 0 12px',
              fontFamily: '"Lora", serif', fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border)',
            }}>Library Archive</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleExport}
                disabled={isExporting || isImporting}
                style={{ ...btnStyle, opacity: (isExporting || isImporting) ? 0.5 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px var(--shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px var(--shadow)'; }}
              >
                <DownloadCloud size={15} style={{ color: 'var(--text-muted)' }} />
                {isExporting ? 'Packing archive…' : 'Export Archive'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExporting || isImporting}
                style={{ ...btnStyle, opacity: (isExporting || isImporting) ? 0.5 : 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 3px 10px var(--shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px var(--shadow)'; }}
              >
                <UploadCloud size={15} style={{ color: 'var(--text-muted)' }} />
                {isImporting ? 'Restoring archive…' : 'Restore Archive'}
              </button>
              <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleImport} />

              {/* Progress indicator */}
              {isImporting && (
                <div style={{ marginTop: '2px' }}>
                  <p style={{
                    fontFamily: '"Lora", serif', fontSize: '0.74rem',
                    color: 'var(--text-muted)', fontStyle: 'italic',
                    marginBottom: '6px', lineHeight: 1.5,
                  }}>
                    {importProgress.label}
                  </p>
                  {importProgress.total > 0 && (
                    <>
                      <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(importProgress.current / importProgress.total) * 100}%`,
                          background: 'var(--accent)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <p style={{
                        fontFamily: '"Lora", serif', fontSize: '0.68rem',
                        color: 'var(--text-muted)', opacity: 0.6,
                        marginTop: '4px', textAlign: 'right',
                      }}>
                        {importProgress.current} / {importProgress.total}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
            <p style={{ margin: '10px 0 0', fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Create an archive of your collections to keep them safe, or restore from a previous backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
