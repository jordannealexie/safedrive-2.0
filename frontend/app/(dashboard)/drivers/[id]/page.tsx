'use client';

import { useParams, useRouter } from 'next/navigation';
import { MOCK_DRIVERS, DROWSINESS_INCIDENTS } from '@/lib/mock-data';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChevronLeft,
    Bus,
    Calendar,
    MapPin,
    Shield,
    AlertTriangle,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DriverProfilePage() {
    const params = useParams();
    const router = useRouter();
    const driverId = params.id as string;
    const driver = MOCK_DRIVERS.find(d => d.id === driverId) || MOCK_DRIVERS[0];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full border-slate-200"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900">{driver.name}</h1>
                        <StatusBadge status={driver.status} />
                    </div>
                    <p className="text-slate-500 font-medium">Driver ID: {driver.id} • Senior Fleet Member</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info Card */}
                <div className="space-y-8">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="h-32 bg-brand-red/5 border-b flex items-center justify-center">
                            <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white translate-y-12">
                                <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl">
                                    {driver.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8 px-6 space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800">{driver.name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1 text-slate-500 text-sm font-medium">
                                    <MapPin className="w-4 h-4" />
                                    <span>Main Route - Sector 8</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Risk Level</p>
                                    <p className={cn(
                                        "font-extrabold text-lg",
                                        driver.riskLevel === 'High' ? "text-brand-red" : "text-emerald-600"
                                    )}>{driver.riskLevel}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Alerts</p>
                                    <p className="font-extrabold text-lg text-slate-800">14</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Bus className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-medium">Assigned: <b className="text-slate-800">{driver.busId}</b></span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-medium">Joined: Oct 2024</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Shield className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-medium">Safety Score: <b className="text-emerald-600">92/100</b></span>
                                </div>
                            </div>

                            <Button className="w-full bg-slate-900 hover:bg-slate-800 h-11">
                                Download Safety Report
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Next Shift</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border">
                                <Clock className="w-5 h-5 text-brand-orange mt-0.5" />
                                <div>
                                    <p className="font-bold text-slate-800">Monday Morning</p>
                                    <p className="text-sm text-slate-500">06:00 AM - 02:00 PM</p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Route: City Center Loop</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Charts & History */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Drowsiness History</CardTitle>
                                <p className="text-slate-500 text-sm mt-1">7-day activity trend</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="font-bold">Week</Button>
                                <Button variant="ghost" size="sm" className="text-slate-400">Month</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={DROWSINESS_INCIDENTS}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="incidents"
                                            stroke="#ED1E24"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#ED1E24', strokeWidth: 3, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Recent Alerts</CardTitle>
                                <Button variant="outline" size="sm" className="border-slate-200">View All</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-orange-100">
                                                <AlertTriangle className="w-5 h-5 text-brand-orange" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">Drowsiness Level 3</p>
                                                <p className="text-sm text-slate-500">Jan 16, 2026 • 10:45 AM • Route 8A</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-brand-red font-bold">Details</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-xl">Admin Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-slate-50 border-slate-100 text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all resize-none font-medium"
                                placeholder="Add private notes about this driver's performance..."
                                defaultValue="Driver showed significant improvement in the last 48 hours. Continue monitoring during early morning shifts."
                            />
                            <div className="mt-4 flex justify-end">
                                <Button className="bg-slate-900 h-10 px-6">Save Notes</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
