import { create } from 'zustand';

const initialTheme = localStorage.getItem('pageshelf-theme') || 'dark';
const initialSortBy  = localStorage.getItem('pageshelf-sortBy')  || 'lastRead';
const initialSortDir = localStorage.getItem('pageshelf-sortDir') || 'desc';

export const useStore = create((set) => ({
  selectedBookId: null,
  sidebarOpen: true,
  theme: initialTheme,
  // 'lastRead' | 'name' | 'pages'
  sortBy: initialSortBy,
  // 'asc' | 'desc'
  sortDir: initialSortDir,

  setSelectedBookId: (id) => set({ selectedBookId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setTheme: (theme) => {
    localStorage.setItem('pageshelf-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  setSortBy: (sortBy) => {
    localStorage.setItem('pageshelf-sortBy', sortBy);
    set({ sortBy });
  },
  setSortDir: (sortDir) => {
    localStorage.setItem('pageshelf-sortDir', sortDir);
    set({ sortDir });
  },
}));
