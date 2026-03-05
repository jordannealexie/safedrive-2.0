'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FileText,
    Download,
    Calendar,
    BarChart4,
    PieChart,
    TrendingUp,
    ChevronRight,
    Filter,
    Activity,
    LineChart
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from '@/lib/utils';

const REPORTS = [
    { id: 1, title: 'Weekly Fleet Safety Metric', date: 'Jan 15, 2026', size: '2.4 MB', type: 'PDF' },
    { id: 2, title: 'Network Operational Efficiency', date: 'Jan 10, 2026', size: '5.1 MB', type: 'Excel' },
    { id: 3, title: 'Personnel Vigilance Diagnostic', date: 'Jan 01, 2026', size: '1.8 MB', type: 'PDF' },
    { id: 4, title: 'Hardware Health Census', date: 'Dec 28, 2025', size: '3.2 MB', type: 'PDF' },
];

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const SkeletonStat = () => (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-48" />
            </CardContent>
        </Card>
    );

    const SkeletonReport = () => (
        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Ledger</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Algorithmic summaries and historical operational audits.</p>
                </div>
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white h-11 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2">
                    <Activity className="w-4 h-4" /> Synthesize Report
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="border-none shadow-xl bg-brand-red text-white overflow-hidden relative group">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-32 h-32" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Safety Compliance</CardTitle>
                                    <p className="text-4xl font-black mt-2">94.2%</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">+2.4% PERFORMANCE GAIN</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="border-none shadow-xl bg-slate-900 dark:bg-black text-white overflow-hidden relative group">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                                    <PieChart className="w-32 h-32" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Alert Resolution</CardTitle>
                                    <p className="text-4xl font-black mt-2">88.5%</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">AVG. LATENCY: 4.2 MIN</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
                                    <BarChart4 className="w-32 h-32 text-slate-800 dark:text-white" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Fleet Operational Hours</CardTitle>
                                    <p className="text-4xl font-black mt-2 text-slate-800 dark:text-white">1,240h</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">ACROSS 42 ACTIVE NODES</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-wider">Historical Archive</h2>
                    <Button variant="ghost" size="sm" className="gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-brand-red transition-colors">
                        <Filter className="w-3.5 h-3.5" /> Class Filter
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => <SkeletonReport key={i} />)
                    ) : (
                        REPORTS.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all hover:border-brand-red/20"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-brand-red/10 group-hover:text-brand-red group-hover:border-brand-red/20 transition-all">
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-red transition-colors">{report.title}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {report.date}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                            <span>{report.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                        {report.type}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-brand-red/10 hover:text-brand-red text-slate-400 transition-colors">
                                            <Download className="w-5 h-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-brand-red/10 hover:text-brand-red text-slate-400 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
