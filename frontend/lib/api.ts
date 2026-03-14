import { supabase } from './supabase';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
const RAW_WS_URL = process.env.NEXT_PUBLIC_WS_URL?.trim() || '';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Allow localhost convenience only in development. In production, force explicit config.
const API_URL = RAW_API_URL || (IS_DEV ? 'http://localhost:8000' : '');
const WS_URL = RAW_WS_URL || (IS_DEV ? 'ws://localhost:8000' : '');
const DEFAULT_CACHE_TTL_MS = 8000;

type CacheEntry = { data: unknown; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function getCachedValue<T>(cacheKey: string): T | null {
    const mem = memoryCache.get(cacheKey);
    if (mem && mem.expiresAt > Date.now()) return mem.data as T;

    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;

        // New cache envelope format: { data, expiresAt }
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'data' in parsed &&
            'expiresAt' in parsed &&
            typeof (parsed as { expiresAt: unknown }).expiresAt === 'number'
        ) {
            const entry = parsed as CacheEntry;
            if (entry.expiresAt <= Date.now()) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            memoryCache.set(cacheKey, entry);
            return entry.data as T;
        }

        // Backward-compatible path for old plain JSON cache entries.
        const legacyData = parsed as T;
        memoryCache.set(cacheKey, { data: legacyData, expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS });
        return legacyData;
    } catch {
        return null;
    }
}

function setCachedValue<T>(cacheKey: string, data: T, ttlMs: number): void {
    const entry: CacheEntry = { data, expiresAt: Date.now() + ttlMs };
    memoryCache.set(cacheKey, entry);
    if (typeof window !== 'undefined') {
        try { localStorage.setItem(cacheKey, JSON.stringify(entry)); } catch {}
    }
}

async function dedupedRequest<T>(requestKey: string, loader: () => Promise<T>): Promise<T> {
    const existing = inFlightRequests.get(requestKey);
    if (existing) return existing as Promise<T>;

    const promise = loader().finally(() => {
        inFlightRequests.delete(requestKey);
    });
    inFlightRequests.set(requestKey, promise as Promise<unknown>);
    return promise;
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    if (!API_URL) {
        throw new Error('Missing NEXT_PUBLIC_API_URL in production environment.');
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

/**
 * Fetch with TTL cache + request deduplication.
 * Returns cached data immediately for GET reads when fresh.
 */
async function cachedFetch<T = unknown>(
    path: string,
    options?: RequestInit,
    ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<T> {
    const method = (options?.method || 'GET').toUpperCase();
    const isRead = method === 'GET';
    const cacheKey = `safedrive_cache_${path}`;
    const requestKey = `request_${method}_${path}`;

    if (isRead) {
        const fresh = getCachedValue<T>(cacheKey);
        if (fresh !== null) return fresh;
    }

    return dedupedRequest<T>(requestKey, async () => {
        try {
            const data = await apiFetch<T>(path, options);
            if (isRead) setCachedValue(cacheKey, data, ttlMs);
            return data;
        } catch {
            if (isRead) {
                const stale = getCachedValue<T>(cacheKey);
                if (stale !== null) return stale;
            }
            throw new Error(`API unreachable and no cache for ${path}`);
        }
    });
}

export function getWsUrl(path: string): string {
    if (!WS_URL) {
        throw new Error('Missing NEXT_PUBLIC_WS_URL in production environment.');
    }
    return `${WS_URL}${path}`;
}

export function getRuntimeConfigDiagnostics() {
    const issues: string[] = [];

    if (!API_URL) {
        issues.push('NEXT_PUBLIC_API_URL is missing.');
    }
    if (!WS_URL) {
        issues.push('NEXT_PUBLIC_WS_URL is missing.');
    }
    if (WS_URL && !/^wss?:\/\//i.test(WS_URL)) {
        issues.push('NEXT_PUBLIC_WS_URL must start with ws:// or wss://.');
    }
    if (!IS_DEV && WS_URL.startsWith('ws://')) {
        issues.push('NEXT_PUBLIC_WS_URL should use wss:// in production.');
    }

    return {
        apiUrl: API_URL,
        wsUrl: WS_URL,
        isDev: IS_DEV,
        issues,
        ok: issues.length === 0,
    };
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
        const alertsCacheKey = 'safedrive_cache_domain_alerts';
        const cached = getCachedValue<AlertRecord[]>(alertsCacheKey);
        if (cached !== null) return cached;

        return dedupedRequest<AlertRecord[]>('request_domain_alerts', async () => {
            // Prefer Supabase for status mutations, then cache aggressively for snappy navigation
            try {
                const { data, error } = await supabase
                    .from('alerts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(200);
                if (error) throw error;
                if (data && data.length > 0) {
                    const mapped = data.map(mapAlertRow);
                    setCachedValue(alertsCacheKey, mapped, DEFAULT_CACHE_TTL_MS);
                    return mapped;
                }
            } catch {}

            const fallback = await cachedFetch<AlertRecord[]>('/api/alerts');
            setCachedValue(alertsCacheKey, fallback, DEFAULT_CACHE_TTL_MS);
            return fallback;
        });
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
            const listKey = 'safedrive_cache_/api/drivers';
            const detailKey = `safedrive_cache_/api/drivers/${encodeURIComponent(id)}`;
            memoryCache.delete(listKey);
            memoryCache.delete(detailKey);
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(listKey);
                    localStorage.removeItem(detailKey);
                } catch {}
            }
        } catch {
            // Pi offline — delete directly from Supabase
            await supabase.from('alerts').delete().eq('driver', id);
            await supabase.from('sessions').delete().eq('driver_id', id);
            await supabase.from('driver_notes').delete().eq('driver_id', id);
            await supabase.from('drivers').delete().eq('id', id);

            const listKey = 'safedrive_cache_/api/drivers';
            const detailKey = `safedrive_cache_/api/drivers/${encodeURIComponent(id)}`;
            memoryCache.delete(listKey);
            memoryCache.delete(detailKey);
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(listKey);
                    localStorage.removeItem(detailKey);
                } catch {}
            }
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
