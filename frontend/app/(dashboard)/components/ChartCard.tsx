'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    delay?: number;
    isLoading?: boolean;
}

export function ChartCard({ title, description, children, className, delay = 0, isLoading }: ChartCardProps) {
    if (isLoading) {
        return (
            <Card className={cn("h-full border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden", className)}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full mt-4 rounded-xl" />
                </CardContent>
            </Card>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            className={className}
        >
            <Card className="h-full border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">{title}</CardTitle>
                    {description && (
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">{description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-4">
                        {children}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
