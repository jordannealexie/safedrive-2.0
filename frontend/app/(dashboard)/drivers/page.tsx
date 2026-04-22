'use client';

import { useState, useEffect } from 'react';
import { domainApi, type Driver, type DriverSession } from '@/lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreVertical, Eye, Edit2, Trash2, Filter, UserPlus, Download, Fingerprint, Clock, Brain } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, getDateRangeLabel, isWithinDateRange } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

export default function DriversPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [sessions, setSessions] = useState<DriverSession[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const { dateFilterStart, dateFilterEnd } = useUIStore();

    useEffect(() => {
        Promise.all([
            domainApi.getDrivers().then(setDrivers),
            domainApi.getSessions().then(setSessions).catch(() => setSessions([])),
        ])
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const durationToHours = (duration: string | null | undefined) => {
        if (!duration) return 0;
        const hourMatch = duration.match(/(\d+)h/i);
        const minMatch = duration.match(/(\d+)m/i);
        const h = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        const m = minMatch ? parseInt(minMatch[1], 10) : 0;
        return h + m / 60;
    };

    const rangeSessionsByDriver = new Map<string, DriverSession[]>();
    sessions
        .filter((s) => isWithinDateRange(s.startTime, dateFilterStart, dateFilterEnd))
        .forEach((s) => {
            const key = s.driverId || s.driver;
            const list = rangeSessionsByDriver.get(key) ?? [];
            list.push(s);
            rangeSessionsByDriver.set(key, list);
        });

    const scopedDrivers = drivers.map((d) => {
        const scopedSessions = rangeSessionsByDriver.get(d.id) ?? [];
        const rangeHours = scopedSessions.reduce((acc, s) => acc + durationToHours(s.duration), 0);
        return {
            ...d,
            todayWorkHours: Number(rangeHours.toFixed(2)),
            todaySessions: scopedSessions.length,
        };
    });

    const filteredDrivers = scopedDrivers.filter(d => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!d.name.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q)) return false;
        }
        if (riskFilter && d.riskLevel !== riskFilter) return false;
        return true;
    });

    const exportDrivers = () => {
        const lines = [
            'ID,Name,Status,Risk,Detection,WorkHours,Sessions,Baseline',
            ...filteredDrivers.map(d =>
                `${d.id},${d.name},${d.status},${d.riskLevel},${d.detectionStatus},${d.todayWorkHours}h,${d.totalSessions},${d.baselineConfidence}%`
            ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const el = document.createElement('a');
        el.href = url;
        el.download = `SafeDrive_Drivers_${new Date().toISOString().split('T')[0]}.csv`;
        el.click();
        URL.revokeObjectURL(url);
    };

    const SkeletonRow = () => (
        <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
            <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
            <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
        </tr>
    );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Driver Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Registry of authenticated personnel and real-time risk assessment.</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">Range: {getDateRangeLabel(dateFilterStart, dateFilterEnd)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by driver number or ID..." className="pl-10 h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("gap-2 h-10 border-slate-200 dark:border-slate-800 dark:text-slate-300", showFilters && "ring-2 ring-brand-red")}>
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportDrivers} className="gap-2 h-10 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                    </div>
                </div>
                {showFilters && (
                    <div className="px-4 pb-4 flex gap-2 flex-wrap">
                        {[null, 'High', 'Medium', 'Low'].map(r => (
                            <button key={r ?? 'all'} onClick={() => setRiskFilter(r)} className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                riskFilter === r ? "bg-brand-red text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            )}>
                                {r ?? 'All'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Operator</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Internal ID</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Live Status</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Detection</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Work Hours</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Sessions</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Risk Matrix</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                            ) : (
                                filteredDrivers.map((driver, index) => (
                                    <motion.tr
                                        key={driver.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-700">
                                                    {driver.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{driver.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-bold text-xs">{driver.id}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={driver.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {driver.detectionStatus === 'drowsy_detected' ? (
                                                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                                                        Drowsy
                                                    </span>
                                                ) : driver.detectionStatus === 'monitoring' ? (
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Monitoring
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Brain className="w-3 h-3 text-slate-300" />
                                                <span className={`text-[9px] font-bold ${driver.baselineStatus === 'learned' ? 'text-emerald-400' : driver.baselineStatus === 'deviation' ? 'text-brand-red' : 'text-brand-orange'}`}>
                                                    {driver.baselineConfidence}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-sm font-bold",
                                                driver.todayWorkHours >= 8 ? "text-brand-red" : driver.todayWorkHours >= 4 ? "text-brand-orange" : "text-slate-700 dark:text-slate-200"
                                            )}>{driver.todayWorkHours}h</span>
                                            <div className="h-1 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                                <div className={`h-full rounded-full ${driver.todayWorkHours >= 8 ? 'bg-brand-red' : driver.todayWorkHours >= 4 ? 'bg-brand-orange' : 'bg-emerald-500'}`} style={{ width: `${Math.min((driver.todayWorkHours / 8) * 100, 100)}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{driver.todaySessions}</span>
                                            <span className="text-[10px] text-slate-400 ml-1">in range</span>
                                            <p className="text-[10px] text-slate-400 font-medium">{driver.totalSessions} total</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                driver.riskLevel === 'High' ? "text-brand-red" :
                                                    driver.riskLevel === 'Medium' ? "text-brand-orange" :
                                                        "text-emerald-500"
                                            )}>
                                                {driver.riskLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                    <DropdownMenuItem asChild className="dark:text-slate-300 dark:hover:bg-slate-800">
                                                        <Link href={`/drivers/${driver.id}`} className="flex items-center">
                                                            <Eye className="mr-2 h-4 w-4" /> Profile
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 dark:hover:bg-red-900/20" onClick={async () => {
                                                        await domainApi.deleteDriver(driver.id);
                                                        setDrivers(prev => prev.filter(d => d.id !== driver.id));
                                                    }}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredDrivers.length} registered drivers</p>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" disabled className="text-slate-400 text-xs font-black uppercase">Prev</Button>
                        <Button variant="ghost" size="sm" className="text-brand-red font-black">1</Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 font-black">2</Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 font-black">Next</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
