import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../db';
import { useStore } from '../store';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, FileText, BookOpen } from 'lucide-react';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Sample a canvas and return the average luminance [0–255].
 * We probe a sparse grid (up to ~200 samples) to keep it fast.
 */
function getCanvasLuminance(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    if (!width || !height) return 255; // treat empty canvas as light
    const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 200)));
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let total = 0, count = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        // Perceptual luminance: 0.2126R + 0.7152G + 0.0722B
        total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        count++;
      }
    }
    return count > 0 ? total / count : 255;
  } catch {
    return 255; // cross-origin / security error → assume light
  }
}

export function PdfViewer({ book }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvas2Ref = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(book.currentPage || 1);
  const [scale, setScale] = useState(book.zoomScale ?? 1.5);
  const [pdfError, setPdfError] = useState(null);
  const renderTaskRef = useRef(null);
  const renderTask2Ref = useRef(null);

  // Per-canvas luminance: true = page is already dark, skip invert
  const [canvas1Dark, setCanvas1Dark] = useState(false);
  const [canvas2Dark, setCanvas2Dark] = useState(false);

  const theme = useStore((s) => s.theme);

  // Double-page mode: only valid for portrait (aspect ratio < 1) pages
  const [doublePageMode, setDoublePageMode] = useState(false);
  // Whether first page aspect ratio is portrait — determined after first render
  const [isPortrait, setIsPortrait] = useState(false);

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

        // Check orientation of page 1
        const firstPage = await pdf.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        setIsPortrait(vp.width / vp.height < 1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (active) setPdfError(err.message);
      }
    };
    loadPdf();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // If PDF turns out to be landscape, exit double-page mode automatically
  useEffect(() => {
    if (!isPortrait) setDoublePageMode(false);
  }, [isPortrait]);

  const renderSinglePage = useCallback(async (num, doc, currentScale, canvasEl, taskRef, onRendered) => {
    if (!doc || !canvasEl) return;
    try {
      if (taskRef.current) {
        await taskRef.current.cancel();
        taskRef.current = null;
      }
      const page = await doc.getPage(num);
      const viewport = page.getViewport({ scale: currentScale });
      const context = canvasEl.getContext('2d');

      const pixelRatio = window.devicePixelRatio || 1;
      canvasEl.width = viewport.width * pixelRatio;
      canvasEl.height = viewport.height * pixelRatio;
      canvasEl.style.width = `${viewport.width}px`;
      canvasEl.style.height = `${viewport.height}px`;
      context.scale(pixelRatio, pixelRatio);

      const task = page.render({ canvasContext: context, viewport });
      taskRef.current = task;
      await task.promise;

      // After rendering, sample page luminance so we know whether to invert
      if (onRendered) {
        const lum = getCanvasLuminance(canvasEl);
        onRendered(lum < 128); // true = page is already dark
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;

    if (doublePageMode) {
      // Render left page (current)
      renderSinglePage(pageNumber, pdfDoc, scale, canvasRef.current, renderTaskRef, setCanvas1Dark);

      // Render right page (current + 1), if it exists
      if (pageNumber + 1 <= pdfDoc.numPages) {
        renderSinglePage(pageNumber + 1, pdfDoc, scale, canvas2Ref.current, renderTask2Ref, setCanvas2Dark);
      } else {
        // Clear the right canvas if no second page
        const c = canvas2Ref.current;
        if (c) {
          c.width = 0;
          c.height = 0;
          c.style.width = '0';
          c.style.height = '0';
        }
        setCanvas2Dark(false);
      }
    } else {
      // Cancel any lingering second-page task
      if (renderTask2Ref.current) {
        renderTask2Ref.current.cancel();
        renderTask2Ref.current = null;
      }
      renderSinglePage(pageNumber, pdfDoc, scale, canvasRef.current, renderTaskRef, setCanvas1Dark);
      setCanvas2Dark(false);
    }
  }, [pdfDoc, pageNumber, scale, doublePageMode, renderSinglePage]);

  // Keyboard navigation: ← / → arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); changePage(doublePageMode ? 2 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); changePage(doublePageMode ? -2 : -1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pdfDoc, doublePageMode]);

  // Fullscreen zoom: +25% on enter, -25% on exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setScale(s => {
          const next = Math.min(s + 0.25, 3.0);
          db.books.update(book.id, { zoomScale: next });
          return next;
        });
      } else {
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

  const changePage = async (offset) => {
    if (!pdfDoc) return;
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= pdfDoc.numPages) {
      setPageNumber(newPage);
      await db.books.update(book.id, {
        currentPage: newPage,
        lastReadAt: new Date(),
        readingProgress: newPage / pdfDoc.numPages,
      });
    }
  };

  const saveZoom = (newScale) => { db.books.update(book.id, { zoomScale: newScale }); };

  const handleZoomIn = () => setScale(s => { const next = Math.min(s + 0.25, 3.0); saveZoom(next); return next; });
  const handleZoomOut = () => setScale(s => { const next = Math.max(s - 0.25, 0.5); saveZoom(next); return next; });

  const handleJump = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1 && val <= book.totalPages) {
        setPageNumber(val);
        db.books.update(book.id, { currentPage: val, lastReadAt: new Date() });
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

  /**
   * Compute the CSS filter to apply to a canvas based on:
   * - theme: only apply invert in dark mode
   * - isPageDark: if the page itself is already dark, skip invert (preserve it as-is)
   */
  const getCanvasFilter = (isPageDark) => {
    if (theme !== 'dark' || isPageDark) return 'none';
    // Light page in dark mode: invert + rotate hue to restore natural colors
    return 'invert(1) hue-rotate(180deg)';
  };

  const canvasTransition = 'filter 300ms ease';

  const pageStep = doublePageMode ? 2 : 1;
  const atEnd = pdfDoc && pageNumber >= pdfDoc.numPages - (doublePageMode ? 1 : 0);

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
            onClick={() => changePage(-pageStep)}
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
            onClick={() => changePage(pageStep)}
            disabled={!!atEnd}
            style={{ ...toolbarBtn, opacity: atEnd ? 0.35 : 1 }}
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

        {/* Right-side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {/* Double-page toggle — only shown for portrait PDFs */}
          {isPortrait && (
            <button
              onClick={() => setDoublePageMode(m => !m)}
              style={{
                ...toolbarBtn,
                width: 'auto',
                padding: '0 8px',
                gap: '5px',
                background: doublePageMode ? 'var(--accent)' : 'transparent',
                color: doublePageMode ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${doublePageMode ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontFamily: '"Lora", serif',
                fontWeight: 600,
                letterSpacing: '0.02em',
                transition: 'background 0.18s, color 0.18s, border-color 0.18s',
              }}
              title={doublePageMode ? 'Switch to single page' : 'Switch to double page view'}
              onMouseEnter={e => {
                if (!doublePageMode) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (!doublePageMode) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <BookOpen size={14} />
              <span>2-page</span>
            </button>
          )}

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
      </div>

      {/* PDF Canvas Area */}
      <div
        ref={containerRef}
        className="scrollbar-vintage"
        style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', display: 'flex', justifyContent: 'center', padding: '28px 20px' }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: doublePageMode ? '2px' : '0',
          margin: '0 auto',
          minWidth: 'min-content',
        }}>
          {/* Left / single canvas */}
          <div style={{
            position: 'relative',
            boxShadow: doublePageMode
              ? '0 8px 40px rgba(0,0,0,0.35)'
              : '0 8px 40px rgba(0,0,0,0.35)',
            borderRadius: doublePageMode ? '2px 0 0 2px' : '1px',
          }}>
            {!pdfDoc && (
              <div style={{ position: 'absolute', inset: 0, minWidth: '200px', minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'transparent' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontFamily: '"Lora", serif', fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Opening manuscript…</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                verticalAlign: 'top',
                filter: getCanvasFilter(canvas1Dark),
                transition: canvasTransition,
              }}
            />
          </div>

          {/* Right canvas — only mounted/visible in double-page mode */}
          {doublePageMode && (
            <div style={{
              position: 'relative',
              boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
              borderRadius: '0 2px 2px 0',
              borderLeft: '1px solid rgba(0,0,0,0.18)',
            }}>
              <canvas
                ref={canvas2Ref}
                style={{
                  display: 'block',
                  verticalAlign: 'top',
                  filter: getCanvasFilter(canvas2Dark),
                  transition: canvasTransition,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
