'use client';

import { Bell, Search, User, LogOut, Settings as SettingsIcon, Moon, Sun, Menu } from 'lucide-react';
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

export function Topbar() {
    const { theme, toggleTheme, logout, toggleSidebar } = useUIStore();

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

                <div className="relative">
                    <Button variant="outline" size="icon" className="rounded-full relative border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-brand-red border-2 border-white dark:border-slate-900"></span>
                    </Button>
                </div>

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
