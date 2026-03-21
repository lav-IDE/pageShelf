import { create } from 'zustand';

export const useStore = create((set) => ({
  selectedBookId: null,
  sidebarOpen: true,
  setSelectedBookId: (id) => set({ selectedBookId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen })
}));
