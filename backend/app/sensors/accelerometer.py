"""Accelerometer sensor module — MPU-6050 via I2C."""

import logging
import math
from datetime import datetime, timezone

import smbus2

from app.config import MPU6050_I2C_ADDRESS, ACCEL_MOVING_THRESHOLD
from app.models.schemas import AccelReading

logger = logging.getLogger(__name__)

_bus: smbus2.SMBus | None = None

# MPU-6050 registers
_PWR_MGMT_1 = 0x6B
_ACCEL_XOUT_H = 0x3B


def _get_bus() -> smbus2.SMBus:
    global _bus
    if _bus is None:
        _bus = smbus2.SMBus(1)
        # Wake up from sleep mode
        _bus.write_byte_data(MPU6050_I2C_ADDRESS, _PWR_MGMT_1, 0)
    return _bus


def _read_raw(addr: int) -> int:
    bus = _get_bus()
    high = bus.read_byte_data(MPU6050_I2C_ADDRESS, addr)
    low = bus.read_byte_data(MPU6050_I2C_ADDRESS, addr + 1)
    value = (high << 8) | low
    if value >= 0x8000:
        value -= 0x10000
    return value


def read() -> AccelReading:
    """Read accelerometer X, Y, Z and compute magnitude."""
    try:
        raw_x = _read_raw(_ACCEL_XOUT_H)
        raw_y = _read_raw(_ACCEL_XOUT_H + 2)
        raw_z = _read_raw(_ACCEL_XOUT_H + 4)

        # Convert to g (default sensitivity ±2g → 16384 LSB/g)
        ax = raw_x / 16384.0
        ay = raw_y / 16384.0
        az = raw_z / 16384.0

        magnitude = math.sqrt(ax**2 + ay**2 + az**2)
        moving = magnitude > ACCEL_MOVING_THRESHOLD

        return AccelReading(
            ax=round(ax, 4),
            ay=round(ay, 4),
            az=round(az, 4),
            magnitude=round(magnitude, 4),
            is_moving=moving,
            timestamp=datetime.now(timezone.utc),
        )
    except Exception as e:
        logger.error("MPU-6050 read error: %s", e)
        return AccelReading()


def is_moving() -> bool:
    return read().is_moving


def cleanup():
    global _bus
    if _bus:
        _bus.close()
        _bus = None
