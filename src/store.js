import { create } from 'zustand';

const initialTheme = localStorage.getItem('pageshelf-theme') || 'dark';

export const useStore = create((set) => ({
  selectedBookId: null,
  sidebarOpen: true,
  theme: initialTheme,
  setSelectedBookId: (id) => set({ selectedBookId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setTheme: (theme) => {
    localStorage.setItem('pageshelf-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  }
}));
