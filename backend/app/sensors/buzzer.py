"""Buzzer module — Active buzzer via GPIO."""

import logging
import time
import threading
from datetime import datetime, timezone

import RPi.GPIO as GPIO

from app.config import BUZZER_GPIO_PIN
from app.models.schemas import BuzzerStatus

logger = logging.getLogger(__name__)

_initialized = False
_active = False
_last_triggered: datetime | None = None
_lock = threading.Lock()


def _init():
    global _initialized
    if not _initialized:
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(BUZZER_GPIO_PIN, GPIO.OUT, initial=GPIO.LOW)
        _initialized = True


def buzz(duration_ms: int = 500, check_moving_fn=None) -> BuzzerStatus:
    """Activate buzzer. If check_moving_fn provided and returns False, suppress."""
    global _active, _last_triggered

    if check_moving_fn and not check_moving_fn():
        logger.info("Buzzer suppressed — bus is stationary")
        return BuzzerStatus(
            active=False,
            last_triggered=_last_triggered,
            suppressed=True,
            suppression_reason="Bus stationary — alarm suppressed",
        )

    _init()
    with _lock:
        _active = True
        _last_triggered = datetime.now(timezone.utc)
        GPIO.output(BUZZER_GPIO_PIN, GPIO.HIGH)
        time.sleep(duration_ms / 1000.0)
        GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)
        _active = False

    return BuzzerStatus(active=False, last_triggered=_last_triggered)


def buzz_pattern(pattern: list[tuple[int, int]], check_moving_fn=None) -> BuzzerStatus:
    """Play a pattern of (on_ms, off_ms) pairs."""
    global _active, _last_triggered

    if check_moving_fn and not check_moving_fn():
        logger.info("Buzzer pattern suppressed — bus is stationary")
        return BuzzerStatus(
            active=False,
            last_triggered=_last_triggered,
            suppressed=True,
            suppression_reason="Bus stationary — alarm suppressed",
        )

    _init()
    with _lock:
        _active = True
        _last_triggered = datetime.now(timezone.utc)
        for on_ms, off_ms in pattern:
            GPIO.output(BUZZER_GPIO_PIN, GPIO.HIGH)
            time.sleep(on_ms / 1000.0)
            GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)
            time.sleep(off_ms / 1000.0)
        _active = False

    return BuzzerStatus(active=False, last_triggered=_last_triggered)


def stop():
    """Immediately silence the buzzer."""
    global _active
    _init()
    with _lock:
        GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)
        _active = False


def is_active() -> bool:
    return _active


def get_status() -> BuzzerStatus:
    return BuzzerStatus(active=_active, last_triggered=_last_triggered)


def cleanup():
    global _initialized
    if _initialized:
        GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)
        GPIO.cleanup(BUZZER_GPIO_PIN)
        _initialized = False
