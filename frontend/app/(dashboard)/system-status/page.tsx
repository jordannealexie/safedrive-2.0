'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Wifi,
    WifiOff,
    Cpu,
    Database,
    Server,
    ShieldCheck,
    Clock,
    Zap,
    Activity,
    Smartphone,
    MapPin,
    Monitor,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sensorApi, type SystemStatus } from '@/lib/api';
import { useLiveSensor } from '@/hooks/useLiveSensor';

export default function SystemStatusPage() {
    const { data: sensorData, connected } = useLiveSensor();
    const [health, setHealth] = useState<{ status: string; mock_mode: boolean } | null>(null);

    useEffect(() => {
        sensorApi.getHealth().then(setHealth).catch(console.error);
    }, []);

    const devices = [
        { id: 'CAM-01-UNIT-A', type: 'Camera Module', status: connected ? 'Online' : 'Offline', firmware: 'v2.1.0', lastSeen: connected ? 'Just now' : 'Disconnected', detail: 'Facial landmark detection active' },
        { id: 'NEO6M-01-UNIT-A', type: 'NEO-6M GPS', status: connected ? 'Online' : 'Offline', firmware: 'v1.4.5', lastSeen: connected ? 'Just now' : 'Disconnected', detail: sensorData?.gps ? (sensorData.gps.fix ? `Lat ${sensorData.gps.latitude?.toFixed(4) ?? 'N/A'}, Lon ${sensorData.gps.longitude?.toFixed(4) ?? 'N/A'}, ${sensorData.gps.speed_kmh?.toFixed(0) ?? 0} km/h` : 'Searching for satellites…') : 'Awaiting data' },
        { id: 'MPU6050-01-UNIT-A', type: 'MPU-6050 Accelerometer', status: connected ? 'Online' : 'Offline', firmware: 'v1.2.0', lastSeen: connected ? 'Just now' : 'Disconnected', detail: sensorData?.accelerometer ? `Mag: ${sensorData.accelerometer.magnitude.toFixed(3)}g, ${sensorData.is_moving ? 'Moving' : 'Stationary'}` : 'Awaiting data' },
        { id: 'OLED-01-UNIT-A', type: 'OLED Display', status: connected ? 'Online' : 'Offline', firmware: 'v1.0.3', lastSeen: connected ? 'Just now' : 'Disconnected', detail: sensorData?.oled?.raw ? `EAR: ${(sensorData.oled.raw.ear_value as number ?? 0).toFixed(3)} | ${sensorData.oled.raw.drowsiness_state}` : 'Awaiting data' },
        { id: 'BZR-01-UNIT-A', type: 'Buzzer Module', status: connected ? 'Online' : 'Offline', firmware: 'v1.0.0', lastSeen: connected ? 'Just now' : 'Disconnected', detail: sensorData?.buzzer?.active ? 'BUZZER ACTIVE' : 'Audio alarm standby' },
    ];

    const onlineCount = devices.filter(d => d.status === 'Online').length;
    const pctOperational = Math.round((onlineCount / devices.length) * 100);
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Status</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor the health of hardware devices and backend services.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black dark:text-white">Device Health</CardTitle>
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]">{pctOperational}% Operational</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {devices.map((device, index) => (
                                    <div key={device.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "p-3 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm",
                                                device.status === 'Online'
                                                    ? "text-emerald-500 border-emerald-100 dark:border-emerald-500/20"
                                                    : "text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800"
                                            )}>
                                            {device.type.includes('GPS') ? <Wifi className="w-6 h-6" /> : 
                                             device.type.includes('Camera') ? <Smartphone className="w-6 h-6" /> :
                                             device.type.includes('Accelerometer') ? <Activity className="w-6 h-6" /> :
                                             device.type.includes('OLED') ? <Cpu className="w-6 h-6" /> :
                                             <Zap className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{device.id}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{device.type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{device.detail}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end mb-1">
                                                {device.status === 'Online' ? (
                                                    <Badge className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20 font-bold h-6 border-none">Online</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 font-bold h-6">Offline</Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest leading-none">Last Seen: {device.lastSeen}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-sm bg-slate-900 dark:bg-black text-white ring-1 ring-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 font-black">
                                <Server className="w-5 h-5 text-brand-red" />
                                Core Infrastructure
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { label: 'Detection Engine', status: connected ? 'Operational' : 'Offline', latency: sensorData?.oled?.raw ? `${(sensorData.oled.raw.fps as number ?? 0).toFixed(0)} FPS` : '—' },
                                { label: 'FastAPI Backend', status: connected ? 'Operational' : 'Offline', latency: connected ? 'Connected' : '—' },
                                { label: 'WebSocket Stream', status: connected ? 'Operational' : 'Offline', latency: connected ? 'Live' : '—' },
                                { label: 'safedrive_ai Service', status: sensorData?.oled?.raw ? 'Operational' : 'Offline', latency: sensorData?.oled?.raw ? 'Running' : '—' },
                            ].map((service) => (
                                <div key={service.label} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-sm tracking-tight">{service.label}</p>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{service.latency}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{service.status}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative ring-1 ring-slate-200 dark:ring-slate-800">
                        <div className="absolute right-[-10px] top-[-10px] opacity-5">
                            <Zap className="w-24 h-24 text-brand-orange" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg font-black dark:text-white">Resource Usage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(() => {
                                const fps = typeof sensorData?.oled?.raw?.fps === 'number' ? sensorData.oled.raw.fps : 0;
                                const accelActive = sensorData?.accelerometer ? 100 : 0;
                                const gpsActive = sensorData?.gps ? 100 : 0;
                                return [
                                    { label: 'Detection FPS', value: Math.min(100, Math.round((fps / 30) * 100)), color: fps > 15 ? 'bg-emerald-500' : 'bg-brand-orange' },
                                    { label: 'Accelerometer', value: accelActive, color: 'bg-blue-500' },
                                    { label: 'GPS Module', value: gpsActive, color: sensorData?.gps?.fix ? 'bg-emerald-500' : 'bg-brand-orange' },
                                ];
                            })().map((res) => (
                                <div key={res.label} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-400 dark:text-slate-500">{res.label}</span>
                                        <span className="text-slate-800 dark:text-slate-300">{res.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full", res.color)} style={{ width: `${res.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* OLED Display */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/20 border-b dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black dark:text-white flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-brand-orange" />
                            OLED Display — Live Preview
                        </CardTitle>
                        <Badge variant="outline" className={cn(
                            "font-bold uppercase tracking-widest text-[10px]",
                            connected ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : "text-slate-400 border-slate-200 dark:border-slate-700"
                        )}>
                            {connected ? 'Live' : 'Offline'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-10 flex justify-center">
                    {(() => {
                        const raw = sensorData?.oled?.raw as Record<string, unknown> | undefined;
                        const state = raw?.drowsiness_state as string ?? 'ALERT';
                        const ear = typeof raw?.ear_value === 'number' ? raw.ear_value : 0;
                        const drv = (raw?.driver_id as string ?? 'UNKNOWN').slice(0, 12);
                        const fps = typeof raw?.fps === 'number' ? raw.fps : 0;
                        const gpsValid = raw?.gps_valid as boolean ?? false;
                        const speedKmh = typeof raw?.speed_kmh === 'number' ? raw.speed_kmh : 0;
                        const isMoving = raw?.is_moving as boolean ?? false;
                        const alertMsg = raw?.alert_message as string ?? '';
                        const alertPri = typeof raw?.alert_priority === 'number' ? raw.alert_priority : 0;
                        const hasAlert = !!alertMsg && alertPri > 0;

                        return (
                            <div className="w-[min(94vw,690px)] h-[min(47vw,345px)] flex items-center justify-center">
                                <div className="origin-center scale-[1] sm:scale-[1.2] lg:scale-[1.5]">
                                    <div className="bg-black rounded-xl p-2.5 shadow-2xl shadow-black/40 border-2 border-slate-700">
                                    <div className="bg-black rounded-lg w-[460px] h-[230px] font-mono relative overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                                    {hasAlert ? (
                                        /* Full-screen alert overlay */
                                        <div className={cn(
                                            "w-full h-full flex items-center justify-center border-2 rounded",
                                            alertPri >= 2 ? "bg-cyan-400 text-black" : "bg-black text-cyan-400 border-cyan-400"
                                        )}>
                                            <span className="text-2xl font-bold tracking-wider">{alertMsg}</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Row 0: Header bar */}
                                            <div className="bg-cyan-400 text-black px-3 py-1 flex items-center justify-between text-sm">
                                                <span className="font-bold tracking-wide">SafeDrive</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">{fps.toFixed(0)}fps</span>
                                                    <span className={cn(
                                                        "w-2.5 h-2.5 rounded-full border border-black",
                                                        gpsValid ? "bg-black" : "bg-transparent"
                                                    )} title={gpsValid ? "GPS Fix" : "No GPS Fix"} />
                                                </div>
                                            </div>

                                            {/* Row 1: Drowsiness state */}
                                            <div className={cn(
                                                "mx-0 mt-1 text-center py-1",
                                                state === 'DROWSY' ? "bg-cyan-400 text-black" :
                                                state === 'CRITICAL' ? "border border-cyan-400 text-cyan-400" :
                                                "text-cyan-400"
                                            )}>
                                                <span className="text-2xl font-bold tracking-widest">
                                                    {state === 'DROWSY' ? '!! DROWSY !!' :
                                                     state === 'CRITICAL' ? '! CRITICAL !' : 'ALERT'}
                                                </span>
                                            </div>

                                            {/* Row 2: EAR */}
                                            <div className="px-3 mt-1.5">
                                                <span className="text-cyan-400 text-base">EAR:{ear.toFixed(3)}</span>
                                            </div>

                                            {/* Row 3: Driver ID */}
                                            <div className="px-3 mt-1">
                                                <span className="text-cyan-400 text-sm">DRV:{drv}</span>
                                            </div>

                                            {/* Row 4: Speed + Motion */}
                                            <div className="px-3 mt-1 flex justify-between">
                                                <span className="text-cyan-400 text-sm">{gpsValid ? `${speedKmh.toFixed(0)}km/h` : '--km/h'}</span>
                                                <span className="text-cyan-400 text-sm">{isMoving ? 'Mov' : 'Stp'}</span>
                                            </div>
                                        </>
                                    )}
                                    </div>
                                </div>
                                </div>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>

        </div>
    );
}
