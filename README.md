# SafeDrive 2.0

AI-powered driver drowsiness detection and accident prevention system. Combines computer vision, hardware sensors, and a real-time web dashboard to monitor driver fatigue and trigger alerts when drowsiness is detected while the vehicle is in motion.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │────▶│   Backend        │────▶│  Sensors     │
│   Next.js 16    │ WS  │   FastAPI        │ I2C │  on Pi 4B    │
│   React 19      │◀────│   Uvicorn        │◀────│              │
└────────┬────────┘     └────────┬─────────┘     └──────────────┘
         │                       │                 • MPU-6050 (Accelerometer)
         ▼                       ▼                 • NEO-6M GPS
    ┌──────────┐          ┌────────────┐           • OLED Display (SPI)
    │ Supabase │◀─────────│safedrive_ai│           • Active Buzzer (GPIO)
    │ (Cloud)  │          │ (ML Model) │           • USB Camera
    └──────────┘          └────────────┘
```

| Layer | Tech | Description |
|-------|------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript | Admin dashboard with live monitoring, alerts, driver profiles, reports |
| **Backend** | FastAPI, Python 3.11+ | REST API + WebSocket for sensor data, driver/alert management |
| **Detection** | safedrive_ai (separate service) | Facial landmark analysis for drowsiness detection |
| **Database** | Supabase (PostgreSQL) | Cloud persistence with offline localStorage fallback |
| **Hardware** | Raspberry Pi 4B | GPS, accelerometer, buzzer, OLED, camera |

## Key Features

- **Real-time drowsiness detection** via facial landmark analysis (EAR-based)
- **Motion-aware alarm suppression** — buzzer only sounds when vehicle is moving (accel > 1.2g)
- **Session-based baseline learning** — each driving session builds unique behavior profile
- **Live dashboard** — WebSocket-powered real-time monitoring at 1 Hz
- **Driver management** — face auto-registration, session tracking, work hour compliance
- **Alert system** — severity levels, audit trail, CSV export
- **System status** — device health, core infrastructure monitoring, OLED live preview
- **Offline-first** — localStorage caching, Supabase fallback when Pi is unreachable

## Prerequisites

- **Raspberry Pi 4B** with Raspbian/Debian
- **Python 3.11+**
- **Node.js 18+**
- **Tailscale** (for remote access)
- **Supabase** project (for cloud persistence)

### Hardware

| Component | Model | Connection |
|-----------|-------|------------|
| Camera | USB webcam | USB |
| GPS | NEO-6M | Serial (`/dev/ttyAMA0`, 9600 baud) |
| Accelerometer | MPU-6050 | I2C (address `0x68`, bus 1) |
| Buzzer | Active buzzer | GPIO pin 17 |
| Display | SSD1306 OLED | SPI |

## Setup

### Backend (Raspberry Pi)

```bash
# SSH into the Pi
ssh raspi4b@<PI_IP>

# Create project directory
mkdir -p /home/raspi4b/SafeDrive/backend

# Create virtual environment
python3 -m venv /home/raspi4b/SafeDrive/venv
source /home/raspi4b/SafeDrive/venv/bin/activate

# Install dependencies
cd /home/raspi4b/SafeDrive/backend
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or use the deploy script from your development machine:

```bash
python deploy_to_pi.py
```

### Frontend (Development Machine)

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://<PI_TAILSCALE_IP>:8000
NEXT_PUBLIC_WS_URL=ws://<PI_TAILSCALE_IP>:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
```

### Database (Supabase)

Run the schema in your Supabase SQL editor:

```bash
# Located at:
backend/app/models/supabase_schema.sql
```

## API Endpoints

### Sensors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sensors/gps/latest` | Latest GPS reading |
| GET | `/api/sensors/accelerometer/latest` | Acceleration + is_moving flag |
| POST | `/api/sensors/buzzer/trigger` | Sound buzzer (motion-gated) |
| POST | `/api/sensors/buzzer/stop` | Silence buzzer |
| GET | `/api/sensors/oled/status` | OLED display content |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system/status` | Aggregated sensor snapshot |
| GET | `/api/system/is-moving` | Motion state + magnitude |
| GET | `/api/system/health` | Health check |

### Domain
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/drivers` | All drivers |
| GET | `/api/drivers/:id` | Driver detail + sessions + work hours |
| GET | `/api/alerts` | All alerts |
| GET | `/api/sessions` | All sessions |
| GET | `/api/buses` | Bus fleet |

### WebSocket
| Path | Description |
|------|-------------|
| `WS /ws/live` | Live sensor stream (1 Hz) |

## Project Structure

```
SafeDrive 2.0/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app with lifespan management
│       ├── config.py            # Environment configuration
│       ├── core/safety.py       # Motion-aware alarm logic
│       ├── models/
│       │   ├── schemas.py       # Pydantic data models
│       │   └── supabase_schema.sql
│       ├── routers/
│       │   ├── sensors.py       # Sensor + system endpoints
│       │   ├── domain.py        # Drivers, alerts, sessions
│       │   ├── settings.py      # System configuration
│       │   └── ws.py            # WebSocket live stream
│       └── sensors/
│           ├── accelerometer.py # MPU-6050 I2C driver
│           ├── gps.py           # NEO-6M NMEA parser
│           ├── buzzer.py        # GPIO buzzer control
│           ├── oled.py          # OLED state reader
│           └── mock.py          # Mock sensors for testing
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   └── (dashboard)/         # Dashboard pages
│   │       ├── page.tsx         # Home dashboard
│   │       ├── alerts/          # Alert management
│   │       ├── buses/           # Fleet overview
│   │       ├── drivers/         # Driver list + profiles
│   │       ├── live-monitoring/ # Real-time map
│   │       ├── reports/         # Compliance reports
│   │       ├── system-status/   # Device health
│   │       └── faqs/            # Help docs
│   ├── hooks/useLiveSensor.ts   # WebSocket hook
│   ├── lib/api.ts               # API client + Supabase fallback
│   └── store/useUIStore.ts      # Zustand state
├── deploy_to_pi.py              # Automated deployment
├── start_pi_server.py           # Server launcher
└── start_pi_tailscale.py        # Tailscale server launcher
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_SENSORS` | Use simulated sensor data | `false` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | — |

## Scripts

| Script | Purpose |
|--------|---------|
| `deploy_to_pi.py` | Full deployment (upload + install + start) |
| `start_pi_server.py` | Start server via local network SSH |
| `start_pi_tailscale.py` | Start server via Tailscale SSH |
| `check_sensors.py` | Diagnostic: test sensor connections |
| `scan_i2c.py` | Scan I2C bus for connected devices |
