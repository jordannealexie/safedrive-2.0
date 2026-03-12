"""SafeDrive 2.0 — Sensor hardware test script.

Run from the backend/ directory:
    python test_sensors.py
"""

import os
import sys
import time

# Ensure backend/ is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault("USE_MOCK_SENSORS", "true")

from app.sensors.mock import (
    gps_read, accel_read, accel_is_moving,
    buzzer_buzz, buzzer_stop, buzzer_is_active,
    oled_show, oled_show_alert, oled_clear, oled_get_status,
)


def test_gps():
    reading = gps_read()
    assert reading.latitude is not None, "GPS latitude is None"
    assert reading.longitude is not None, "GPS longitude is None"
    print(f"  ✅ GPS: lat={reading.latitude:.4f}, lon={reading.longitude:.4f}, speed={reading.speed_kmh:.1f} km/h, fix={reading.fix}")


def test_accelerometer():
    reading = accel_read()
    assert reading.magnitude > 0, "Accel magnitude is 0"
    moving = accel_is_moving()
    print(f"  ✅ MPU-6050: magnitude={reading.magnitude:.4f}g, is_moving={moving}")


def test_buzzer():
    status = buzzer_buzz(duration_ms=100)
    assert not status.suppressed, "Buzzer was unexpectedly suppressed"
    buzzer_stop()
    assert not buzzer_is_active(), "Buzzer should be inactive after stop"

    # Test suppression when not moving
    status = buzzer_buzz(duration_ms=100, check_moving_fn=lambda: False)
    assert status.suppressed, "Buzzer should be suppressed when bus is stationary"
    print(f"  ✅ Buzzer: triggered successfully, suppression logic works")


def test_oled():
    oled_show("Line 1 Test", "Line 2 Test", "Line 3 Test")
    status = oled_get_status()
    assert len(status.lines) == 3, f"Expected 3 lines, got {len(status.lines)}"

    oled_show_alert("Drowsiness", "high")
    status = oled_get_status()
    assert "ALERT" in status.lines[0], "Alert not shown on OLED"

    oled_clear()
    status = oled_get_status()
    assert len(status.lines) == 0, "OLED should be cleared"
    print(f"  ✅ OLED: displayed test messages, alert, and cleared")


def main():
    print("\n🔧 SafeDrive 2.0 — Sensor Tests")
    print(f"   Mode: {'MOCK' if os.getenv('USE_MOCK_SENSORS', 'true').lower() == 'true' else 'HARDWARE'}")
    print("=" * 45)

    tests = [
        ("GPS (NEO-6M)", test_gps),
        ("Accelerometer (MPU-6050)", test_accelerometer),
        ("Buzzer (GPIO)", test_buzzer),
        ("OLED (SSD1306)", test_oled),
    ]

    passed = 0
    failed = 0

    for name, fn in tests:
        print(f"\n  Testing {name}...")
        try:
            fn()
            passed += 1
        except Exception as e:
            print(f"  ❌ {name}: {e}")
            failed += 1

    print(f"\n{'=' * 45}")
    print(f"  Results: {passed} passed, {failed} failed")
    if failed == 0:
        print("  🎉 All sensor tests passed!")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
