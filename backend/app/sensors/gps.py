"""GPS sensor module — NEO-6M via UART."""

import logging
from datetime import datetime, timezone

import serial
import pynmea2

from app.config import GPS_SERIAL_PORT, GPS_BAUD_RATE
from app.models.schemas import GPSReading

logger = logging.getLogger(__name__)

_ser: serial.Serial | None = None
_last_reading = GPSReading()


def _get_serial() -> serial.Serial:
    global _ser
    if _ser is None or not _ser.is_open:
        _ser = serial.Serial(GPS_SERIAL_PORT, GPS_BAUD_RATE, timeout=1)
    return _ser


def read() -> GPSReading:
    """Read one NMEA sentence and return parsed GPS data."""
    global _last_reading
    try:
        ser = _get_serial()
        line = ser.readline().decode("ascii", errors="replace").strip()
        if not line:
            return _last_reading

        msg = pynmea2.parse(line)
        if isinstance(msg, pynmea2.types.talker.GGA):
            _last_reading = GPSReading(
                latitude=msg.latitude if msg.latitude else _last_reading.latitude,
                longitude=msg.longitude if msg.longitude else _last_reading.longitude,
                altitude=float(msg.altitude) if msg.altitude else _last_reading.altitude,
                speed_kmh=_last_reading.speed_kmh,
                fix=msg.gps_qual > 0,
                satellites=int(msg.num_sats) if msg.num_sats else None,
                timestamp=datetime.now(timezone.utc),
            )
        elif isinstance(msg, pynmea2.types.talker.RMC):
            speed_knots = float(msg.spd_over_grnd) if msg.spd_over_grnd else 0.0
            _last_reading = GPSReading(
                latitude=msg.latitude if msg.latitude else _last_reading.latitude,
                longitude=msg.longitude if msg.longitude else _last_reading.longitude,
                altitude=_last_reading.altitude,
                speed_kmh=round(speed_knots * 1.852, 2),
                fix=msg.status == "A",
                satellites=_last_reading.satellites,
                timestamp=datetime.now(timezone.utc),
            )
    except serial.SerialException as e:
        logger.error("GPS serial error: %s", e)
    except pynmea2.ParseError as e:
        logger.warning("GPS parse error: %s", e)

    return _last_reading


def cleanup():
    global _ser
    if _ser and _ser.is_open:
        _ser.close()
        _ser = None
