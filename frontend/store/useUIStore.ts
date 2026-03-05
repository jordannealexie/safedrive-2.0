import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Auth State
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;

    // Theme State
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    // Auth
    isAuthenticated: false, // Default to false for protection
    login: () => set({ isAuthenticated: true }),
    logout: () => set({ isAuthenticated: false }),

    // Theme
    theme: 'light',
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
    })),
}));
