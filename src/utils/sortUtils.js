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
