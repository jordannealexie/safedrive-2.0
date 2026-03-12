"""Deploy OLED fix + safedrive_ai integration.

1. Upload updated backend files (no OLED hardware writes)
2. Patch safedrive_ai's oled_display.py to write state file
3. Restart both services
"""
import paramiko
import os

PI_HOST = "192.168.1.14"
PI_USER = "raspi4b"
PI_PASS = "raspi4b"
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")
PI_SAFEDRIVE = "/home/raspi4b/SafeDrive/backend"
PI_AI_DIR = "/home/raspi4b/safedrive_ai"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS)
sftp = ssh.open_sftp()

# --- Step 1: Upload our updated backend files ---
files_to_upload = [
    ("app/main.py", f"{PI_SAFEDRIVE}/app/main.py"),
    ("app/sensors/oled.py", f"{PI_SAFEDRIVE}/app/sensors/oled.py"),
    ("app/models/schemas.py", f"{PI_SAFEDRIVE}/app/models/schemas.py"),
]

for local_rel, remote in files_to_upload:
    local = os.path.join(BACKEND_DIR, local_rel)
    print(f"Uploading {local_rel} -> {remote}")
    sftp.put(local, remote)

# --- Step 2: Patch safedrive_ai's oled_display.py ---
# Add a _write_state_file() method that writes display state to JSON
# We inject it by adding code to the update_data and show_alert methods

PATCH_CODE = '''
# --- SafeDrive 2.0 integration patch ---
import json as _json
from pathlib import Path as _Path

_STATE_FILE = _Path("/tmp/safedrive_oled_state.json")

_original_update_data = OLEDDisplay.update_data
_original_show_alert = OLEDDisplay.show_alert

def _patched_update_data(self, data):
    _original_update_data(self, data)
    try:
        state = {
            "driver_id": data.driver_id,
            "drowsiness_state": data.drowsiness_state,
            "ear_value": data.ear_value,
            "gps_valid": data.gps_valid,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "speed_kmh": data.speed_kmh,
            "is_moving": data.is_moving,
            "fps": data.fps,
            "alert_message": data.alert_message,
            "alert_priority": data.alert_priority,
            "timestamp": __import__("time").time(),
        }
        _STATE_FILE.write_text(_json.dumps(state))
    except Exception:
        pass

def _patched_show_alert(self, message, priority=1, duration=3.0):
    _original_show_alert(self, message, priority, duration)
    try:
        with self._data_lock:
            d = self._current_data
        state = {
            "driver_id": d.driver_id,
            "drowsiness_state": d.drowsiness_state,
            "ear_value": d.ear_value,
            "gps_valid": d.gps_valid,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "speed_kmh": d.speed_kmh,
            "is_moving": d.is_moving,
            "fps": d.fps,
            "alert_message": message,
            "alert_priority": priority,
            "timestamp": __import__("time").time(),
        }
        _STATE_FILE.write_text(_json.dumps(state))
    except Exception:
        pass

OLEDDisplay.update_data = _patched_update_data
OLEDDisplay.show_alert = _patched_show_alert
# --- End SafeDrive 2.0 integration patch ---
'''

# Read current oled_display.py
remote_oled = f"{PI_AI_DIR}/hardware/oled_display.py"
print(f"\nReading {remote_oled}...")
with sftp.open(remote_oled, "r") as f:
    current_content = f.read().decode()

PATCH_MARKER = "# --- SafeDrive 2.0 integration patch ---"
if PATCH_MARKER in current_content:
    print("Patch already applied, skipping")
else:
    print("Applying patch to oled_display.py...")
    patched = current_content + "\n\n" + PATCH_CODE
    with sftp.open(remote_oled, "w") as f:
        f.write(patched)
    print("Patch applied!")

sftp.close()

# --- Step 3: Kill our old server and restart ---
print("\nRestarting our FastAPI server...")
stdin, stdout, stderr = ssh.exec_command(
    "pkill -f 'uvicorn app.main:app' || true"
)
stdout.read()

# Start server in background
transport = ssh.get_transport()
channel = transport.open_session()
channel.exec_command(
    f"cd {PI_SAFEDRIVE} && nohup /home/raspi4b/SafeDrive/venv/bin/python "
    f"-m uvicorn app.main:app --host 0.0.0.0 --port 8000 "
    f"> /home/raspi4b/SafeDrive/server.log 2>&1 &"
)
import time
time.sleep(3)

# Verify server is running
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/")
print("Server check:", stdout.read().decode())

# --- Step 4: Restart safedrive_ai service ---
print("\nRestarting safedrive_ai service (to pick up the OLED patch)...")
stdin, stdout, stderr = ssh.exec_command("sudo systemctl restart safedrive.service")
out = stdout.read().decode()
err = stderr.read().decode()
print(f"stdout: {out}")
print(f"stderr: {err}")

time.sleep(5)

# Check safedrive_ai service
stdin, stdout, stderr = ssh.exec_command("sudo systemctl status safedrive.service --no-pager -l")
print("\nsafedrive.service status:")
print(stdout.read().decode()[:2000])

# Check if state file exists
stdin, stdout, stderr = ssh.exec_command("cat /tmp/safedrive_oled_state.json 2>/dev/null || echo 'NOT FOUND'")
print("\nState file:", stdout.read().decode())

# Check our server log
stdin, stdout, stderr = ssh.exec_command("tail -5 /home/raspi4b/SafeDrive/server.log")
print("\nOur server log:")
print(stdout.read().decode())

ssh.close()
print("\nDone!")
