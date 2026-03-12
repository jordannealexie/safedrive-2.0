"""WebSocket endpoint — streams live sensor data to the frontend."""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.routers.sensors import get_latest_gps, get_latest_accel
from app.sensors import buzzer_is_active_impl, oled_get_status_impl

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            gps = get_latest_gps()
            accel = get_latest_accel()
            oled = oled_get_status_impl()

            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "gps": {
                    "latitude": gps.latitude,
                    "longitude": gps.longitude,
                    "altitude": gps.altitude,
                    "speed_kmh": gps.speed_kmh,
                    "fix": gps.fix,
                    "satellites": gps.satellites,
                },
                "accelerometer": {
                    "ax": accel.ax,
                    "ay": accel.ay,
                    "az": accel.az,
                    "magnitude": accel.magnitude,
                    "is_moving": accel.is_moving,
                },
                "buzzer": {
                    "active": buzzer_is_active_impl(),
                },
                "oled": {
                    "current_message": oled.current_message,
                    "lines": oled.lines,
                    "raw": oled.raw,
                },
                "is_moving": accel.is_moving,
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
