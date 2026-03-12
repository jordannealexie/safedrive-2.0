"""Upload updated files to Pi and restart server."""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi")

# Upload updated files
sftp = ssh.open_sftp()
sftp.put(
    r"C:\Users\ASUS\Pictures\Codes\SafeDrive 2.0\backend\app\routers\domain.py",
    "/home/raspi4b/SafeDrive/backend/app/routers/domain.py",
)
sftp.put(
    r"C:\Users\ASUS\Pictures\Codes\SafeDrive 2.0\backend\.env",
    "/home/raspi4b/SafeDrive/backend/.env",
)
sftp.put(
    r"C:\Users\ASUS\Pictures\Codes\SafeDrive 2.0\backend\app\main.py",
    "/home/raspi4b/SafeDrive/backend/app/main.py",
)
sftp.put(
    r"C:\Users\ASUS\Pictures\Codes\SafeDrive 2.0\backend\app\sensors\oled.py",
    "/home/raspi4b/SafeDrive/backend/app/sensors/oled.py",
)
sftp.close()
print("Uploaded domain.py, .env, main.py, and oled.py (SPI)")

# Restart server
stdin, stdout, stderr = ssh.exec_command("pkill -f 'uvicorn app.main' ; echo done", timeout=10)
stdout.channel.recv_exit_status()
print("Killed old server")
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

# Verify health
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/system/health", timeout=10)
print(f"Health: {stdout.read().decode()}")

# Check GPS reading
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/sensors/gps/latest", timeout=10)
print(f"GPS: {stdout.read().decode()}")

# Check OLED status
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/sensors/oled/status", timeout=10)
print(f"OLED: {stdout.read().decode()}")

# Check for errors in log
stdin, stdout, stderr = ssh.exec_command("tail -10 /home/raspi4b/SafeDrive/server.log | grep -iE 'error|oled'", timeout=10)
gps_log = stdout.read().decode().strip()
if gps_log:
    print(f"GPS log: {gps_log}")
else:
    print("No GPS errors in log")

ssh.close()
print("Done")
