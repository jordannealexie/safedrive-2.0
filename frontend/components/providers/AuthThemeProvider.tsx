'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';

export function AuthThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, toggleTheme, isAuthenticated } = useUIStore();
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Handle Hydration & Initial Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('safedrive-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            if (theme !== 'dark') toggleTheme();
        }
        setMounted(true);
    }, []);

    // Persist Theme & Apply Class
    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('safedrive-theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('safedrive-theme', 'light');
        }
    }, [theme, mounted]);

    // Auth Redirection Logic
    useEffect(() => {
        if (!mounted) return;

        const isAuthRoute = pathname === '/login';

        if (!isAuthenticated && !isAuthRoute) {
            router.push('/login');
        } else if (isAuthenticated && isAuthRoute) {
            router.push('/');
        }
    }, [isAuthenticated, pathname, mounted, router]);

    // Prevent flash of unstyled content
    if (!mounted) {
        return <div className="min-h-screen bg-white" />;
    }

    return <>{children}</>;
}
