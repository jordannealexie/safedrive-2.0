'use client';

import { useState, useEffect } from 'react';
import { BUSES } from '@/lib/mock-data';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bus as BusIcon,
    MapPin,
    Battery,
    Navigation,
    Activity,
    Settings2,
    Search,
    Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BusesPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const SkeletonCard = () => (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-2 bg-slate-100 dark:bg-slate-800" />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Prototype Unit</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Operational status and telemetry for the connected prototype.</p>
                </div>
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white h-11 px-6 font-bold shadow-lg shadow-brand-red/20 gap-2">
                    <Plus className="w-4 h-4" /> Add Vehicle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    BUSES.map((bus, index) => (
                        <motion.div
                            key={bus.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group rounded-[24px]">
                                <div className="h-2 bg-slate-200 dark:bg-slate-800 group-hover:bg-brand-red transition-colors" />
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:border-brand-red/20 transition-colors">
                                            <BusIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{bus.id}</p>
                                            <StatusBadge status={bus.status} className="mt-1" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Activity className="w-4 h-4 ml-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Operator</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{bus.driver}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Battery className="w-4 h-4 ml-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Capacity</span>
                                            </div>
                                            <span className={cn(
                                                "text-sm font-bold",
                                                parseInt(bus.battery) < 20 ? "text-brand-red" : "text-emerald-600 dark:text-emerald-400"
                                            )}>{bus.battery}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                                <Navigation className="w-4 h-4 ml-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Velocity</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{bus.speed}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-8">
                                        <Button variant="outline" size="sm" className="h-10 font-bold border-slate-200 dark:border-slate-800 dark:text-slate-300">
                                            Telemetry
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 font-bold border-slate-200 dark:border-slate-800 dark:text-slate-300">
                                            <Settings2 className="w-3.5 h-3.5 mr-2" /> Node
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
