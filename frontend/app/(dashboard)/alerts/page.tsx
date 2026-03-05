'use client';

import { useState, useEffect } from 'react';
import { MOCK_ALERTS } from '@/lib/mock-data';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    Filter,
    Download,
    CheckCircle2,
    Eye,
    AlertTriangle,
    History,
    MoreHorizontal,
    ShieldAlert,
    Clock,
    CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AlertsPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const SkeletonStat = () => (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-10" />
            </div>
        </div>
    );

    const SkeletonRow = () => (
        <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
            <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
            <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
            <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
        </tr>
    );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Security Protocol Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Historical trace of all elevated safety incidents and node failures.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                        <Download className="w-4 h-4" /> Export Ledger
                    </Button>
                    <Button className="bg-brand-red hover:bg-brand-red/90 text-white h-10 px-6 font-bold shadow-lg shadow-brand-red/20">
                        Sanitize Notifications
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Criticality</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">08</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Audit</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">14</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved Cycles</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">22</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search registry by type, driver, or node ID..." className="pl-10 h-11 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 transition-all rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2 h-11 px-6 border-slate-200 dark:border-slate-800 dark:text-slate-300 font-bold">
                            <Filter className="w-4 h-4" /> Logic Filters
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Anomaly Class</th>
                                <th className="px-6 py-4">Personnel / Unit</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Geospatial Marker</th>
                                <th className="px-6 py-4">Severity</th>
                                <th className="px-6 py-4">Audit Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                            ) : (
                                MOCK_ALERTS.map((alert, index) => (
                                    <motion.tr
                                        key={alert.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                                                    alert.severity === 'High' ? "bg-brand-red shadow-brand-red/50 animate-pulse" : "bg-brand-orange shadow-brand-orange/50"
                                                )} />
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{alert.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{alert.driver}</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{alert.bus}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-bold text-xs">{alert.timestamp}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{alert.location}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                alert.severity === 'High' ? "text-brand-red bg-brand-red/5" : "text-brand-orange bg-brand-orange/5"
                                            )}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={alert.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-brand-red transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
