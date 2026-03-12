"""Settings API — persists configuration to a JSON file and Supabase."""

import os
import json
import logging
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/settings", tags=["Settings"])

SETTINGS_FILE = Path("/home/raspi4b/SafeDrive/settings.json")
_log = logging.getLogger(__name__)

# Supabase client (optional)
_sb = None
try:
    from supabase import create_client
    _sb = create_client(
        os.environ.get("SUPABASE_URL", "https://idlpmawnxqihjjaqzaky.supabase.co"),
        os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHBtYXdueHFpaGpqYXF6YWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDYyNzgsImV4cCI6MjA4ODg4MjI3OH0.blj6SUvha9Hk8ZXXdB8awCeanEQ4RWcNyMnQk40KxjE"),
    )
except Exception:
    pass

DEFAULTS = {
    "general": {
        "timezone": "Local",
        "temperatureUnit": "Celsius",
        "compactDashboard": False,
        "highContrast": True,
    },
    "alertThresholds": {
        "drowsinessConfidence": 75,
        "continuousDrowsinessDuration": 3,
        "baselineDeviationThreshold": 30,
        "motionRequirement": True,
    },
    "notifications": {
        "vehicleBuzzer": True,
        "oledDisplay": True,
        "previewMessage": "WAKE UP! TAKE A BREAK",
        "browserAudio": False,
        "emailSummaries": True,
    },
    "driverRules": {
        "maxContinuousDriving": 4,
        "mandatoryRestingBlock": 15,
        "alertGracePeriod": 10,
    },
}


def _load() -> dict:
    if SETTINGS_FILE.exists():
        try:
            return json.loads(SETTINGS_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return dict(DEFAULTS)


def _save(data: dict):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(data, indent=2))
    # Sync to Supabase
    if _sb:
        try:
            _sb.table("settings").upsert({"id": 1, "data": data}).execute()
        except Exception as e:
            _log.warning("Failed to sync settings to Supabase: %s", e)


@router.get("")
def get_settings():
    return _load()


@router.put("")
def update_settings(body: dict):
    current = _load()
    for section, values in body.items():
        if section in current and isinstance(values, dict):
            current[section].update(values)
        else:
            current[section] = values
    _save(current)
    return current


@router.put("/{section}")
def update_section(section: str, body: dict):
    current = _load()
    if section not in current:
        current[section] = {}
    current[section].update(body)
    _save(current)
    return current[section]
