import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../db';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, FileText } from 'lucide-react';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export function PdfViewer({ book }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(book.currentPage || 1);
  const [scale, setScale] = useState(book.zoomScale ?? 1.5);
  const [pdfError, setPdfError] = useState(null);
  const renderTaskRef = useRef(null);

  const [fileUrl, setFileUrl] = useState(null);

  useEffect(() => {
    if (!book.fileBlob) return;
    const url = URL.createObjectURL(book.fileBlob);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once per mount

  useEffect(() => {
    if (!fileUrl) return;
    let active = true;
    const loadPdf = async () => {
      try {
        setPdfError(null);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(pdf);
        setPageNumber(book.currentPage || 1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (active) setPdfError(err.message);
      }
    };
    loadPdf();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  const renderPage = useCallback(async (num, doc, currentScale) => {
    if (!doc || !canvasRef.current) return;
    try {
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel();
      }
      const page = await doc.getPage(num);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.scale(pixelRatio, pixelRatio);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNumber, pdfDoc, scale);
    }
  }, [pdfDoc, pageNumber, scale, renderPage]);

  // Keyboard navigation: ← / → arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when focus is inside a text-editable element
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        changePage(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changePage(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pdfDoc]);

  // Fullscreen zoom: +25% on enter, -25% on exit (relative to current scale at that moment)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // Entering fullscreen — bump scale by 0.25
        setScale(s => {
          const next = Math.min(s + 0.25, 3.0);
          db.books.update(book.id, { zoomScale: next });
          return next;
        });
      } else {
        // Exiting fullscreen — subtract 0.25 from whatever scale is active now
        setScale(s => {
          const next = Math.max(s - 0.25, 0.5);
          db.books.update(book.id, { zoomScale: next });
          return next;
        });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page changes
  const changePage = async (offset) => {
    if (!pdfDoc) return;
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
      setPageNumber(newPage);
      
      // Update indexedDB immediately
      await db.books.update(book.id, {
        currentPage: newPage,
        lastReadAt: new Date(),
        readingProgress: newPage / pdfDoc.numPages,
      });
    }
  };

  const saveZoom = (newScale) => {
    db.books.update(book.id, { zoomScale: newScale });
  };

  const handleZoomIn = () => setScale(s => {
    const next = Math.min(s + 0.25, 3.0);
    saveZoom(next);
    return next;
  });
  const handleZoomOut = () => setScale(s => {
    const next = Math.max(s - 0.25, 0.5);
    saveZoom(next);
    return next;
  });
  const handleJump = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1 && val <= book.totalPages) {
        setPageNumber(val);
        db.books.update(book.id, {
          currentPage: val,
          lastReadAt: new Date()
        });
      }
    }
  };

  if (pdfError) {
    return <div className="p-8 text-center text-accent flex flex-col items-center">
      <div className="w-16 h-16 bg-bg-tertiary rounded-full flex justify-center items-center mb-4 border border-border-warm shadow-card">
        <FileText className="w-8 h-8 text-accent" />
      </div>
      Failed to load PDF: {pdfError}
    </div>;
  }

  const toolbarBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', borderRadius: '5px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', transition: 'background 0.15s, color 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 24px var(--shadow)', background: 'var(--surface)' }}>
      {/* Toolbar */}
      <div style={{
        height: '48px', flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px', gap: '10px', zIndex: 20,
      }}>
        {/* Page nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '7px', padding: '2px',
          boxShadow: 'inset 0 1px 3px var(--shadow)',
        }}>
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            style={{ ...toolbarBtn, opacity: pageNumber <= 1 ? 0.35 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px' }}>
            <input
              type="text"
              defaultValue={pageNumber}
              key={pageNumber}
              onKeyDown={handleJump}
              style={{
                width: '38px', textAlign: 'center',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '4px', padding: '2px 4px',
                fontFamily: '"Lora", serif', fontSize: '0.78rem',
                color: 'var(--text-primary)', outline: 'none',
                boxShadow: 'inset 0 1px 2px var(--shadow)',
              }}
            />
            <span style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ {book.totalPages}</span>
          </div>
          <button
            onClick={() => changePage(1)}
            disabled={pdfDoc && pageNumber >= pdfDoc.numPages}
            style={{ ...toolbarBtn, opacity: (pdfDoc && pageNumber >= pdfDoc.numPages) ? 0.35 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '7px', padding: '2px',
          boxShadow: 'inset 0 1px 3px var(--shadow)',
        }}>
          <button
            onClick={handleZoomOut}
            style={toolbarBtn}
            title="Zoom Out"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontFamily: '"Lora", serif', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-secondary)', width: '40px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            style={toolbarBtn}
            title="Zoom In"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={() => {
            const el = document.getElementById('main-area') || containerRef.current;
            if (document.fullscreenElement) document.exitFullscreen();
            else el?.requestFullscreen();
          }}
          style={toolbarBtn}
          title="Fullscreen"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Maximize size={15} />
        </button>
      </div>

      {/* PDF Canvas */}
      <div
        ref={containerRef}
        className="scrollbar-vintage"
        style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', display: 'flex', justifyContent: 'center', padding: '28px 20px' }}
      >
        <div style={{ position: 'relative', minWidth: 'min-content', margin: '0 auto', boxShadow: '0 8px 40px rgba(0,0,0,0.35)', borderRadius: '1px' }}>
          {!pdfDoc && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'transparent' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Opening manuscript…</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{ display: 'block', verticalAlign: 'top' }}
            className="mix-blend-multiply dark:mix-blend-normal dark:invert dark:hue-rotate-180 transition-[filter]"
          />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
