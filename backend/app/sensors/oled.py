"""OLED display module — reads state from safedrive_ai shared file.

The physical OLED is controlled by the safedrive_ai drowsiness
detection program.  This module does NOT write to SPI hardware.
Instead it reads /tmp/safedrive_oled_state.json written by that
program and exposes the data through the API.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from app.models.schemas import OLEDStatus

logger = logging.getLogger(__name__)

STATE_FILE = Path("/tmp/safedrive_oled_state.json")

# In-memory fallback used for manual input and when state file is absent
_current_lines: list[str] = ["Waiting for prototype…"]


def _read_state_file() -> dict | None:
    """Read the shared OLED state written by safedrive_ai."""
    try:
        if STATE_FILE.exists():
            data = json.loads(STATE_FILE.read_text())
            return data
    except Exception as e:
        logger.debug("Could not read OLED state file: %s", e)
    return None


def show_status(line1: str = "", line2: str = "", line3: str = ""):
    """Manual override — updates in-memory lines only (no hardware)."""
    global _current_lines
    _current_lines = [l for l in [line1, line2, line3] if l]
    if not _current_lines:
        _current_lines = ["SafeDrive Ready"]


def show_alert(alert_type: str, severity: str = "medium"):
    global _current_lines
    icon = "!!" if severity == "high" else "!" if severity == "medium" else "i"
    _current_lines = [f"[{icon}] ALERT", alert_type, f"Severity: {severity.upper()}"]


def clear():
    global _current_lines
    _current_lines = []


def get_status() -> OLEDStatus:
    """Return OLED state — prefer safedrive_ai shared file, fall back to manual."""
    state = _read_state_file()
    if state:
        lines = [
            f"SafeDrive  {state.get('fps', 0):.0f}fps",
            state.get("drowsiness_state", "ALERT"),
            f"EAR:{state.get('ear_value', 0):.3f}",
            f"DRV:{state.get('driver_id', 'UNKNOWN')[:12]}",
            f"{state.get('speed_kmh', 0):.0f}km/h  {'Mov' if state.get('is_moving') else 'Stp'}",
        ]
        return OLEDStatus(
            current_message=" | ".join(lines),
            lines=lines,
            last_updated=datetime.now(timezone.utc),
            raw=state,
        )
    return OLEDStatus(
        current_message=" | ".join(_current_lines) if _current_lines else "Waiting for prototype…",
        lines=_current_lines,
        last_updated=datetime.now(timezone.utc),
    )


def cleanup():
    pass
