import Dexie from 'dexie';

export const db = new Dexie('PageShelfDB');

db.version(1).stores({
  books: 'id, title, addedAt, lastReadAt'
});
