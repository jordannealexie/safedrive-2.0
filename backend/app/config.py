import os
from dotenv import load_dotenv

load_dotenv()

USE_MOCK_SENSORS = os.getenv("USE_MOCK_SENSORS", "true").lower() == "true"

BUZZER_GPIO_PIN = int(os.getenv("BUZZER_GPIO_PIN", "17"))

GPS_SERIAL_PORT = os.getenv("GPS_SERIAL_PORT", "/dev/ttyAMA0")
GPS_BAUD_RATE = int(os.getenv("GPS_BAUD_RATE", "9600"))

MPU6050_I2C_ADDRESS = int(os.getenv("MPU6050_I2C_ADDRESS", "0x68"), 16)
OLED_I2C_ADDRESS = int(os.getenv("OLED_I2C_ADDRESS", "0x3C"), 16)

ACCEL_MOVING_THRESHOLD = float(os.getenv("ACCEL_MOVING_THRESHOLD", "1.2"))

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
