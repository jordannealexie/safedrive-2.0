const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
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
    getGPS: () => apiFetch<GPSReading>('/api/sensors/gps/latest'),
    getAccel: () => apiFetch<AccelReading>('/api/sensors/accelerometer/latest'),
    getBuzzerStatus: () => apiFetch<BuzzerStatus>('/api/sensors/buzzer/status'),
    getOLEDStatus: () => apiFetch<OLEDStatus>('/api/sensors/oled/status'),
    getSystemStatus: () => apiFetch<SystemStatus>('/api/system/status'),
    getIsMoving: () => apiFetch<{ is_moving: boolean; magnitude: number }>('/api/system/is-moving'),
    getHealth: () => apiFetch<{ status: string; mock_mode: boolean }>('/api/system/health'),

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
}

export const domainApi = {
    getDashboard: () => apiFetch<DashboardData>('/api/dashboard/stats'),
    getDrivers: () => apiFetch<Driver[]>('/api/drivers'),
    getDriver: (id: string) => apiFetch<DriverDetail>(`/api/drivers/${encodeURIComponent(id)}`),
    getSessions: () => apiFetch<DriverSession[]>('/api/sessions'),
    getWorkHours: () => apiFetch<WorkHours[]>('/api/work-hours'),
    getAlerts: () => apiFetch<AlertRecord[]>('/api/alerts'),
    getBuses: () => apiFetch<BusRecord[]>('/api/buses'),
};
