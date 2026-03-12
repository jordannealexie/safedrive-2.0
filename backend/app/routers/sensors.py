"""Sensor API routes — GPS, Accelerometer, Buzzer, OLED."""

import math
from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import USE_MOCK_SENSORS
from app.models.schemas import (
    GPSReading, AccelReading, BuzzerStatus, OLEDStatus,
    BuzzerTriggerRequest, OLEDMessageRequest, OLEDAlertRequest,
    ManualGPSInput, ManualAccelInput, SystemStatus,
)
from app.sensors import (
    gps_read_impl, accel_read_impl,
    buzzer_buzz_impl, buzzer_stop_impl, buzzer_is_active_impl,
    oled_show_impl, oled_show_alert_impl, oled_clear_impl, oled_get_status_impl,
)
from app.core.safety import should_trigger_alarm

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])

# In-memory latest readings (updated by background tasks)
_latest_gps: GPSReading = GPSReading()
_latest_accel: AccelReading = AccelReading()


def update_latest_gps(reading: GPSReading):
    global _latest_gps
    _latest_gps = reading


def update_latest_accel(reading: AccelReading):
    global _latest_accel
    _latest_accel = reading


def get_latest_gps() -> GPSReading:
    return _latest_gps


def get_latest_accel() -> AccelReading:
    return _latest_accel


# --- GPS ---

@router.get("/gps/latest", response_model=GPSReading)
def gps_latest():
    return _latest_gps


@router.post("/gps/manual", response_model=GPSReading)
def gps_manual(data: ManualGPSInput):
    global _latest_gps
    if USE_MOCK_SENSORS:
        from app.sensors.mock import gps_set
        gps_set(data.latitude, data.longitude, data.altitude, data.speed_kmh)
    _latest_gps = GPSReading(
        latitude=data.latitude,
        longitude=data.longitude,
        altitude=data.altitude,
        speed_kmh=data.speed_kmh,
        fix=True,
        timestamp=datetime.now(timezone.utc),
    )
    return _latest_gps


# --- Accelerometer ---

@router.get("/accelerometer/latest", response_model=AccelReading)
def accel_latest():
    return _latest_accel


@router.post("/accelerometer/manual", response_model=AccelReading)
def accel_manual(data: ManualAccelInput):
    global _latest_accel
    mag = math.sqrt(data.ax**2 + data.ay**2 + data.az**2)
    if USE_MOCK_SENSORS:
        from app.sensors.mock import accel_set
        accel_set(data.ax, data.ay, data.az)
    _latest_accel = AccelReading(
        ax=data.ax, ay=data.ay, az=data.az,
        magnitude=round(mag, 4),
        is_moving=mag > 1.2,
        timestamp=datetime.now(timezone.utc),
    )
    return _latest_accel


# --- Buzzer ---

@router.post("/buzzer/trigger", response_model=BuzzerStatus)
def buzzer_trigger(req: BuzzerTriggerRequest):
    def check_moving():
        return _latest_accel.is_moving

    return buzzer_buzz_impl(duration_ms=req.duration_ms, check_moving_fn=check_moving)


@router.post("/buzzer/stop")
def buzzer_stop():
    buzzer_stop_impl()
    return {"status": "silenced"}


@router.get("/buzzer/status", response_model=BuzzerStatus)
def buzzer_status():
    return BuzzerStatus(active=buzzer_is_active_impl())


# --- OLED ---

@router.post("/oled/message", response_model=OLEDStatus)
def oled_message(req: OLEDMessageRequest):
    oled_show_impl(req.line1, req.line2, req.line3)
    return oled_get_status_impl()


@router.post("/oled/alert", response_model=OLEDStatus)
def oled_alert(req: OLEDAlertRequest):
    oled_show_alert_impl(req.alert_type, req.severity)
    return oled_get_status_impl()


@router.get("/oled/status", response_model=OLEDStatus)
def oled_status():
    return oled_get_status_impl()


# --- System ---

system_router = APIRouter(prefix="/api/system", tags=["System"])


@system_router.get("/status", response_model=SystemStatus)
def system_status():
    return SystemStatus(
        gps=_latest_gps,
        accelerometer=_latest_accel,
        buzzer=BuzzerStatus(active=buzzer_is_active_impl()),
        oled=oled_get_status_impl(),
        is_moving=_latest_accel.is_moving,
    )


@system_router.get("/is-moving")
def system_is_moving():
    return {"is_moving": _latest_accel.is_moving, "magnitude": _latest_accel.magnitude}


@system_router.get("/health")
def system_health():
    return {"status": "ok", "mock_mode": USE_MOCK_SENSORS}
