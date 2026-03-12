"""Install spidev on Pi and restart server."""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected")

# Install spidev
stdin, stdout, stderr = ssh.exec_command(
    "/home/raspi4b/SafeDrive/venv/bin/pip install spidev", timeout=60
)
out = stdout.read().decode()
err = stderr.read().decode()
print(f"Install: {out.strip()}")
if err.strip():
    print(f"STDERR: {err.strip()}")

# Also install lgpio if needed for luma.core GPIO on Pi 5/newer kernels
stdin, stdout, stderr = ssh.exec_command(
    "/home/raspi4b/SafeDrive/venv/bin/pip install gpiod 2>&1 | tail -3", timeout=60
)
print(f"gpiod: {stdout.read().decode().strip()}")

# Restart server
stdin, stdout, stderr = ssh.exec_command("pkill -f 'uvicorn app.main' ; echo done", timeout=10)
stdout.channel.recv_exit_status()
time.sleep(2)

cmd = (
    "cd /home/raspi4b/SafeDrive/backend && "
    "nohup /home/raspi4b/SafeDrive/venv/bin/python -m uvicorn app.main:app "
    "--host 0.0.0.0 --port 8000 > /home/raspi4b/SafeDrive/server.log 2>&1 &"
)
transport = ssh.get_transport()
channel = transport.open_session()
channel.exec_command(cmd)
print("Server restarting...")
time.sleep(6)

# Check health
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/system/health", timeout=10)
print(f"Health: {stdout.read().decode()}")

# Check OLED
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/sensors/oled/status", timeout=10)
print(f"OLED: {stdout.read().decode()}")

# Check for OLED errors
stdin, stdout, stderr = ssh.exec_command("tail -10 /home/raspi4b/SafeDrive/server.log | grep -iE 'oled|spi|error'", timeout=10)
log = stdout.read().decode().strip()
if log:
    print(f"Log: {log}")
else:
    print("No OLED/SPI errors")

ssh.close()
