'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Search, User, LogOut, Settings as SettingsIcon, Moon, Sun, Menu, AlertTriangle, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/store/useUIStore';
import { domainApi, type AlertRecord } from '@/lib/api';
import { formatTimestamp } from '@/lib/utils';

export function Topbar() {
    const { theme, toggleTheme, logout, toggleSidebar } = useUIStore();
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [lastSeenCount, setLastSeenCount] = useState(0);

    const fetchAlerts = useCallback(() => {
        domainApi.getAlerts()
            .then(data => setAlerts(data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
            fetchAlerts();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const unreadCount = Math.max(0, alerts.length - lastSeenCount);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 md:px-6 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="md:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                        placeholder="Search drivers, buses, or alerts..."
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm rounded-xl"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>

                <DropdownMenu onOpenChange={(open) => { if (open) setLastSeenCount(alerts.length); }}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full relative border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto">
                        <DropdownMenuLabel className="dark:text-slate-300 flex items-center justify-between">
                            <span>Notifications</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{alerts.length} total</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        {alerts.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">No notifications yet</div>
                        ) : (
                            alerts.slice(0, 10).map(alert => (
                                <DropdownMenuItem key={alert.id} className="cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800 flex items-start gap-3 py-3">
                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                        {alert.type === 'drowsiness' ? (
                                            <EyeOff className={`h-3.5 w-3.5 ${alert.severity === 'critical' ? 'text-brand-red' : 'text-brand-orange'}`} />
                                        ) : (
                                            <AlertTriangle className={`h-3.5 w-3.5 ${alert.severity === 'critical' ? 'text-brand-red' : 'text-brand-orange'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{alert.alarmType || alert.type}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alert.driver} &bull; {formatTimestamp(alert.timestamp)}</p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${alert.severity === 'critical' ? 'text-brand-red' : 'text-brand-orange'}`}>
                                        {alert.severity}
                                    </span>
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative flex items-center gap-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="hidden md:flex flex-col items-start leading-tight">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Super Admin</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DropdownMenuLabel className="dark:text-slate-300">My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        <DropdownMenuItem className="cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800">
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="dark:bg-slate-800" />
                        <DropdownMenuItem
                            onClick={logout}
                            className="text-red-500 focus:text-red-500 cursor-pointer dark:hover:bg-red-900/20"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
