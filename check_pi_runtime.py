import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=20)

commands = [
    "grep -n 'def _format_session_clock' /home/raspi4b/SafeDrive/backend/app/routers/domain.py || true",
    "grep -n '\"start\": _format_session_clock' /home/raspi4b/SafeDrive/backend/app/routers/domain.py || true",
    "systemctl is-active safedrive-api; systemctl is-active safedrive-backend || true",
    "systemctl status safedrive-api --no-pager -n 20 || true",
    "systemctl status safedrive-backend --no-pager -n 20 || true",
    "ps aux | grep uvicorn | grep -v grep || true",
]

for command in commands:
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=30)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)

ssh.close()
