import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    // On HTTPS (Vercel), skip Pi API calls — mixed content is blocked
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_URL.startsWith('http:')) {
        throw new Error('Mixed content blocked');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
        return res.json();
    } finally {
        clearTimeout(timeout);
    }
}

/** Fetch with localStorage cache — returns cached data when the API is unreachable. */
async function cachedFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const cacheKey = `safedrive_cache_${path}`;
    try {
        const data = await apiFetch<T>(path, options);
        if (typeof window !== 'undefined') {
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        }
        return data;
    } catch {
        // Pi API failed — try localStorage cache
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached) as T;
        }
        throw new Error(`API unreachable and no cache for ${path}`);
    }
}

export function getWsUrl(path: string): string {
    return `${WS_URL}${path}`;
}

// --- Typed API helpers ---

export interface GPSReading {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    speed_kmh: number | null;
    fix: boolean;
    satellites: number | null;
    timestamp: string;
}

export interface AccelReading {
    ax: number;
    ay: number;
    az: number;
    magnitude: number;
    is_moving: boolean;
    timestamp: string;
}

export interface BuzzerStatus {
    active: boolean;
    last_triggered: string | null;
    suppressed: boolean;
    suppression_reason: string | null;
}

export interface OLEDStatus {
    current_message: string;
    lines: string[];
    last_updated: string;
    raw?: Record<string, unknown>;
}

export interface SystemStatus {
    gps: GPSReading;
    accelerometer: AccelReading;
    buzzer: BuzzerStatus;
    oled: OLEDStatus;
    is_moving: boolean;
}

export interface LiveSensorData {
    timestamp: string;
    gps: {
        latitude: number | null;
        longitude: number | null;
        altitude: number | null;
        speed_kmh: number | null;
        fix: boolean;
        satellites: number | null;
    };
    accelerometer: {
        ax: number;
        ay: number;
        az: number;
        magnitude: number;
        is_moving: boolean;
    };
    buzzer: { active: boolean };
    oled: { current_message: string; lines: string[]; raw?: Record<string, unknown> };
    is_moving: boolean;
}

// Sensor API calls
export const sensorApi = {
    getGPS: () => cachedFetch<GPSReading>('/api/sensors/gps/latest'),
    getAccel: () => cachedFetch<AccelReading>('/api/sensors/accelerometer/latest'),
    getBuzzerStatus: () => cachedFetch<BuzzerStatus>('/api/sensors/buzzer/status'),
    getOLEDStatus: () => cachedFetch<OLEDStatus>('/api/sensors/oled/status'),
    getSystemStatus: () => cachedFetch<SystemStatus>('/api/system/status'),
    getIsMoving: () => cachedFetch<{ is_moving: boolean; magnitude: number }>('/api/system/is-moving'),
    getHealth: () => cachedFetch<{ status: string; mock_mode: boolean }>('/api/system/health'),

    triggerBuzzer: (duration_ms = 500) =>
        apiFetch<BuzzerStatus>('/api/sensors/buzzer/trigger', {
            method: 'POST',
            body: JSON.stringify({ duration_ms }),
        }),
    stopBuzzer: () =>
        apiFetch('/api/sensors/buzzer/stop', { method: 'POST' }),

    sendOLEDMessage: (line1: string, line2 = '', line3 = '') =>
        apiFetch<OLEDStatus>('/api/sensors/oled/message', {
            method: 'POST',
            body: JSON.stringify({ line1, line2, line3 }),
        }),
    sendOLEDAlert: (alert_type: string, severity = 'medium') =>
        apiFetch<OLEDStatus>('/api/sensors/oled/alert', {
            method: 'POST',
            body: JSON.stringify({ alert_type, severity }),
        }),

    setManualGPS: (latitude: number, longitude: number, speed_kmh = 0) =>
        apiFetch<GPSReading>('/api/sensors/gps/manual', {
            method: 'POST',
            body: JSON.stringify({ latitude, longitude, speed_kmh }),
        }),
    setManualAccel: (ax: number, ay: number, az: number) =>
        apiFetch<AccelReading>('/api/sensors/accelerometer/manual', {
            method: 'POST',
            body: JSON.stringify({ ax, ay, az }),
        }),
};

// --- Domain API calls ---

export interface DashboardStat {
    label: string;
    value: string;
    trend: string;
    icon: string;
    color?: string;
}

export interface IncidentPoint {
    day: string;
    incidents: number;
}

export interface PeakHourPoint {
    hour: string;
    incidents: number;
}

export interface RecentAlert {
    id: string;
    type: string;
    driver: string;
    time: string;
    status: string;
    sessionId: string;
    alarmTriggered: boolean;
}

export interface DetectionEvent {
    id: string;
    driverId: string;
    driver: string;
    type: string;
    confidence: number;
    timestamp: string;
    alarmTriggered: boolean;
    alarmType: string;
    vehicleMoving: boolean;
    baselineDeviation: number;
}

export interface DashboardData {
    stats: DashboardStat[];
    drowsinessIncidents: IncidentPoint[];
    peakHours: PeakHourPoint[];
    recentAlerts: RecentAlert[];
    detectionFeed: DetectionEvent[];
}

export interface Driver {
    id: string;
    name: string;
    busId: string;
    status: string;
    lastAlert: string;
    riskLevel: string;
    avatar: string;
    faceRegistered: boolean;
    faceRegisteredAt: string;
    totalSessions: number;
    todayWorkHours: number;
    todaySessions: number;
    detectionStatus: string;
    baselineStatus: string;
    baselineConfidence: number;
}

export interface DriverSession {
    id: string;
    driverId: string;
    driver: string;
    busId: string;
    startTime: string;
    endTime: string | null;
    duration: string;
    status: string;
    alertCount: number;
    baselineStatus: string;
    baselineConfidence: number;
    drowsinessEvents: number;
}

export interface WorkHourSession {
    start: string;
    end: string | null;
    duration: number;
    active: boolean;
}

export interface WorkHours {
    driverId: string;
    driver: string;
    todayTotal: number;
    sessions: WorkHourSession[];
    threshold4h: boolean;
    threshold8h: boolean;
    reminderActive: boolean;
    weeklyHours: number[];
}

export interface AlertRecord {
    id: string;
    type: string;
    driver: string;
    bus: string;
    timestamp: string;
    location: string;
    status: string;
    severity: string;
    sessionId: string;
    alarmType: string;
    baselineDeviation: number;
}

export interface BusRecord {
    id: string;
    driver: string;
    status: string;
    battery: string;
    speed: string;
    location: [number, number];
    driverId: string;
    detectionStatus: string;
    sessionId: string;
}

export interface DriverDetail {
    driver: Driver;
    sessions: DriverSession[];
    workHours: WorkHours | null;
    drowsinessIncidents?: IncidentPoint[];
}

// ---------------------------------------------------------------------------
// Supabase fallback helpers (used when Pi API is unreachable, e.g. on Vercel)
// ---------------------------------------------------------------------------

function mapDriverRow(r: Record<string, unknown>): Driver {
    return {
        id: r.id as string,
        name: (r.name as string) || (r.id as string),
        busId: (r.bus_id as string) || 'BUS-001',
        status: 'Offline',
        lastAlert: (r.last_alert as string) || 'N/A',
        riskLevel: (r.risk_level as string) || 'Low',
        avatar: '',
        faceRegistered: (r.face_registered as boolean) ?? true,
        faceRegisteredAt: (r.face_registered_at as string) || '',
        totalSessions: (r.total_sessions as number) || 0,
        todayWorkHours: (r.today_work_hours as number) || 0,
        todaySessions: (r.today_sessions as number) || 0,
        detectionStatus: 'idle',
        baselineStatus: (r.baseline_status as string) || 'learned',
        baselineConfidence: (r.baseline_confidence as number) || 80,
    };
}

function mapAlertRow(r: Record<string, unknown>): AlertRecord {
    return {
        id: r.id as string,
        type: r.type as string,
        driver: r.driver as string,
        bus: (r.bus as string) || 'BUS-001',
        timestamp: r.timestamp as string,
        location: '',
        status: (r.status as string) || 'Active',
        severity: (r.severity as string) || 'Medium',
        sessionId: (r.session_id as string) || '',
        alarmType: (r.alarm_type as string) || 'buzzer_oled',
        baselineDeviation: 0,
    };
}

function mapSessionRow(r: Record<string, unknown>): DriverSession {
    return {
        id: r.id as string,
        driverId: r.driver_id as string,
        driver: (r.driver as string) || '',
        busId: (r.bus_id as string) || 'BUS-001',
        startTime: (r.start_time as string) || '',
        endTime: (r.end_time as string) || null,
        duration: '',
        status: (r.status as string) || 'completed',
        alertCount: (r.alert_count as number) || 0,
        baselineStatus: 'learned',
        baselineConfidence: 80,
        drowsinessEvents: (r.drowsiness_events as number) || 0,
    };
}

async function supabaseFallback<T>(table: string, mapper: (r: Record<string, unknown>) => unknown, orderCol = 'created_at'): Promise<T> {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(orderCol, { ascending: false })
        .limit(200);
    if (error) throw error;
    return (data || []).map(mapper) as T;
}

export const domainApi = {
    getDashboard: async (): Promise<DashboardData> => {
        try {
            return await cachedFetch<DashboardData>('/api/dashboard/stats');
        } catch {
            // Build dashboard from Supabase tables
            const [drivers, alerts, eventStats] = await Promise.all([
                supabase.from('drivers').select('*').then(r => r.data || []),
                supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50).then(r => r.data || []),
                supabase.from('event_stats').select('*').then(r => r.data || []),
            ]);
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const hourLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
            const byDay: Record<number, number> = {};
            const byHour: Record<number, number> = {};
            eventStats.forEach((r: { stat_type: string; stat_key: number; count: number }) => {
                if (r.stat_type === 'daily') byDay[r.stat_key] = r.count;
                if (r.stat_type === 'hourly') byHour[r.stat_key] = r.count;
            });

            return {
                stats: [
                    { label: 'Registered Drivers', value: String(drivers.length), trend: '', icon: 'Users' },
                    { label: 'Drowsy Today', value: String(alerts.length), trend: '', icon: 'UserX', color: 'text-brand-red' },
                    { label: 'Alerts Today', value: String(alerts.length), trend: '', icon: 'AlertTriangle' },
                    { label: 'Active Sessions', value: '0', trend: '', icon: 'Cpu' },
                ],
                drowsinessIncidents: dayNames.map((d, i) => ({ day: d, incidents: byDay[i] || 0 })),
                peakHours: hourLabels.map(h => ({ hour: h, incidents: byHour[parseInt(h)] || 0 })),
                recentAlerts: alerts.slice(0, 5).map((a: Record<string, unknown>) => ({
                    id: a.id as string,
                    type: a.type as string,
                    driver: a.driver as string,
                    time: a.timestamp as string,
                    status: (a.status as string) || 'Active',
                    sessionId: (a.session_id as string) || '',
                    alarmTriggered: true,
                })),
                detectionFeed: [],
            };
        }
    },
    getDrivers: async (): Promise<Driver[]> => {
        try { return await cachedFetch<Driver[]>('/api/drivers'); }
        catch { return supabaseFallback<Driver[]>('drivers', mapDriverRow, 'first_seen'); }
    },
    getDriver: async (id: string): Promise<DriverDetail> => {
        try { return await cachedFetch<DriverDetail>(`/api/drivers/${encodeURIComponent(id)}`); }
        catch {
            const { data } = await supabase.from('drivers').select('*').eq('id', id).single();
            if (!data) throw new Error('Driver not found');
            const { data: sessData } = await supabase.from('sessions').select('*').eq('driver_id', id).order('created_at', { ascending: false });
            const { data: alertData } = await supabase.from('alerts').select('*').eq('driver', id).order('created_at', { ascending: false });
            const driverRow = mapDriverRow(data);
            const sessions = (sessData || []).map(mapSessionRow);
            const todayTotal = driverRow.todayWorkHours || 0;
            // Build per-driver weekly incidents from alerts
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayCounts = [0, 0, 0, 0, 0, 0, 0];
            (alertData || []).forEach((a: Record<string, unknown>) => {
                const ts = a.timestamp as string;
                if (ts) { const d = new Date(ts); dayCounts[((d.getDay() + 6) % 7)] += 1; }
            });
            return {
                driver: driverRow,
                sessions,
                workHours: {
                    driverId: id,
                    driver: driverRow.name,
                    todayTotal,
                    sessions: sessions.filter(s => s.status === 'active').map(s => ({
                        start: s.startTime,
                        end: s.endTime,
                        duration: todayTotal / Math.max(driverRow.todaySessions, 1),
                        active: s.status === 'active',
                    })),
                    threshold4h: todayTotal >= 4,
                    threshold8h: todayTotal >= 8,
                    reminderActive: todayTotal >= 6,
                    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
                },
                drowsinessIncidents: dayNames.map((d, i) => ({ day: d, incidents: dayCounts[i] })),
            };
        }
    },
    getSessions: async (): Promise<DriverSession[]> => {
        try { return await cachedFetch<DriverSession[]>('/api/sessions'); }
        catch { return supabaseFallback<DriverSession[]>('sessions', mapSessionRow); }
    },
    getWorkHours: () => cachedFetch<WorkHours[]>('/api/work-hours'),
    getAlerts: async (): Promise<AlertRecord[]> => {
        // Always read from Supabase so status mutations are reflected
        try {
            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) throw error;
            if (data && data.length > 0) return data.map(mapAlertRow);
        } catch {}
        // Fallback to Pi API / cache
        return cachedFetch<AlertRecord[]>('/api/alerts');
    },
    getBuses: () => cachedFetch<BusRecord[]>('/api/buses'),

    // --- Mutations (write directly to Supabase) ---
    updateAlertStatus: async (id: string, status: string) => {
        await supabase.from('alerts').update({ status }).eq('id', id);
    },
    updateAllAlertStatus: async (status: string) => {
        await supabase.from('alerts').update({ status }).neq('id', '');
    },
    deleteDriver: async (id: string) => {
        try {
            await apiFetch(`/api/drivers/${id}`, { method: 'DELETE' });
        } catch {
            // Pi offline — delete directly from Supabase
            await supabase.from('alerts').delete().eq('driver', id);
            await supabase.from('sessions').delete().eq('driver_id', id);
            await supabase.from('driver_notes').delete().eq('driver_id', id);
            await supabase.from('drivers').delete().eq('id', id);
        }
    },

    // --- Driver Notes ---
    getDriverNotes: async (driverId: string): Promise<string> => {
        const { data } = await supabase
            .from('driver_notes')
            .select('content')
            .eq('driver_id', driverId)
            .single();
        return data?.content || '';
    },
    saveDriverNotes: async (driverId: string, content: string) => {
        await supabase
            .from('driver_notes')
            .upsert({ driver_id: driverId, content, updated_at: new Date().toISOString() });
    },
};

// ---------------------------------------------------------------------------
// Settings API
// ---------------------------------------------------------------------------

export interface SettingsData {
    general: {
        timezone: string;
        temperatureUnit: string;
        compactDashboard: boolean;
        highContrast: boolean;
    };
    alertThresholds: {
        drowsinessConfidence: number;
        continuousDrowsinessDuration: number;
        baselineDeviationThreshold: number;
        motionRequirement: boolean;
    };
    notifications: {
        vehicleBuzzer: boolean;
        oledDisplay: boolean;
        previewMessage: string;
        browserAudio: boolean;
        emailSummaries: boolean;
    };
    driverRules: {
        maxContinuousDriving: number;
        mandatoryRestingBlock: number;
        alertGracePeriod: number;
    };
}

const DEFAULT_SETTINGS: SettingsData = {
    general: { timezone: 'Local', temperatureUnit: 'Celsius', compactDashboard: false, highContrast: false },
    alertThresholds: { drowsinessConfidence: 75, continuousDrowsinessDuration: 3, baselineDeviationThreshold: 30, motionRequirement: true },
    notifications: { vehicleBuzzer: true, oledDisplay: true, previewMessage: 'Drowsiness Alert!', browserAudio: false, emailSummaries: false },
    driverRules: { maxContinuousDriving: 4, mandatoryRestingBlock: 15, alertGracePeriod: 10 },
};

export const settingsApi = {
    get: async (): Promise<SettingsData> => {
        try { return await cachedFetch<SettingsData>('/api/settings'); }
        catch {
            // Read from Supabase settings table
            const { data } = await supabase.from('settings').select('data').eq('id', 1).single();
            if (data?.data) return { ...DEFAULT_SETTINGS, ...data.data } as SettingsData;
            return DEFAULT_SETTINGS;
        }
    },
    update: (data: Partial<SettingsData>) =>
        apiFetch<SettingsData>('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    updateSection: (section: string, data: Record<string, unknown>) =>
        apiFetch<Record<string, unknown>>(`/api/settings/${encodeURIComponent(section)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
};
