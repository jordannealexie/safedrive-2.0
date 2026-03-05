'use client';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSidebarOpen } = useUIStore();

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar />
            <div
                className={cn(
                    "flex flex-1 flex-col transition-all duration-300",
                    isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
                )}
            >
                <Topbar />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
