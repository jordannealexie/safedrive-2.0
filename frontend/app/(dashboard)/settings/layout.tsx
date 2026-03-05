'use client';

import { 
    Settings as SettingsIcon, 
    Bell, 
    Shield, 
    User, 
    Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const SETTINGS_TABS = [
    { label: 'General', icon: SettingsIcon, href: '/settings' },
    { label: 'Alert Thresholds', icon: Zap, href: '/settings/alert-thresholds' },
    { label: 'Notifications', icon: Bell, href: '/settings/notifications' },
    { label: 'User Roles', icon: Shield, href: '/settings/user-roles' },
    { label: 'Driver Rules', icon: User, href: '/settings/driver-rules' },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure drowsiness thresholds and system behavior.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-2">
                    {SETTINGS_TABS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                                    isActive
                                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="md:col-span-3">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
