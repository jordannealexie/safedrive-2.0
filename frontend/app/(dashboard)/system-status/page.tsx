'use client';

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
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEVICES = [
    { id: 'CAM-01-UNIT-A', type: 'Camera Module', status: 'Online', firmware: 'v2.1.0', lastSeen: 'Just now', detail: 'Facial landmark detection active' },
    { id: 'NEO6M-01-UNIT-A', type: 'NEO-6M GPS', status: 'Online', firmware: 'v1.4.5', lastSeen: 'Just now', detail: 'Location tracking operational' },
    { id: 'MPU6050-01-UNIT-A', type: 'MPU-6050 Accelerometer', status: 'Online', firmware: 'v1.2.0', lastSeen: '1m ago', detail: 'Motion detection active' },
    { id: 'OLED-01-UNIT-A', type: 'OLED Display', status: 'Online', firmware: 'v1.0.3', lastSeen: '1m ago', detail: 'Visual alarm ready' },
    { id: 'BZR-01-UNIT-A', type: 'Buzzer Module', status: 'Online', firmware: 'v1.0.0', lastSeen: '1m ago', detail: 'Audio alarm standby' },
    { id: 'NEO6M-02-UNIT-B', type: 'NEO-6M GPS', status: 'Offline', firmware: 'v1.4.2', lastSeen: '4h ago', detail: 'No signal' },
];

export default function SystemStatusPage() {
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
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]">98% Operational</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {DEVICES.map((device, index) => (
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
                                { label: 'Detection Engine', status: 'Operational', latency: '45ms' },
                                { label: 'Baseline Learning', status: 'Operational', latency: '82ms' },
                                { label: 'Session Manager', status: 'Operational', latency: '15ms' },
                                { label: 'Face Recognition', status: 'Operational', latency: '124ms' },
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
                            {[
                                { label: 'CPU Usage', value: 24, color: 'bg-emerald-500' },
                                { label: 'Memory', value: 68, color: 'bg-brand-orange' },
                                { label: 'Disk IO', value: 12, color: 'bg-blue-500' },
                            ].map((res) => (
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
        </div>
    );
}
