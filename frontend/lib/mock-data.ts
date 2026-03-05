export const DASHBOARD_STATS = [
  { label: 'Total Active Buses', value: '42', trend: '+12%', icon: 'Bus' },
  { label: 'Total Active Drivers', value: '38', trend: '+5%', icon: 'Users' },
  { label: 'Drowsy Today', value: '4', trend: '-25%', icon: 'UserX', color: 'text-brand-red' },
  { label: 'Alerts Today', value: '12', trend: '+8%', icon: 'AlertTriangle' },
  { label: 'Systems Online', value: '98%', trend: 'Stable', icon: 'Cpu' },
];

export const DROWSINESS_INCIDENTS = [
  { day: 'Mon', incidents: 4 },
  { day: 'Tue', incidents: 7 },
  { day: 'Wed', incidents: 3 },
  { day: 'Thu', incidents: 5 },
  { day: 'Fri', incidents: 8 },
  { day: 'Sat', incidents: 2 },
  { day: 'Sun', incidents: 1 },
];

export const PEAK_HOURS = [
  { hour: '00:00', incidents: 2 },
  { hour: '04:00', incidents: 5 },
  { hour: '08:00', incidents: 1 },
  { hour: '12:00', incidents: 0 },
  { hour: '16:00', incidents: 3 },
  { hour: '20:00', incidents: 6 },
];

export const MOCK_DRIVERS = [
  {
    id: 'DRV001',
    name: 'John Doe',
    busId: 'BUS-102',
    status: 'Normal',
    lastAlert: '2h ago',
    riskLevel: 'Low',
    avatar: '/images/avatar-1.jpg',
  },
  {
    id: 'DRV002',
    name: 'Jane Smith',
    busId: 'BUS-205',
    status: 'Drowsy',
    lastAlert: '5m ago',
    riskLevel: 'High',
    avatar: '/images/avatar-2.jpg',
  },
  {
    id: 'DRV003',
    name: 'Michael Brown',
    busId: 'BUS-310',
    status: 'Stationary',
    lastAlert: 'N/A',
    riskLevel: 'Low',
    avatar: '/images/avatar-3.jpg',
  },
];

export const MOCK_ALERTS = [
  {
    id: 'ALT001',
    type: 'Drowsiness Detected',
    driver: 'Jane Smith',
    bus: 'BUS-205',
    timestamp: '2026-01-16 14:30',
    location: 'Highway 10, Sector 4',
    status: 'Acknowledged',
    severity: 'High',
  },
  {
    id: 'ALT002',
    type: 'Device Offline',
    driver: 'N/A',
    bus: 'BUS-404',
    timestamp: '2026-01-16 13:15',
    location: 'Depot A',
    status: 'Resolved',
    severity: 'Medium',
  },
];

export const BUSES = [
  { id: 'BUS-102', driver: 'John Doe', status: 'Online', battery: '85%', speed: '65 km/h', location: [23.8103, 90.4125] },
  { id: 'BUS-205', driver: 'Jane Smith', status: 'Online', battery: '42%', speed: '72 km/h', location: [23.8203, 90.4225] },
  { id: 'BUS-310', driver: 'Michael Brown', status: 'Offline', battery: '0%', speed: '0 km/h', location: [23.8303, 90.4325] },
];

export const RECENT_ALERTS = [
  { id: 'ALT001', type: 'Drowsiness Detected', driver: 'Jane Smith', bus: 'BUS-205', time: '5m ago', status: 'Active' },
  { id: 'ALT002', type: 'Hard Braking', driver: 'John Doe', bus: 'BUS-102', time: '12m ago', status: 'Acknowledged' },
  { id: 'ALT003', type: 'Overspeeding', driver: 'Michael Brown', bus: 'BUS-310', time: '25m ago', status: 'Active' },
  { id: 'ALT004', type: 'Drowsiness Detected', driver: 'Jane Smith', bus: 'BUS-205', time: '38m ago', status: 'Resolved' },
];
