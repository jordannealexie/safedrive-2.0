'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/app/(dashboard)/components/StatusBadge';
import { Bus, Navigation, Activity, Zap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false }) as any;

const MOCK_LOCATIONS = [
    { id: 'DRV001', lat: 14.5995, lng: 120.9842, driver: 'John Doe', status: 'Normal', speed: '45 km/h', lastAlert: 'None', session: 'SES-003' },
    { id: 'DRV002', lat: 14.6091, lng: 121.0223, driver: 'Jane Smith', status: 'Drowsy', speed: '62 km/h', lastAlert: '5m ago', session: 'SES-007' },
    { id: 'DRV003', lat: 14.5678, lng: 120.9432, driver: 'Michael Brown', status: 'Stationary', speed: '0 km/h', lastAlert: 'N/A', session: 'SES-012' },
];

export default function LiveMonitoringPage() {
    const [selectedBus, setSelectedBus] = useState<typeof MOCK_LOCATIONS[0] | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Fix leaflet marker icon issues
        import('leaflet').then(L => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        });
    }, []);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Live Fleet Monitoring</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time GPS tracking and drowsiness status.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input placeholder="Search active driver..." className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white shadow-sm" />
                    </div>
                    <Button className="bg-brand-red hover:bg-brand-red/90 h-11 px-6 shadow-lg shadow-brand-red/20 font-bold text-white">Refresh Map</Button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-1 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative z-10 bg-slate-200 dark:bg-slate-900">
                    {isClient ? (
                        <MapContainer
                            center={[14.5995, 120.9842]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {MOCK_LOCATIONS.map((bus) => (
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
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Normal (1)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Drowsy (1)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Not Moving (1)</span>
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
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-white h-12 shadow-lg shadow-brand-red/20 font-bold">
                                            Emergency Alert
                                        </Button>
                                        <Button variant="outline" className="w-full h-12 border-slate-200 dark:border-slate-800 dark:text-slate-300">
                                            Contact Driver
                                        </Button>
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
