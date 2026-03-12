"""Start FastAPI server on Raspberry Pi via Tailscale."""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi via Tailscale")

# Kill existing server
stdin, stdout, stderr = ssh.exec_command("pkill -f 'uvicorn app.main' ; echo done", timeout=10)
stdout.channel.recv_exit_status()
print("Stopped old server")
time.sleep(2)

# Start server in background
cmd = (
    "cd /home/raspi4b/SafeDrive/backend && "
    "nohup /home/raspi4b/SafeDrive/venv/bin/python -m uvicorn app.main:app "
    "--host 0.0.0.0 --port 8000 > /home/raspi4b/SafeDrive/server.log 2>&1 &"
)
transport = ssh.get_transport()
channel = transport.open_session()
channel.exec_command(cmd)
print("Server launch command sent")
time.sleep(6)

# Verify health
stdin, stdout, stderr = ssh.exec_command(
    "curl -s http://localhost:8000/api/system/health", timeout=10
)
out = stdout.read().decode()
print(f"Health response: {out}")

if "ok" not in out.lower():
    print("\nServer may not be ready. Checking logs...")
    stdin, stdout, stderr = ssh.exec_command(
        "tail -40 /home/raspi4b/SafeDrive/server.log", timeout=10
    )
    print(stdout.read().decode())
    stdin, stdout, stderr = ssh.exec_command(
        "ps aux | grep uvicorn | grep -v grep", timeout=10
    )
    print(f"Process check: {stdout.read().decode()}")
else:
    print("Server is UP!")

ssh.close()
