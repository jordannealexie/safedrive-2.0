'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/app/(dashboard)/components/StatusBadge';
import { Bus, Navigation, Activity, Zap, Search, Eye, EyeOff, ShieldAlert, Brain, Clock, Volume2, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveSensor } from '@/hooks/useLiveSensor';
import { domainApi, getRuntimeConfigDiagnostics, type BusRecord } from '@/lib/api';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false }) as any;

interface LiveLocation {
    id: string;
    lat: number;
    lng: number;
    driver: string;
    status: string;
    speed: string;
    lastAlert: string;
    session: string;
    detectionStatus: string;
    baselineStatus: string;
    baselineConfidence: number;
    baselineDeviation: number;
    sessionDuration: string;
    todayWorkHours: number;
    vehicleMoving: boolean;
}

export default function LiveMonitoringPage() {
    const [selectedBus, setSelectedBus] = useState<LiveLocation | null>(null);
    const [isClient, setIsClient] = useState(false);
    const { data: sensorData, connected } = useLiveSensor();
    const [buses, setBuses] = useState<BusRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        import('leaflet').then(L => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        });
        domainApi.getBuses()
            .then((rows) => {
                setBuses(rows);
                setLoadError(null);
            })
            .catch((error) => {
                console.error(error);
                const msg = error instanceof Error ? error.message : 'Unknown error';
                setLoadError(`Unable to load live buses from API: ${msg}`);
            });
    }, []);

    const refreshMap = async () => {
        setRefreshing(true);
        try {
            setBuses(await domainApi.getBuses());
            setLoadError(null);
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : 'Unknown error';
            setLoadError(`Unable to refresh live buses from API: ${msg}`);
        }
        setRefreshing(false);
    };

    // Build live locations from sensor data + bus records
    const raw = sensorData?.oled?.raw as Record<string, unknown> | undefined;
    const DEFAULT_LAT = 14.5995;
    const DEFAULT_LNG = 120.9842;
    const sourceBuses: BusRecord[] = buses.length > 0
        ? buses
        : (sensorData?.gps?.latitude != null && sensorData?.gps?.longitude != null
            ? [{
                id: 'BUS-LIVE',
                driver: (raw?.driver_id as string) ?? 'LIVE',
                status: sensorData?.is_moving ? 'Online' : 'Stationary',
                battery: '—',
                speed: sensorData?.gps?.speed_kmh != null ? `${sensorData.gps.speed_kmh.toFixed(0)} km/h` : '0 km/h',
                location: [sensorData.gps.latitude, sensorData.gps.longitude],
                driverId: (raw?.driver_id as string) ?? 'LIVE',
                detectionStatus: (raw?.drowsiness_state as string)?.toLowerCase() ?? 'monitoring',
                sessionId: '',
            }]
            : []);

    const liveLocations: LiveLocation[] = sourceBuses.map(bus => {
        const lat = sensorData?.gps?.latitude || bus.location[0] || DEFAULT_LAT;
        const lng = sensorData?.gps?.longitude || bus.location[1] || DEFAULT_LNG;
        return {
            id: bus.id,
            lat,
            lng,
            driver: raw?.driver_id as string ?? bus.driver,
            status: raw?.drowsiness_state as string ?? (sensorData?.is_moving ? 'Normal' : 'Stationary'),
            speed: sensorData?.gps?.speed_kmh != null ? `${sensorData.gps.speed_kmh.toFixed(0)} km/h` : bus.speed,
            lastAlert: 'N/A',
            session: bus.sessionId,
            detectionStatus: bus.detectionStatus,
            baselineStatus: raw ? 'active' : 'idle',
            baselineConfidence: 0,
            baselineDeviation: 0,
            sessionDuration: '—',
            todayWorkHours: 0,
            vehicleMoving: sensorData?.is_moving ?? false,
        };
    }).filter(loc => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return loc.driver.toLowerCase().includes(q) || loc.id.toLowerCase().includes(q);
    });

    const mapCenter: [number, number] = sensorData?.gps?.latitude != null
        ? [sensorData.gps.latitude, sensorData.gps.longitude!]
        : [14.5995, 120.9842];

    const configDiag = getRuntimeConfigDiagnostics();

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
            {(!configDiag.ok || loadError) && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                    <p className="text-xs font-black uppercase tracking-widest">Live Monitoring Diagnostics</p>
                    {loadError && <p className="mt-1 text-sm font-semibold">{loadError}</p>}
                    {!configDiag.ok && (
                        <ul className="mt-1 list-disc pl-5 text-sm font-semibold">
                            {configDiag.issues.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Live Monitoring</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time GPS tracking and drowsiness status for the prototype unit.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{connected ? 'Live' : 'Disconnected'}</span>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search active driver..." className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white shadow-sm" />
                    </div>
                    <Button onClick={refreshMap} disabled={refreshing} className="bg-brand-red hover:bg-brand-red/90 h-11 px-6 shadow-lg shadow-brand-red/20 font-bold text-white">{refreshing ? 'Refreshing...' : 'Refresh Map'}</Button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-1 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative z-10 bg-slate-200 dark:bg-slate-900">
                    {isClient ? (
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {liveLocations.map((bus) => (
                                <Marker
                                    key={bus.id}
                                    position={[bus.lat, bus.lng]}
                                    eventHandlers={{
                                        click: () => setSelectedBus(bus),
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2 font-sans font-bold text-slate-800">
                                            {bus.id} - {bus.driver}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-slate-400">Loading Map Resources...</p>
                        </div>
                    )}

                    <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/50 dark:border-slate-800 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Normal</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Drowsy</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stationary</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bus Details Panel */}
                <AnimatePresence mode="wait">
                    {selectedBus ? (
                        <motion.div
                            key="panel"
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="w-96 space-y-6 overflow-y-auto"
                        >
                            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 sticky top-0 ring-1 ring-black/5 dark:ring-white/10">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                            <Bus className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black dark:text-white tracking-tight">{selectedBus.id}</CardTitle>
                                            <StatusBadge status={selectedBus.status} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBus(null)}
                                        className="text-xs font-black text-slate-400 hover:text-brand-red transition-colors uppercase tracking-widest"
                                    >
                                        Close
                                    </button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Driver</span>
                                            <span className="font-bold text-slate-800 dark:text-white">{selectedBus.driver}</span>
                                        </div>

                                        {/* Detection Status */}
                                        <div className={`p-4 rounded-2xl border ${selectedBus.detectionStatus === 'drowsy_detected' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : selectedBus.detectionStatus === 'monitoring' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {selectedBus.detectionStatus === 'drowsy_detected' ? <EyeOff className="w-4 h-4 text-brand-red" /> : selectedBus.detectionStatus === 'monitoring' ? <Eye className="w-4 h-4 text-emerald-500" /> : <Monitor className="w-4 h-4 text-slate-400" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detection Status</span>
                                            </div>
                                            <p className={`font-black text-sm ${selectedBus.detectionStatus === 'drowsy_detected' ? 'text-brand-red' : selectedBus.detectionStatus === 'monitoring' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {selectedBus.detectionStatus === 'drowsy_detected' ? 'DROWSINESS DETECTED' : selectedBus.detectionStatus === 'monitoring' ? 'Normal — Monitoring' : 'Idle — Vehicle Stationary'}
                                            </p>
                                            {selectedBus.detectionStatus === 'drowsy_detected' && selectedBus.vehicleMoving && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    <Volume2 className="w-3 h-3 text-brand-red" />
                                                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Buzzer & OLED Active</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Baseline Status */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Brain className="w-4 h-4 text-brand-orange" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Behavioral Baseline</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-black uppercase tracking-widest ${selectedBus.baselineStatus === 'learned' ? 'text-emerald-500' : selectedBus.baselineStatus === 'deviation' ? 'text-brand-red' : 'text-brand-orange'}`}>
                                                    {selectedBus.baselineStatus === 'learned' ? 'Learned' : selectedBus.baselineStatus === 'deviation' ? 'Deviation Detected' : 'Learning...'}
                                                </span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedBus.baselineConfidence}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                                                <div className={`h-full rounded-full ${selectedBus.baselineStatus === 'learned' ? 'bg-emerald-500' : selectedBus.baselineStatus === 'deviation' ? 'bg-brand-red' : 'bg-brand-orange'}`} style={{ width: `${selectedBus.baselineConfidence}%` }} />
                                            </div>
                                            {selectedBus.baselineDeviation > 20 && (
                                                <p className="text-[10px] font-black text-brand-red mt-2 uppercase tracking-widest">+{selectedBus.baselineDeviation}% deviation from baseline</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <Navigation className="w-4 h-4 text-brand-orange mb-2" />
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Speed</p>
                                                <p className="font-extrabold text-slate-800 dark:text-white">{selectedBus.speed}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <Activity className="w-4 h-4 text-brand-red mb-2" />
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Last Alert</p>
                                                <p className="font-extrabold text-slate-800 dark:text-white">{selectedBus.lastAlert}</p>
                                            </div>
                                        </div>

                                        {/* Session Info */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Session</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-200">{selectedBus.session}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] font-bold text-slate-400">Duration</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedBus.sessionDuration}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] font-bold text-slate-400">Today Total</span>
                                                <span className={`text-xs font-black ${selectedBus.todayWorkHours >= 4 ? 'text-brand-orange' : 'text-slate-700 dark:text-slate-200'}`}>{selectedBus.todayWorkHours}h</span>
                                            </div>
                                            {selectedBus.todayWorkHours >= 4 && (
                                                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">4h threshold reached — rest reminder active</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <div className="w-96 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <Navigation className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-center font-medium px-12 italic">Select a driver on the map to view real-time session data.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
