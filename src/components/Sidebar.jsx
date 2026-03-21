import React, { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { uploadBook } from '../utils/pdf';
import { BookCard } from './BookCard';
import { useStore } from '../store';
import { Upload, Menu, Search, X } from 'lucide-react';

export function Sidebar() {
  const books = useLiveQuery(() => db.books.orderBy('lastReadAt').reverse().toArray());
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const { sidebarOpen, toggleSidebar } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("File is strictly limited to 100MB");
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.epub')) {
      alert("Only PDF and EPUB files are supported.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadBook(file);
    } catch (err) {
      console.error(err);
      alert("Failed to upload book");
    } finally {
      setIsUploading(false);
      // reset file input
      e.target.value = null;
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="flex-none w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-10">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Open Sidebar">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-none w-72 bg-white border-r border-gray-200 flex flex-col h-full transition-all z-10">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">PageShelf</h1>
        <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex-center transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Book'}
        </button>
        <input
          type="file"
          accept="application/pdf,.epub"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
        {!books ? (
          <div className="text-center text-gray-500 mt-4 text-sm animate-pulse">Loading...</div>
        ) : books.length === 0 ? (
          <div className="text-center mt-8 text-gray-400 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Upload className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium">Library is empty</p>
            <p className="text-xs">Upload your first PDF or EPUB</p>
          </div>
        ) : (
          books
            .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(book => (
               <BookCard key={book.id} book={book} />
          ))
        )}
      </div>
    </div>
  );
}
