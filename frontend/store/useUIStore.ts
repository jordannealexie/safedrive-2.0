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

    // Global Date Filter
    dateFilterPreset: 'all' | 'today' | '7d' | '30d' | 'custom';
    dateFilterStart: string | null;
    dateFilterEnd: string | null;
    setDateFilterPreset: (preset: 'all' | 'today' | '7d' | '30d' | 'custom') => void;
    setDateFilterRange: (start: string | null, end: string | null) => void;
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

            // Global Date Filter
            dateFilterPreset: 'all',
            dateFilterStart: null,
            dateFilterEnd: null,
            setDateFilterPreset: (preset) => set({ dateFilterPreset: preset }),
            setDateFilterRange: (start, end) => set({ dateFilterStart: start, dateFilterEnd: end }),
        }),
        {
            name: 'safedrive-ui-store',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                theme: state.theme,
                isSidebarOpen: state.isSidebarOpen,
                dateFilterPreset: state.dateFilterPreset,
                dateFilterStart: state.dateFilterStart,
                dateFilterEnd: state.dateFilterEnd,
            }),
        }
    )
);
