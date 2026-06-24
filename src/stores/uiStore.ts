import { create } from 'zustand'
interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
}
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
}))
