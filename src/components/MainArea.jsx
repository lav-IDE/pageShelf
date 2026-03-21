import React from 'react';
import { useStore } from '../store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PdfViewer } from './PdfViewer';
import { BookOpen } from 'lucide-react';

export function MainArea() {
  const selectedBookId = useStore((state) => state.selectedBookId);
  const book = useLiveQuery(
    () => selectedBookId ? db.books.get(selectedBookId) : Promise.resolve(null),
    [selectedBookId]
  );

  if (!selectedBookId || !book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">Select a book to start reading</h2>
        <p className="text-gray-500 mt-2 text-sm">Or upload a new PDF to your library from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-pdfbg">
      <div className="h-14 flex-none bg-white border-b border-gray-200 flex items-center px-4 shadow-sm z-10 px-6 gap-4 justify-between">
        <h2 className="font-semibold text-gray-800 truncate" title={book.title}>{book.title}</h2>
        <div className="text-sm font-medium text-gray-500 bg-gray-100 py-1 px-3 rounded-full flex items-center">
          {Math.round((book.currentPage / book.totalPages) * 100)}% Complete
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <PdfViewer book={book} />
      </div>
    </div>
  );
}
