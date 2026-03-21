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
  const [scale, setScale] = useState(1.5);
  const [pdfError, setPdfError] = useState(null);
  const renderTaskRef = useRef(null);

  const fileUrl = useMemo(() => {
    return URL.createObjectURL(book.fileBlob);
  }, [book.fileBlob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  useEffect(() => {
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
  }, [fileUrl, book.currentPage]);

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

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
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
    return <div className="p-8 text-center text-red-500 flex flex-col items-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex justify-center items-center mb-4">
        <FileText className="w-8 h-8 text-red-500" />
      </div>
      Failed to load PDF: {pdfError}
    </div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#323639]">
      <div className="h-12 flex-none bg-[#323639] border-b border-[#2b2d2f] shadow-md flex items-center justify-between px-4 z-20 text-gray-200">
        <div className="flex items-center gap-1 bg-[#424649] rounded-lg p-1">
          <button 
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 hover:bg-[#525659] rounded disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-2 text-sm font-medium">
            <input 
               type="text" 
               defaultValue={pageNumber} 
               key={pageNumber}
               onKeyDown={handleJump}
               className="w-12 text-center bg-[#2b2d2f] rounded border border-[#525659] py-0.5 focus:outline-none focus:border-purple-500 text-white" 
            />
            <span className="text-gray-400">/ {book.totalPages}</span>
          </div>
          <button 
            onClick={() => changePage(1)}
            disabled={pdfDoc && pageNumber >= pdfDoc.numPages}
            className="p-1 hover:bg-[#525659] rounded disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[#424649] rounded-lg p-1">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-[#525659] rounded transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-[#525659] rounded transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div>
          <button onClick={() => containerRef.current?.requestFullscreen()} className="p-1.5 hover:bg-[#424649] rounded transition-colors" title="Fullscreen">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#525659] flex justify-center p-4 custom-scrollbar"
      >
        <div className="bg-white shadow-2xl relative min-w-min mx-auto my-0 select-text rounded-sm">
          {!pdfDoc && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-100 flex-col gap-3">
               <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-gray-500 font-medium">Loading Document...</span>
             </div>
          )}
          <canvas ref={canvasRef} className="block align-top" />
        </div>
      </div>
    </div>
  );
}
