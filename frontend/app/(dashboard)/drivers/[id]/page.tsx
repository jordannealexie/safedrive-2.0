'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { domainApi, type Driver, type DriverSession, type WorkHours, type IncidentPoint, type AlertRecord } from '@/lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Shield,
    AlertTriangle,
    Clock,
    Eye,
    EyeOff,
    Brain,
    UserCheck,
    Fingerprint,
    Activity,
    Volume2
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

    const [driver, setDriver] = useState<Driver | null>(null);
    const [driverSessions, setDriverSessions] = useState<DriverSession[]>([]);
    const [workHours, setWorkHours] = useState<WorkHours | null>(null);
    const [drowsinessIncidents, setDrowsinessIncidents] = useState<IncidentPoint[]>([]);
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState('');
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [chartRange, setChartRange] = useState<'week' | 'month'>('week');

    useEffect(() => {
        Promise.all([
            domainApi.getDriver(driverId),
            domainApi.getDashboard(),
            domainApi.getAlerts(),
            domainApi.getDriverNotes(driverId),
        ])
            .then(([detail, dashboard, allAlerts, notes]) => {
                setDriver(detail.driver);
                setDriverSessions(detail.sessions);
                setWorkHours(detail.workHours);
                setDrowsinessIncidents(dashboard.drowsinessIncidents);
                setAlerts(allAlerts.filter(a => a.driver === driverId || a.driver === detail.driver.name));
                setAdminNotes(notes);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [driverId]);

    const activeSession = driverSessions.find(s => s.status === 'active');

    const monthlyData: IncidentPoint[] = (() => {
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const now = Date.now();
        return weeks.map((label, i) => {
            const weekStart = now - (3 - i) * 7 * 24 * 60 * 60 * 1000;
            const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
            const count = alerts.filter(a => {
                const t = new Date(a.timestamp).getTime();
                return t >= weekStart && t < weekEnd;
            }).length;
            return { day: label, incidents: count };
        });
    })();

    const chartData = chartRange === 'week' ? drowsinessIncidents : monthlyData;

    if (isLoading || !driver) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-400 dark:text-slate-500">Loading driver profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{driver.name}</h1>
                        <StatusBadge status={driver.status} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Driver ID: {driver.id} • Face-Registered Profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info Card */}
                <div className="space-y-8">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="h-32 bg-brand-red/5 dark:bg-brand-red/10 border-b dark:border-slate-800 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-800 translate-y-12">
                                <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 font-bold text-2xl">
                                    {driver.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8 px-6 space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{driver.name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    <MapPin className="w-4 h-4" />
                                    <span>BUS-001</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Risk Level</p>
                                    <p className={cn(
                                        "font-extrabold text-lg",
                                        driver.riskLevel === 'High' ? "text-brand-red" : "text-emerald-600 dark:text-emerald-400"
                                    )}>{driver.riskLevel}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Alerts</p>
                                    <p className="font-extrabold text-lg text-slate-800 dark:text-white">{alerts.length}</p>
                                </div>
                            </div>

                            {/* Face Registration Status */}
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Fingerprint className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Face Registered</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Auto-registered on {driver.faceRegisteredAt}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{driver.totalSessions} total sessions tracked</p>
                            </div>

                            {/* Detection Status */}
                            <div className={`p-4 rounded-2xl border ${driver.detectionStatus === 'drowsy_detected' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : driver.detectionStatus === 'monitoring' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {driver.detectionStatus === 'drowsy_detected' ? <EyeOff className="w-4 h-4 text-brand-red" /> : <Eye className="w-4 h-4 text-blue-500" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detection Status</span>
                                </div>
                                <p className={`text-sm font-black ${driver.detectionStatus === 'drowsy_detected' ? 'text-brand-red' : driver.detectionStatus === 'monitoring' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {driver.detectionStatus === 'drowsy_detected' ? 'Drowsiness Detected' : driver.detectionStatus === 'monitoring' ? 'Active Monitoring' : 'Idle'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Brain className="w-3 h-3 text-slate-400" />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${driver.baselineStatus === 'learned' ? 'text-emerald-500' : driver.baselineStatus === 'deviation' ? 'text-brand-red' : 'text-brand-orange'}`}>
                                        Baseline: {driver.baselineStatus === 'learned' ? 'Learned' : driver.baselineStatus === 'deviation' ? 'Deviation' : 'Learning'} ({driver.baselineConfidence}%)
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-medium">Registered: {driver.faceRegisteredAt}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                    <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-medium">Sessions: <b className="text-emerald-600 dark:text-emerald-400">{driver.totalSessions}</b></span>
                                </div>
                            </div>

                            <Button onClick={() => {
                                const now = new Date();
                                const lines = [
                                    `SafeDrive Safety Report — ${driver.name}`,
                                    `Generated: ${now.toLocaleString()}`,
                                    '',
                                    'DRIVER SUMMARY',
                                    `ID: ${driver.id}`,
                                    `Name: ${driver.name}`,
                                    `Status: ${driver.status}`,
                                    `Risk Level: ${driver.riskLevel}`,
                                    `Detection: ${driver.detectionStatus}`,
                                    `Baseline: ${driver.baselineStatus} (${driver.baselineConfidence}%)`,
                                    `Total Sessions: ${driver.totalSessions}`,
                                    `Today Work Hours: ${driver.todayWorkHours}h`,
                                    `Registered: ${driver.faceRegisteredAt}`,
                                    '',
                                    'SESSIONS',
                                    'ID,Bus,Status,Duration,Alerts,Drowsiness Events,Start',
                                    ...driverSessions.map(s =>
                                        `${s.id},${s.busId},${s.status},${s.duration},${s.alertCount},${s.drowsinessEvents},${s.startTime}`
                                    ),
                                    '',
                                    'ALERTS',
                                    'ID,Type,Severity,Status,Timestamp',
                                    ...alerts.map(a =>
                                        `${a.id},${a.type},${a.severity},${a.status},${a.timestamp}`
                                    ),
                                ];
                                const csv = lines.join('\n');
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const el = document.createElement('a');
                                el.href = url;
                                el.download = `SafeDrive_${driver.id}_Report_${now.toISOString().split('T')[0]}.csv`;
                                el.click();
                                URL.revokeObjectURL(url);
                            }} className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-11 font-bold shadow-lg shadow-brand-red/20">
                                Download Safety Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Charts & History */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl dark:text-white">Drowsiness History</CardTitle>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{chartRange === 'week' ? '7-day activity trend' : '4-week activity trend'}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setChartRange('week')} className={cn("font-bold", chartRange === 'week' ? "dark:text-white" : "text-slate-400 dark:text-slate-500")}>Week</Button>
                                <Button variant="ghost" size="sm" onClick={() => setChartRange('month')} className={cn("font-bold", chartRange === 'month' ? "dark:text-white" : "text-slate-400 dark:text-slate-500")}>Month</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
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

                    {/* Session History */}
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl dark:text-white">Session History</CardTitle>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{driverSessions.length} Sessions</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y dark:divide-slate-800">
                                {driverSessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${session.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Activity className={`w-5 h-5 ${session.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{session.id}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{session.startTime} — {session.endTime || 'Ongoing'}</p>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{session.duration}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{session.busId}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${session.baselineStatus === 'learned' ? 'text-emerald-500' : session.baselineStatus === 'deviation' ? 'text-brand-red' : 'text-brand-orange'}`}>
                                                        Baseline: {session.baselineStatus} ({session.baselineConfidence}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <StatusBadge status={session.status === 'active' ? 'Online' : 'Resolved'} />
                                            <div className="flex items-center gap-3 mt-2 justify-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{session.alertCount} alerts</span>
                                                <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">{session.drowsinessEvents} drowsy</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-xl dark:text-white">Admin Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-500/20 transition-all resize-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="Add private notes about this driver's performance..."
                                value={adminNotes}
                                onChange={(e) => { setAdminNotes(e.target.value); setNotesSaved(false); }}
                            />
                            <div className="mt-4 flex items-center justify-end gap-3">
                                {notesSaved && (
                                    <span className="text-xs font-bold text-emerald-500">Saved</span>
                                )}
                                <Button
                                    disabled={notesSaving}
                                    onClick={async () => {
                                        setNotesSaving(true);
                                        try {
                                            await domainApi.saveDriverNotes(driverId, adminNotes);
                                            setNotesSaved(true);
                                        } catch (err) {
                                            console.error('Failed to save notes:', err);
                                        } finally {
                                            setNotesSaving(false);
                                        }
                                    }}
                                    className="bg-brand-red hover:bg-brand-red/90 text-white h-10 px-6 font-bold shadow-lg shadow-brand-red/20"
                                >
                                    {notesSaving ? 'Saving...' : 'Save Notes'}
                                </Button>
                            </div>

                            {adminNotes && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-bold">
                                                View Saved Notes
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold dark:text-white">Admin Notes — {driver.name}</DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 min-h-[120px]">
                                                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap">{adminNotes}</p>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Driver ID: {driver.id}</p>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
