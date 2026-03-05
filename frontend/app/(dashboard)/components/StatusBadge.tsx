'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const getStatusStyles = (s: string) => {
        switch (s.toLowerCase()) {
            case 'normal':
            case 'online':
            case 'resolved':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'drowsy':
            case 'offline':
            case 'high':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'stationary':
            case 'medium':
            case 'acknowledged':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                getStatusStyles(status),
                className
            )}
        >
            <span className={cn(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                status.toLowerCase() === 'normal' || status.toLowerCase() === 'online' ? "bg-emerald-500" :
                    status.toLowerCase() === 'drowsy' || status.toLowerCase() === 'high' ? "bg-rose-500 animate-pulse" :
                        "bg-amber-500"
            )} />
            {status}
        </motion.span>
    );
}
