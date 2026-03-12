"""Deploy domain.py + restart server."""
import paramiko, os, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")
sftp = ssh.open_sftp()

local = os.path.join(os.path.dirname(__file__), "backend", "app", "routers", "domain.py")
remote = "/home/raspi4b/SafeDrive/backend/app/routers/domain.py"
sftp.put(local, remote)
print("Uploaded domain.py")
sftp.close()

# Restart
ssh.exec_command("pkill -f 'uvicorn app.main:app' || true")
time.sleep(2)
t = ssh.get_transport()
c = t.open_session()
c.exec_command(
    "cd /home/raspi4b/SafeDrive/backend && nohup /home/raspi4b/SafeDrive/venv/bin/python "
    "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 "
    "> /home/raspi4b/SafeDrive/server.log 2>&1 &"
)
time.sleep(3)

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/dashboard/stats")
print("Dashboard:", stdout.read().decode()[:800])

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/drivers")
print("Drivers:", stdout.read().decode()[:400])

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/alerts")
print("Alerts:", stdout.read().decode()[:400])

stdin, stdout, stderr = ssh.exec_command("tail -5 /home/raspi4b/SafeDrive/server.log")
print("Log:", stdout.read().decode())

ssh.close()
print("Done!")
