"""SafeDrive 2.0 — WiFi and API connectivity test.

Run from the backend/ directory:
    python test_wifi.py
"""

import os
import sys
import socket
import urllib.request
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))


def get_local_ip():
    """Get the Pi's local IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def test_api_reachable():
    url = f"http://127.0.0.1:{API_PORT}/api/system/health"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        return None


def main():
    print("\n🌐 SafeDrive 2.0 — WiFi & API Test")
    print("=" * 45)

    ip = get_local_ip()
    print(f"  Local IP: {ip}")
    print(f"  API URL:  http://{ip}:{API_PORT}")
    print(f"  Swagger:  http://{ip}:{API_PORT}/docs")

    print(f"\n  Checking API at http://127.0.0.1:{API_PORT}...")
    health = test_api_reachable()
    if health:
        print(f"  ✅ API is reachable: {health}")
        print(f"\n  Frontend .env.local should contain:")
        print(f"    NEXT_PUBLIC_API_URL=http://{ip}:{API_PORT}")
        print(f"    NEXT_PUBLIC_WS_URL=ws://{ip}:{API_PORT}")
    else:
        print(f"  ❌ API is not reachable at port {API_PORT}")
        print(f"     Start it with: uvicorn app.main:app --host 0.0.0.0 --port {API_PORT}")

    print()


if __name__ == "__main__":
    main()
