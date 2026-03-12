"""Core safety logic — alarm decision engine."""

import logging
from app.models.schemas import AccelReading

logger = logging.getLogger(__name__)


def should_trigger_alarm(accel_reading: AccelReading, alert_event: dict | None = None) -> bool:
    """
    Returns True only if:
    - Bus is currently moving (accel magnitude > threshold)
    - An alert condition exists (drowsiness, fatigue, etc.)
    """
    if alert_event is None:
        return False

    if not accel_reading.is_moving:
        logger.info(
            "Alarm suppressed — bus stationary (magnitude=%.4f). Alert: %s",
            accel_reading.magnitude,
            alert_event.get("type", "unknown"),
        )
        return False

    logger.warning(
        "Alarm TRIGGERED — bus moving (magnitude=%.4f). Alert type: %s",
        accel_reading.magnitude,
        alert_event.get("type", "unknown"),
    )
    return True
