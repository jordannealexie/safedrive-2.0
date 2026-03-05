'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map,
    Users,
    Bell,
    BarChart3,
    Activity,
    Settings,
    HelpCircle,
    Menu,
    ChevronLeft,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Live Monitoring', href: '/live-monitoring', icon: Map },
    { label: 'Drivers', href: '/drivers', icon: Users },
    { label: 'Alerts', href: '/alerts', icon: Bell },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'System Status', href: '/system-status', icon: Activity },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'FAQs', href: '/faqs', icon: HelpCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity lg:hidden",
                    isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            />

            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 h-screen transition-all duration-300 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                    isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/images/safedrive-logo.png"
                                    alt="SafeDrive Logo"
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                />
                                <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">SafeDrive</span>
                            </div>
                        ) : (
                            <Image
                                src="/images/safedrive-logo.png"
                                alt="SafeDrive Logo"
                                width={32}
                                height={32}
                                className="mx-auto rounded-lg"
                            />
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5 lg:w-5 lg:h-5" />}
                        </Button>
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) setSidebarOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                                        isActive
                                            ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                                        !isSidebarOpen && "lg:justify-center"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 shrink-0", !isActive && "group-hover:scale-110 transition-transform")} />
                                    {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}

                                    {!isSidebarOpen && (
                                        <div className="hidden lg:block absolute left-16 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer info */}
                    {isSidebarOpen && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Node Status</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Operational
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
