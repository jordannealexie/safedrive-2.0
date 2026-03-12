"""Quick deploy: upload ws.py + restart server."""
import paramiko, os, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")
sftp = ssh.open_sftp()

BASE = os.path.join(os.path.dirname(__file__), "backend")
PI = "/home/raspi4b/SafeDrive/backend"

for f in ["app/routers/ws.py", "app/models/schemas.py"]:
    local = os.path.join(BASE, f)
    remote = f"{PI}/{f}"
    print(f"  {f}")
    sftp.put(local, remote)

sftp.close()

# Restart server
print("Restarting server...")
ssh.exec_command("pkill -f 'uvicorn app.main:app' || true")
time.sleep(2)
transport = ssh.get_transport()
ch = transport.open_session()
ch.exec_command(
    f"cd {PI} && nohup /home/raspi4b/SafeDrive/venv/bin/python "
    f"-m uvicorn app.main:app --host 0.0.0.0 --port 8000 "
    f"> /home/raspi4b/SafeDrive/server.log 2>&1 &"
)
time.sleep(3)

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/sensors/oled/status")
print("OLED status:", stdout.read().decode()[:500])

ssh.close()
print("Done!")
