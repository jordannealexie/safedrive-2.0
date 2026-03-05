'use client';

import { useState, useEffect } from 'react';
import { MOCK_DRIVERS } from '@/lib/mock-data';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MoreVertical, Eye, Edit2, Trash2, Filter, UserPlus, Download } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DriversPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const SkeletonRow = () => (
        <tr className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </td>
            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
            <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
            <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
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
                </div>
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white font-bold h-11 px-6 shadow-lg shadow-brand-red/20 gap-2">
                    <UserPlus className="w-4 h-4" /> Register Driver
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search by name, ID or bus..." className="pl-10 h-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                            <Download className="w-4 h-4" /> Export
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Operator</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Internal ID</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Node/Bus</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Live Status</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Last Telemetry</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Risk Matrix</th>
                                <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                            ) : (
                                MOCK_DRIVERS.map((driver, index) => (
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
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {driver.busId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={driver.status} />
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold">{driver.lastAlert}</td>
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
                                                    <DropdownMenuItem className="dark:text-slate-300 dark:hover:bg-slate-800">
                                                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 dark:hover:bg-red-900/20">
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
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing 3 of 38 units</p>
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
