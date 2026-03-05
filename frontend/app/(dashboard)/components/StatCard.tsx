'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon, Bus, Users, UserX, AlertTriangle, Cpu } from "lucide-react";
import { motion } from "framer-motion";

const icons = {
    Bus,
    Users,
    UserX,
    AlertTriangle,
    Cpu,
};

import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
    label: string;
    value: string;
    trend: string;
    icon: keyof typeof icons;
    color?: string;
    index: number;
    isLoading?: boolean;
}

export function StatCard({ label, value, trend, icon, color, index, isLoading }: StatCardProps) {
    if (isLoading) {
        return (
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                    <div className="mt-4">
                        <Skeleton className="h-4 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const Icon = icons[icon];
    const isPositive = trend.startsWith('+');
    const isNegative = trend.startsWith('-');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
        >
            <Card className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                            <h3 className={cn("text-2xl font-bold mt-1 text-slate-800 dark:text-white", color)}>
                                {value}
                            </h3>
                        </div>
                        <div className={cn(
                            "p-3 rounded-xl",
                            color ? "bg-brand-red/10 animate-pulse" : "bg-slate-100 dark:bg-slate-800"
                        )}>
                            <Icon className={cn(
                                "w-6 h-6",
                                color || "text-slate-600 dark:text-slate-400"
                            )} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            isPositive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                isNegative ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                            {trend}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">vs last month</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
