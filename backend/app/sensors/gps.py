"""GPS sensor module — NEO-6M via UART."""

import logging
from datetime import datetime, timezone, timedelta

import serial
import pynmea2

from app.config import GPS_SERIAL_PORT, GPS_BAUD_RATE
from app.models.schemas import GPSReading

logger = logging.getLogger(__name__)

_ser: serial.Serial | None = None
_last_reading = GPSReading()
_SERIAL_PORT_CANDIDATES = [GPS_SERIAL_PORT, "/dev/serial0", "/dev/ttyAMA0", "/dev/ttyS0"]
_STALE_SECONDS = 10


def _unique_ports() -> list[str]:
    seen: set[str] = set()
    ports: list[str] = []
    for port in _SERIAL_PORT_CANDIDATES:
        if port and port not in seen:
            ports.append(port)
            seen.add(port)
    return ports


def _safe_int(value: str | None) -> int | None:
    if not value:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _is_stale(reading: GPSReading) -> bool:
    return datetime.now(timezone.utc) - reading.timestamp > timedelta(seconds=_STALE_SECONDS)


def _get_serial() -> serial.Serial:
    global _ser
    if _ser is not None and _ser.is_open:
        return _ser

    last_err: Exception | None = None
    for port in _unique_ports():
        try:
            _ser = serial.Serial(port, GPS_BAUD_RATE, timeout=1)
            logger.info("GPS serial opened on %s @ %s", port, GPS_BAUD_RATE)
            return _ser
        except serial.SerialException as e:
            last_err = e
            logger.warning("GPS serial open failed on %s: %s", port, e)

    if last_err:
        raise last_err
    raise serial.SerialException("No GPS serial port candidates configured")


def _apply_stale_guard(reading: GPSReading) -> GPSReading:
    if reading.fix:
        return reading
    if not _is_stale(reading):
        return reading
    return GPSReading(
        latitude=None,
        longitude=None,
        altitude=reading.altitude,
        speed_kmh=0.0,
        fix=False,
        satellites=reading.satellites,
        timestamp=reading.timestamp,
    )


def _parse_nmea(line: str, base: GPSReading) -> GPSReading:
    now = datetime.now(timezone.utc)
    msg = pynmea2.parse(line)

    if isinstance(msg, pynmea2.types.talker.GGA):
        has_fix = (_safe_int(msg.gps_qual) or 0) > 0
        return GPSReading(
            latitude=msg.latitude if has_fix and msg.latitude else base.latitude,
            longitude=msg.longitude if has_fix and msg.longitude else base.longitude,
            altitude=float(msg.altitude) if msg.altitude else base.altitude,
            speed_kmh=base.speed_kmh,
            fix=has_fix,
            satellites=_safe_int(msg.num_sats) if has_fix else base.satellites,
            timestamp=now,
        )

    if isinstance(msg, pynmea2.types.talker.RMC):
        has_fix = msg.status == "A"
        speed_knots = float(msg.spd_over_grnd) if msg.spd_over_grnd else 0.0
        return GPSReading(
            latitude=msg.latitude if has_fix and msg.latitude else base.latitude,
            longitude=msg.longitude if has_fix and msg.longitude else base.longitude,
            altitude=base.altitude,
            speed_kmh=round(speed_knots * 1.852, 2),
            fix=has_fix,
            satellites=base.satellites,
            timestamp=now,
        )

    return base


def read() -> GPSReading:
    """Read several NMEA sentences and return the freshest GPS data."""
    global _last_reading
    try:
        ser = _get_serial()
        updated = _last_reading
        parsed_any = False

        for _ in range(8):
            line = ser.readline().decode("ascii", errors="replace").strip()
            if not line or not line.startswith("$"):
                continue
            try:
                next_reading = _parse_nmea(line, updated)
                if next_reading is not updated:
                    updated = next_reading
                    parsed_any = True
            except pynmea2.ParseError as e:
                logger.warning("GPS parse error: %s", e)

        if parsed_any:
            _last_reading = updated
        _last_reading = _apply_stale_guard(_last_reading)
    except serial.SerialException as e:
        logger.error("GPS serial error: %s", e)
        _last_reading = _apply_stale_guard(_last_reading)

    return _last_reading


def cleanup():
    global _ser
    if _ser and _ser.is_open:
        _ser.close()
        _ser = None
