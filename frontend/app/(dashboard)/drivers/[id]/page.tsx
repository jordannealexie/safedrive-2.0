'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { domainApi, snapshotApi, type Driver, type DriverSession, type WorkHours, type AlertRecord, type PrototypeSnapshot } from '@/lib/api';
import { supabase } from '@/lib/supabase';
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
    Volume2,
    Wifi,
    WifiOff,
    Radio
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
import { buildIncidentSeries, cn, formatTimestamp, getDateRangeLabel, isWithinDateRange } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

export default function DriverProfilePage() {
    const params = useParams();
    const router = useRouter();
    const driverId = params.id as string;

    const [driver, setDriver] = useState<Driver | null>(null);
    const [driverSessions, setDriverSessions] = useState<DriverSession[]>([]);
    const [workHours, setWorkHours] = useState<WorkHours | null>(null);
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState('');
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const { dateFilterStart, dateFilterEnd } = useUIStore();
    const [snapshots, setSnapshots] = useState<PrototypeSnapshot[]>([]);
    const [snapshotsLoading, setSnapshotsLoading] = useState(true);
    const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
    const [snapshotsModalOpen, setSnapshotsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [detail, allAlerts, notes, snapshotRows] = await Promise.all([
                    domainApi.getDriver(driverId),
                    domainApi.getAlerts().catch(() => []),
                    domainApi.getDriverNotes(driverId).catch(() => ''),
                    snapshotApi.getByDriver(driverId, 50).catch(() => [] as PrototypeSnapshot[]),
                ]);
                setDriver(detail.driver);
                setDriverSessions(detail.sessions);
                setWorkHours(detail.workHours);
                setAlerts(allAlerts.filter((a: any) => a.driver === driverId || a.driver === detail.driver.name));
                setAdminNotes(notes);
                setSnapshots(snapshotRows);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
                setSnapshotsLoading(false);
            }
        };
        load();
    }, [driverId]);

    // Supabase Realtime subscription for live snapshot updates
    useEffect(() => {
        const channel = supabase
            .channel(`snapshots-${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'prototype_snapshots',
                    filter: `driver_id=eq.${driverId}`,
                },
                (payload) => {
                    const newSnapshot = payload.new as PrototypeSnapshot;
                    setSnapshots((prev) => {
                        // Prevent duplicates
                        if (prev.some((s) => s.id === newSnapshot.id)) return prev;
                        return [newSnapshot, ...prev].slice(0, 50);
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
                else if (status === 'CHANNEL_ERROR') setRealtimeStatus('offline');
                else if (status === 'TIMED_OUT') setRealtimeStatus('reconnecting');
                else setRealtimeStatus('reconnecting');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driverId]);

    const scopedAlerts = alerts.filter((a) => isWithinDateRange(a.timestamp, dateFilterStart, dateFilterEnd));
    const scopedSessions = driverSessions.filter((s) => isWithinDateRange(s.startTime, dateFilterStart, dateFilterEnd));

    const activeSession = scopedSessions.find(s => s.status === 'active');

    const chartData = useMemo(
        () => buildIncidentSeries(scopedAlerts.map((a) => a.timestamp), dateFilterStart, dateFilterEnd).map((p) => ({ day: p.label, incidents: p.incidents })),
        [scopedAlerts, dateFilterStart, dateFilterEnd]
    );

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
                                    <p className="font-extrabold text-lg text-slate-800 dark:text-white">{scopedAlerts.length}</p>
                                </div>
                            </div>

                            {/* Face Registration Status */}
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Fingerprint className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Face Registered</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Auto-registered on {formatTimestamp(driver.faceRegisteredAt)}</p>
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
                                    <span className="text-sm font-medium">Registered: {formatTimestamp(driver.faceRegisteredAt)}</span>
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
                                    `Range Work Hours: ${driver.todayWorkHours}h`,
                                    `Registered: ${driver.faceRegisteredAt}`,
                                    '',
                                    'SESSIONS',
                                    'ID,Bus,Status,Duration,Alerts,Drowsiness Events,Start',
                                    ...scopedSessions.map(s =>
                                        `${s.id},${s.busId},${s.status},${s.duration},${s.alertCount},${s.drowsinessEvents},${s.startTime}`
                                    ),
                                    '',
                                    'ALERTS',
                                    'ID,Type,Severity,Status,Timestamp',
                                    ...scopedAlerts.map(a =>
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
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Adaptive timeline based on selected date range</p>
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
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{scopedSessions.length} Sessions</span>
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Range: {getDateRangeLabel(dateFilterStart, dateFilterEnd)}</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y dark:divide-slate-800">
                                {scopedSessions.map((session) => (
                                    <div key={session.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${session.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Activity className={`w-5 h-5 ${session.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{session.id}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{formatTimestamp(session.startTime)} — {session.endTime ? formatTimestamp(session.endTime) : 'Ongoing'}</p>
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

                    {/* Prototype Snapshots — Compact Summary + Modal */}
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                        <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">Prototype Snapshots</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                                                realtimeStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400'
                                                : realtimeStatus === 'reconnecting' ? 'text-amber-500' : 'text-slate-400'
                                            }`}>
                                                {realtimeStatus === 'connected' ? <Wifi className="w-3 h-3" /> : realtimeStatus === 'reconnecting' ? <Radio className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                                                {realtimeStatus}
                                            </span>
                                            <span className="text-[10px] text-slate-400">•</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{snapshots.length} frames</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Latest snapshot mini stats */}
                                {snapshots[0] && (
                                    <div className="hidden md:flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest</p>
                                            <p className={`text-sm font-extrabold ${
                                                snapshots[0].drowsiness_state === 'CRITICAL' ? 'text-brand-red' :
                                                snapshots[0].drowsiness_state === 'DROWSY' ? 'text-amber-500' :
                                                'text-emerald-600 dark:text-emerald-400'
                                            }`}>{snapshots[0].drowsiness_state ?? '—'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EAR</p>
                                            <p className="text-sm font-extrabold text-slate-800 dark:text-white">{snapshots[0].ear_value?.toFixed(3) ?? '—'}</p>
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSnapshotsModalOpen(true)}
                                    disabled={snapshotsLoading || snapshots.length === 0}
                                    className="ml-4 text-xs font-bold"
                                >
                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                    View All
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Snapshots Modal */}
                    <Dialog open={snapshotsModalOpen} onOpenChange={setSnapshotsModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden bg-white dark:bg-slate-900">
                            <DialogHeader className="p-6 pb-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <DialogTitle className="text-xl dark:text-white">Prototype Snapshots</DialogTitle>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            realtimeStatus === 'connected'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                : realtimeStatus === 'reconnecting'
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                            {realtimeStatus === 'connected' ? <Wifi className="w-3 h-3" /> : realtimeStatus === 'reconnecting' ? <Radio className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                                            {realtimeStatus}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{snapshots.length} Frames</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live detection snapshots from the Pi prototype. Updates in realtime.</p>
                            </DialogHeader>
                            <div className="p-6 pt-4 overflow-y-auto max-h-[calc(85vh-100px)]">
                                {/* Latest snapshot — hero card */}
                                {snapshots[0] && (
                                    <div className={`rounded-2xl border overflow-hidden mb-4 ${
                                        snapshots[0].source === 'live'
                                            ? 'border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20'
                                            : 'border-slate-100 dark:border-slate-800'
                                    } bg-slate-50 dark:bg-slate-800/30`}>
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        {snapshots[0].source === 'live' && (
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        )}
                                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                                            snapshots[0].source === 'live' ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`} />
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                        snapshots[0].source === 'live' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                                    }`}>{snapshots[0].source === 'live' ? 'Live' : 'Historical'} Snapshot</span>
                                                </div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatTimestamp(snapshots[0].captured_at)}</span>
                                            </div>
                                            {/* Image */}
                                            {snapshots[0].image_url && (
                                                <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedImage(snapshots[0].image_url)}>
                                                    <img src={snapshots[0].image_url} alt="Detection frame" className="w-full h-48 object-cover hover:scale-105 transition-transform" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EAR Value</p>
                                                    <p className="text-lg font-extrabold text-slate-800 dark:text-white">{snapshots[0].ear_value?.toFixed(3) ?? '—'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State</p>
                                                    <p className={`text-lg font-extrabold ${
                                                        snapshots[0].drowsiness_state === 'CRITICAL' ? 'text-brand-red' :
                                                        snapshots[0].drowsiness_state === 'DROWSY' ? 'text-amber-500' :
                                                        'text-emerald-600 dark:text-emerald-400'
                                                    }`}>{snapshots[0].drowsiness_state ?? '—'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed</p>
                                                    <p className="text-lg font-extrabold text-slate-800 dark:text-white">{snapshots[0].speed_kmh != null ? `${snapshots[0].speed_kmh.toFixed(0)} km/h` : '—'}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FPS</p>
                                                    <p className="text-lg font-extrabold text-slate-800 dark:text-white">{snapshots[0].fps?.toFixed(0) ?? '—'}</p>
                                                </div>
                                            </div>
                                            {snapshots[0].session_id && (
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session: {snapshots[0].session_id}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Snapshot history grid */}
                                {snapshots.length > 1 && (
                                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                        <div className="divide-y dark:divide-slate-800">
                                            {snapshots.slice(1).map((shot) => (
                                                <div key={shot.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    {/* Image thumbnail */}
                                                    {shot.image_url ? (
                                                        <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-700" onClick={() => setSelectedImage(shot.image_url)}>
                                                            <img src={shot.image_url} alt="Frame" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex-shrink-0 w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                                            <EyeOff className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="relative flex h-2 w-2 flex-shrink-0">
                                                            {shot.source === 'live' && (
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                            )}
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                                                shot.source === 'live' ? 'bg-emerald-500' : 'bg-slate-400'
                                                            }`} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {shot.drowsiness_state ?? '—'} • EAR {shot.ear_value?.toFixed(3) ?? '—'}
                                                                {shot.speed_kmh != null ? ` • ${shot.speed_kmh.toFixed(0)} km/h` : ''}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 truncate">{formatTimestamp(shot.captured_at)}{shot.session_id ? ` • ${shot.session_id}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest ${
                                                        shot.source === 'live' ? 'text-emerald-500' : 'text-slate-400'
                                                    }`}>{shot.source}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Image Lightbox */}
                    {selectedImage && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                            onClick={() => setSelectedImage(null)}
                        >
                            <img
                                src={selectedImage}
                                alt="Snapshot full view"
                                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

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
