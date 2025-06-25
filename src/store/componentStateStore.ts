import { create } from 'zustand'

interface ComponentState {
    isSidebarOpen: boolean,
    setIsSidebarOpen: (isOpen: boolean) => void,
}

export const useComponentStateStore = create<ComponentState>((set) => ({
    isSidebarOpen: false,
    setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}))