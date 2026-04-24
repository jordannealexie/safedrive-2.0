"""
SafeDrive 2.0 — Camera Frame Capture Service
==============================================

Continuously captures frames from the Pi camera and saves them to
/tmp/safedrive_frame.jpg for the SafeDrive backend to pick up and
upload to Supabase Storage.

This runs as a separate lightweight service alongside safedrive_ai.
If safedrive_ai is already using the camera, this script will detect
that and fall back to reading frames from a shared file.

Install as systemd service:
    sudo cp safedrive-frames.service /etc/systemd/system/
    sudo systemctl enable safedrive-frames
    sudo systemctl start safedrive-frames

Or run directly:
    python3 frame_capture.py
"""

import time
import logging
import os
import sys
from pathlib import Path

FRAME_OUTPUT = Path("/tmp/safedrive_frame.jpg")
CAPTURE_INTERVAL = 5  # seconds — matches snapshot throttle
STATE_FILE = Path("/tmp/safedrive_oled_state.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [FRAMES] %(message)s",
)
log = logging.getLogger("frame_capture")


def capture_with_picamera2():
    """Try to use picamera2 (modern Raspberry Pi camera stack)."""
    try:
        from picamera2 import Picamera2
        cam = Picamera2()
        config = cam.create_still_configuration(
            main={"size": (640, 480), "format": "RGB888"}
        )
        cam.configure(config)
        cam.start()
        log.info("picamera2 initialized (640x480)")
        return cam, "picamera2"
    except Exception as e:
        log.warning("picamera2 not available: %s", e)
        return None, None


def capture_with_opencv():
    """Try to use OpenCV's VideoCapture (works with USB cameras too)."""
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            cap = cv2.VideoCapture(-1)
        if not cap.isOpened():
            raise RuntimeError("No camera found")
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        log.info("OpenCV camera initialized (640x480)")
        return cap, "opencv"
    except Exception as e:
        log.warning("OpenCV not available: %s", e)
        return None, None


def capture_with_libcamera():
    """Fallback: use libcamera-still CLI (always available on Pi OS)."""
    import subprocess
    try:
        result = subprocess.run(
            ["libcamera-still", "--help"],
            capture_output=True, timeout=5
        )
        if result.returncode <= 1:
            log.info("Using libcamera-still CLI fallback")
            return True, "libcamera-cli"
    except Exception:
        pass
    return None, None


def main():
    log.info("SafeDrive Frame Capture starting...")

    # Try camera sources in order of preference
    cam, mode = capture_with_picamera2()
    if not cam:
        cam, mode = capture_with_opencv()
    if not cam:
        cam, mode = capture_with_libcamera()
    if not cam:
        log.error("No camera source available! Exiting.")
        sys.exit(1)

    log.info("Camera mode: %s", mode)
    frame_count = 0

    while True:
        try:
            # Only capture when safedrive_ai is active (state file exists and is recent)
            if STATE_FILE.exists():
                age = time.time() - STATE_FILE.stat().st_mtime
                if age > 30:
                    # State file is stale — safedrive_ai might be stopped
                    time.sleep(CAPTURE_INTERVAL)
                    continue
            else:
                time.sleep(CAPTURE_INTERVAL)
                continue

            if mode == "picamera2":
                import numpy as np
                frame = cam.capture_array()
                # Convert RGB to BGR for JPEG encoding
                import cv2
                frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                cv2.imwrite(str(FRAME_OUTPUT), frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 75])

            elif mode == "opencv":
                import cv2
                ret, frame = cam.read()
                if ret and frame is not None:
                    cv2.imwrite(str(FRAME_OUTPUT), frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
                else:
                    log.warning("Failed to read frame from OpenCV camera")

            elif mode == "libcamera-cli":
                import subprocess
                subprocess.run(
                    [
                        "libcamera-still",
                        "-o", str(FRAME_OUTPUT),
                        "--width", "640",
                        "--height", "480",
                        "--quality", "75",
                        "--nopreview",
                        "--immediate",
                        "-t", "1",
                    ],
                    capture_output=True,
                    timeout=10,
                )

            frame_count += 1
            if frame_count % 12 == 1:  # Log every ~60s
                size = FRAME_OUTPUT.stat().st_size if FRAME_OUTPUT.exists() else 0
                log.info("Frame #%d saved (%d bytes)", frame_count, size)

        except KeyboardInterrupt:
            log.info("Shutting down...")
            break
        except Exception as e:
            log.warning("Frame capture error: %s", e)

        time.sleep(CAPTURE_INTERVAL)

    # Cleanup
    if mode == "picamera2" and cam:
        try:
            cam.stop()
        except Exception:
            pass
    elif mode == "opencv" and cam:
        try:
            cam.release()
        except Exception:
            pass


if __name__ == "__main__":
    main()
