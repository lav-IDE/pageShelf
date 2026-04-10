import Dexie from 'dexie';

export const db = new Dexie('PageShelfDB');

db.version(1).stores({
  books: 'id, title, addedAt, lastReadAt'
});

db.version(2).stores({
  books: 'id, title, addedAt, lastReadAt, folderId',
  folders: 'id, name, createdAt'
});

// version 3: adds zoomScale column (non-indexed, just stored in the record)
db.version(3).stores({
  books: 'id, title, addedAt, lastReadAt, folderId',
  folders: 'id, name, createdAt'
});
