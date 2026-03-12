"""Deploy a systemd service for the FastAPI backend so it auto-starts on Pi boot."""
import paramiko
import time

PI_HOST = "100.69.59.30"
PI_USER = "raspi4b"
PI_PASS = "raspi4b"

SERVICE_UNIT = """\
[Unit]
Description=SafeDrive FastAPI Backend
After=network-online.target safedrive.service
Wants=network-online.target

[Service]
Type=simple
User=raspi4b
WorkingDirectory=/home/raspi4b/SafeDrive/backend
ExecStart=/home/raspi4b/SafeDrive/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=append:/home/raspi4b/SafeDrive/server.log
StandardError=append:/home/raspi4b/SafeDrive/server.log
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
"""

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return exit_code, out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=15)
print("Connected to Pi via Tailscale")

# 1. Write service file
print("\n1. Writing safedrive-api.service...")
sftp = ssh.open_sftp()
with sftp.file("/tmp/safedrive-api.service", "w") as f:
    f.write(SERVICE_UNIT)
sftp.close()

# Move to systemd directory (needs sudo)
code, out, err = run(ssh, "echo raspi4b | sudo -S cp /tmp/safedrive-api.service /etc/systemd/system/safedrive-api.service")
print(f"   Copied to systemd: exit={code}")

# 2. Stop any nohup uvicorn process
print("\n2. Stopping existing nohup uvicorn...")
run(ssh, "pkill -f 'uvicorn app.main' || true")
time.sleep(2)

# 3. Reload systemd, enable and start the service
print("\n3. Enabling and starting safedrive-api service...")
code, out, err = run(ssh, "echo raspi4b | sudo -S systemctl daemon-reload")
print(f"   daemon-reload: exit={code}")

code, out, err = run(ssh, "echo raspi4b | sudo -S systemctl enable safedrive-api.service")
print(f"   enable: exit={code} {out}")

code, out, err = run(ssh, "echo raspi4b | sudo -S systemctl start safedrive-api.service")
print(f"   start: exit={code}")

time.sleep(5)

# 4. Verify service status
print("\n4. Checking status...")
code, out, err = run(ssh, "systemctl is-active safedrive-api.service")
print(f"   Service state: {out}")

code, out, err = run(ssh, "systemctl is-enabled safedrive-api.service")
print(f"   Enabled on boot: {out}")

# 5. Health check
print("\n5. Health check...")
code, out, err = run(ssh, "curl -s http://localhost:8000/api/system/health", timeout=10)
print(f"   Health: {out}")

if "ok" in out.lower():
    print("\nSUCCESS! safedrive-api.service is running and will auto-start on boot.")
else:
    print("\nService may not be healthy. Checking logs...")
    code, out, err = run(ssh, "echo raspi4b | sudo -S journalctl -u safedrive-api.service --no-pager -n 30")
    print(out)

# 6. Show both services
print("\n6. SafeDrive services on Pi:")
code, out, err = run(ssh, "systemctl list-units --type=service | grep -i safedrive")
print(f"   {out}")

ssh.close()
print("\nDone!")
