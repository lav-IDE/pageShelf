import React from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { Trash2, FileText, Clock } from 'lucide-react';

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

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${book.title}"?\nThis will remove your reading progress.`)) {
      await db.books.delete(book.id);
      if (isSelected) {
        setSelectedBookId(null);
      }
    }
  };

  const percent = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  const thumbnailUrl = React.useMemo(() => {
    if (!book.thumbnailBlob) return null;
    return URL.createObjectURL(book.thumbnailBlob);
  }, [book.thumbnailBlob]);

  return (
    <div
      onClick={() => setSelectedBookId(book.id)}
      className={`group relative flex items-start p-3 gap-3 rounded-xl cursor-pointer transition-all border ${
        isSelected
          ? 'bg-purple-50 border-purple-200 shadow-sm'
          : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm hover:bg-gray-50'
      }`}
    >
      <div className="flex-none w-14 h-20 bg-gray-100 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] overflow-hidden flex items-center justify-center relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-6 h-6 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-semibold text-gray-900 truncate text-sm mb-1 leading-tight">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <Clock className="w-3 h-3" />
          {getRelativeTime(book.lastReadAt)}
        </p>
        
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${isSelected ? 'bg-purple-500' : 'bg-blue-500'} rounded-full transition-all duration-300`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-gray-500 w-7 text-right">
            {percent}%
          </span>
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 bg-white shadow-sm border border-gray-100"
        title="Delete Book"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
