# SafeDrive 2.0 — Hardware Setup Guide

## 1. Wiring Diagram

| Sensor / Module    | Sensor Pin | Raspberry Pi 4B Pin | Interface |
|--------------------|-----------|---------------------|-----------|
| **NEO-6M GPS**     | TX        | GPIO 15 (RXD)       | UART      |
|                    | RX        | GPIO 14 (TXD)       | UART      |
|                    | VCC       | 3.3V                | Power     |
|                    | GND       | GND                 | Ground    |
| **MPU-6050**       | SDA       | GPIO 2 (SDA1)       | I2C       |
|                    | SCL       | GPIO 3 (SCL1)       | I2C       |
|                    | VCC       | 3.3V                | Power     |
|                    | GND       | GND                 | Ground    |
| **SSD1306 OLED**   | SDA       | GPIO 2 (SDA1)       | I2C       |
|                    | SCL       | GPIO 3 (SCL1)       | I2C       |
|                    | VCC       | 3.3V                | Power     |
|                    | GND       | GND                 | Ground    |
| **Active Buzzer**  | + (Signal)| GPIO 17             | Digital   |
|                    | - (GND)   | GND                 | Ground    |

> MPU-6050 (0x68) and SSD1306 OLED (0x3C) share the same I2C bus — they have different addresses so no conflict.

---

## 2. Enable I2C and UART on Raspberry Pi OS

```bash
sudo raspi-config
```

1. **Interface Options → I2C → Enable**
2. **Interface Options → Serial Port:**
   - "Would you like a login shell accessible over serial?" → **No**
   - "Would you like the serial port hardware to be enabled?" → **Yes**
3. Reboot: `sudo reboot`

Verify I2C devices:
```bash
sudo apt install i2c-tools
i2cdetect -y 1
```

You should see addresses `0x3c` (OLED) and `0x68` (MPU-6050).

---

## 3. WiFi Connection

```bash
sudo nmcli dev wifi connect "Garden 0f Eden" password "EbaAtAdan"
```

Check IP:
```bash
hostname -I
```

---

## 4. Install Python Dependencies

```bash
cd backend/
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 5. Run the Backend

### Production (on Raspberry Pi with sensors):
```bash
cd backend/
USE_MOCK_SENSORS=false uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Mock mode (no hardware needed — for testing on any machine):
```bash
cd backend/
USE_MOCK_SENSORS=true uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6. Access Swagger API Docs

Open in browser:
```
http://<pi-ip>:8000/docs
```

All sensor endpoints can be tested interactively from the Swagger UI.

---

## 7. Run the Frontend

```bash
cd frontend/

# Update .env.local with the Pi's IP:
# NEXT_PUBLIC_API_URL=http://<pi-ip>:8000
# NEXT_PUBLIC_WS_URL=ws://<pi-ip>:8000

npm install
npm run dev
```

---

## 8. Run Tests

```bash
cd backend/

# Sensor hardware/mock test:
python test_sensors.py

# WiFi and API connectivity test (start API first):
python test_wifi.py
```

---

## 9. API Endpoints Reference

### Sensor Data
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/sensors/gps/latest` | Latest GPS reading |
| POST   | `/api/sensors/gps/manual` | Manually input GPS data |
| GET    | `/api/sensors/accelerometer/latest` | Latest accelerometer reading |
| POST   | `/api/sensors/accelerometer/manual` | Manually input accel data |
| POST   | `/api/sensors/buzzer/trigger` | Trigger buzzer (respects motion check) |
| POST   | `/api/sensors/buzzer/stop` | Silence buzzer immediately |
| GET    | `/api/sensors/buzzer/status` | Buzzer status |
| POST   | `/api/sensors/oled/message` | Send message to OLED |
| POST   | `/api/sensors/oled/alert` | Display alert on OLED |
| GET    | `/api/sensors/oled/status` | Current OLED display |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/system/status` | All sensors status at once |
| GET    | `/api/system/is-moving` | Boolean: is the bus moving? |
| GET    | `/api/system/health` | API health check |

### WebSocket
| Path | Description |
|------|-------------|
| `/ws/live` | Streams live sensor data every 1 second |

---

## 10. Environment Variables

All configurable via `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK_SENSORS` | `true` | Use mock sensor data |
| `BUZZER_GPIO_PIN` | `17` | GPIO pin for buzzer |
| `GPS_SERIAL_PORT` | `/dev/ttyAMA0` | Serial port for NEO-6M |
| `GPS_BAUD_RATE` | `9600` | GPS baud rate |
| `MPU6050_I2C_ADDRESS` | `0x68` | I2C address for MPU-6050 |
| `OLED_I2C_ADDRESS` | `0x3C` | I2C address for SSD1306 |
| `ACCEL_MOVING_THRESHOLD` | `1.2` | Acceleration threshold (g) |
| `API_HOST` | `0.0.0.0` | Server bind address |
| `API_PORT` | `8000` | Server port |
