from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GPSReading(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    speed_kmh: Optional[float] = None
    fix: bool = False
    satellites: Optional[int] = None
    timestamp: datetime = datetime.now()


class AccelReading(BaseModel):
    ax: float = 0.0
    ay: float = 0.0
    az: float = 0.0
    magnitude: float = 0.0
    is_moving: bool = False
    timestamp: datetime = datetime.now()


class BuzzerStatus(BaseModel):
    active: bool = False
    last_triggered: Optional[datetime] = None
    suppressed: bool = False
    suppression_reason: Optional[str] = None


class OLEDStatus(BaseModel):
    current_message: str = "SafeDrive Ready"
    lines: list[str] = []
    last_updated: datetime = datetime.now()
    raw: Optional[dict] = None


class SystemStatus(BaseModel):
    gps: GPSReading
    accelerometer: AccelReading
    buzzer: BuzzerStatus
    oled: OLEDStatus
    is_moving: bool = False


class BuzzerTriggerRequest(BaseModel):
    duration_ms: int = 500
    pattern: Optional[list[tuple[int, int]]] = None


class OLEDMessageRequest(BaseModel):
    line1: str = ""
    line2: str = ""
    line3: str = ""


class OLEDAlertRequest(BaseModel):
    alert_type: str
    severity: str = "medium"


class ManualGPSInput(BaseModel):
    latitude: float
    longitude: float
    altitude: float = 0.0
    speed_kmh: float = 0.0


class ManualAccelInput(BaseModel):
    ax: float
    ay: float
    az: float
