"""SafeDrive 2.0 — FastAPI backend."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import USE_MOCK_SENSORS
from app.sensors import gps_read_impl, accel_read_impl
from app.routers.sensors import router as sensors_router, system_router, update_latest_gps, update_latest_accel
from app.routers.ws import router as ws_router
from app.routers.domain import router as domain_router
from app.routers.settings import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

_bg_tasks: list[asyncio.Task] = []


async def _poll_gps():
    while True:
        try:
            reading = gps_read_impl()
            update_latest_gps(reading)
        except Exception as e:
            logger.error("GPS poll error: %s", e)
        await asyncio.sleep(1)


async def _poll_accel():
    while True:
        try:
            reading = accel_read_impl()
            update_latest_accel(reading)
        except Exception as e:
            logger.error("Accel poll error: %s", e)
        await asyncio.sleep(0.5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SafeDrive 2.0 starting — mock_mode=%s", USE_MOCK_SENSORS)
    _bg_tasks.append(asyncio.create_task(_poll_gps()))
    _bg_tasks.append(asyncio.create_task(_poll_accel()))
    yield
    logger.info("SafeDrive 2.0 shutting down")
    for task in _bg_tasks:
        task.cancel()
    if not USE_MOCK_SENSORS:
        from app.sensors.gps import cleanup as gps_cleanup
        from app.sensors.accelerometer import cleanup as accel_cleanup
        from app.sensors.buzzer import cleanup as buzzer_cleanup
        from app.sensors.oled import cleanup as oled_cleanup
        gps_cleanup()
        accel_cleanup()
        buzzer_cleanup()
        oled_cleanup()


app = FastAPI(
    title="SafeDrive 2.0 API",
    description="Raspberry Pi driver drowsiness detection system",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors_router)
app.include_router(system_router)
app.include_router(ws_router)
app.include_router(domain_router)
app.include_router(settings_router)


@app.get("/")
def root():
    return {"name": "SafeDrive 2.0", "version": "2.0.0", "mock_mode": USE_MOCK_SENSORS}
