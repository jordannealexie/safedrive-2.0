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
import { domainApi } from '@/lib/api';

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [totalAlerts, setTotalAlerts] = useState(0);
    const [resolvedAlerts, setResolvedAlerts] = useState(0);
    const [driverCount, setDriverCount] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);

    useEffect(() => {
        Promise.all([
            domainApi.getAlerts().then(alerts => {
                setTotalAlerts(alerts.length);
                setResolvedAlerts(alerts.filter((a: any) => a.status === 'Resolved').length);
            }),
            domainApi.getDrivers().then(d => setDriverCount(d.length)),
            domainApi.getSessions().then(s => setSessionCount(s.length)),
        ]).catch(console.error).finally(() => setIsLoading(false));
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
                                    <p className="text-4xl font-black mt-2">{totalAlerts > 0 ? `${Math.round((resolvedAlerts / totalAlerts) * 100)}%` : '—'}</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{resolvedAlerts} / {totalAlerts} ALERTS RESOLVED</p>
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
                                    <p className="text-4xl font-black mt-2">{totalAlerts}</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">TOTAL ALERTS LOGGED</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform">
                                    <BarChart4 className="w-32 h-32 text-slate-800 dark:text-white" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Active Sessions</CardTitle>
                                    <p className="text-4xl font-black mt-2 text-slate-800 dark:text-white">{sessionCount}</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">{driverCount} REGISTERED DRIVER{driverCount !== 1 ? 'S' : ''}</p>
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
                        <div className="p-12 text-center text-slate-400 dark:text-slate-600">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-sm">No reports generated yet.</p>
                            <p className="text-xs mt-1">Reports will appear as the system collects drowsiness events.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
