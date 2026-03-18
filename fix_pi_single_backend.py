import time
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=20)

commands = [
    "pkill -f 'uvicorn app.main:app' || true",
    "sleep 1",
    "sudo systemctl restart safedrive-api",
    "sleep 4",
    "systemctl is-active safedrive-api",
    "ps aux | grep uvicorn | grep -v grep || true",
    "curl -s http://localhost:8000/api/system/health",
    "curl -s http://localhost:8000/api/work-hours",
]

for command in commands:
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=40)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)

ssh.close()
