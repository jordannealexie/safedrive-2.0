import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),

            // Auth
            isAuthenticated: false,
            login: () => set({ isAuthenticated: true }),
            logout: () => set({ isAuthenticated: false }),

            // Theme
            theme: 'light',
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),
        }),
        {
            name: 'safedrive-ui-store',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                theme: state.theme,
                isSidebarOpen: state.isSidebarOpen,
            }),
        }
    )
);
