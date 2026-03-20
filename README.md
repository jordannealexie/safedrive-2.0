<h1 align="center">SafeDrive 2.0</h1>

<p align="center">
  <b>AI-Powered Driver Drowsiness Detection & Accident Prevention System</b>
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,python,fastapi,postgres,supabase,raspberrypi,opencv,nodejs,git,github,vscode" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-IoT%20%7C%20AI%20%7C%20Fullstack-purple?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Realtime-WebSockets-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Edge-Computing-blue?style=for-the-badge"/>
</p>

---

## Overview

**SafeDrive 2.0** is an intelligent driver monitoring system that detects drowsiness in real-time using computer vision and embedded hardware sensors.  
It combines **edge AI processing on Raspberry Pi**, **real-time backend streaming**, and a **modern monitoring dashboard** to prevent fatigue-related road accidents.

The platform enables live driver monitoring, automated alert triggering, fleet analytics, and system health visibility through a scalable IoT-driven architecture.

---

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


---

## Key Features

- **Real-time drowsiness detection** using facial landmark analysis (EAR-based)  
- **Motion-aware alarm system** — buzzer activates only when vehicle movement is detected  
- **Live monitoring dashboard** powered by WebSockets (1 Hz sensor stream)  
- **Driver lifecycle management** — auto face registration, session tracking, work hour compliance  
- **Alert audit system** — severity classification with CSV export support  
- **Infrastructure visibility** — device health monitoring and OLED live preview  
- **Offline-first resilience** — localStorage caching with Supabase cloud synchronization  
- **Embedded IoT integration** — sensor fusion pipeline running on Raspberry Pi  

---

## Technology Stack

| Layer | Technologies |
|------|--------------|
| **Frontend** | Next.js 16 • React 19 • TypeScript • Zustand |
| **Backend** | FastAPI • Python 3.11+ • Uvicorn • WebSockets |
| **AI Detection** | OpenCV • Facial Landmark Processing • safedrive_ai Service |
| **Database** | Supabase • PostgreSQL |
| **IoT Hardware** | Raspberry Pi 4B • MPU-6050 • NEO-6M • OLED SSD1306 • Buzzer • USB Camera |
| **Dev Tools** | Git • GitHub • VS Code • Tailscale |

---

## Prerequisites

- Raspberry Pi 4B (Raspberry Pi OS / Debian)
- Python 3.11+
- Node.js 18+
- Supabase Project
- Tailscale (Remote Access Networking)

---

## Hardware Connections

| Component | Model | Interface |
|-----------|------|-----------|
| Camera | USB Webcam | USB |
| GPS | NEO-6M | Serial `/dev/ttyAMA0` |
| Accelerometer | MPU-6050 | I2C Bus 1 (`0x68`) |
| Buzzer | Active Buzzer | GPIO 17 |
| Display | SSD1306 OLED | SPI |

---

## Setup Guide

### Backend (Raspberry Pi)

```bash
ssh raspi4b@<PI_IP>

mkdir -p /home/raspi4b/SafeDrive/backend

python3 -m venv /home/raspi4b/SafeDrive/venv
source /home/raspi4b/SafeDrive/venv/bin/activate

cd /home/raspi4b/SafeDrive/backend
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000

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

## Author
Jordanne Alexie M. Bartolome
