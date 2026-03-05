'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import dynamic from 'next/dynamic';
import { StatCard } from './components/StatCard';
import { ChartCard } from './components/ChartCard';
import { DASHBOARD_STATS, DROWSINESS_INCIDENTS, PEAK_HOURS, RECENT_ALERTS } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Download, Filter, Plus, ExternalLink, ShieldAlert } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { StatusBadge } from './components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import Leaflet with no SSR
const MiniLiveMap = dynamic(() => import('./components/MiniLiveMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
});

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useUIStore();

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const chartGridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';
    const chartLabelColor = theme === 'dark' ? '#94a3b8' : '#64748b';

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Realtime drowsiness detection and session monitoring active.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-300">
                        <Filter className="w-4 h-4" />
                        Analysis
                    </Button>
                    <Button className="gap-2 bg-brand-red hover:bg-brand-red/90 text-white shadow-lg shadow-brand-red/20 font-bold px-6">
                        <ShieldAlert className="w-4 h-4" />
                        Emergency Mode
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {DASHBOARD_STATS.map((stat, index) => (
                    <StatCard
                        key={stat.label}
                        {...stat}
                        icon={stat.icon as any}
                        index={index}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard
                    title="Drowsiness Incidents"
                    description="Weekly trend of detected drowsiness events"
                    isLoading={isLoading}
                    delay={0.2}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DROWSINESS_INCIDENTS}>
                            <defs>
                                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ED1E24" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#ED1E24" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 600 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: 'none',
                                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                    color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="incidents"
                                stroke="#ED1E24"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorIncidents)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Peak Drowsy Hours"
                    description="Incidents distribution across 24-hour cycle"
                    isLoading={isLoading}
                    delay={0.3}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={PEAK_HOURS}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: chartLabelColor, fontSize: 12, fontWeight: 600 }}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: 'none',
                                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                    color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                                }}
                            />
                            <Bar
                                dataKey="incidents"
                                fill="#ED1E24"
                                radius={[6, 6, 0, 0]}
                                barSize={45}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Mini View Options / Recent Alerts Placeholder */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-[24px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-black dark:text-white">Recent Security Violations</CardTitle>
                        <Button variant="ghost" size="sm" className="text-brand-red font-bold uppercase tracking-widest text-[10px] gap-2">
                            Full Log <ExternalLink className="w-3 h-3" />
                        </Button>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(RECENT_ALERTS || []).slice(0, 4).map((alert) => (
                                        <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                                                        {alert.driver[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{alert.driver}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{alert.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-400 dark:text-slate-500">{alert.time}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Resolve
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-[24px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-black dark:text-white">Live Proximity Map</CardTitle>
                        <StatusBadge status="Online" />
                    </CardHeader>
                    <CardContent className="h-[320px] p-0 relative">
                        <MiniLiveMap />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
