"""Check if the safedrive_ai state file updates over time."""
import paramiko, time, json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")

print("Checking state file updates (3 snapshots, 2s apart)...\n")
for i in range(3):
    stdin, stdout, stderr = ssh.exec_command("cat /tmp/safedrive_oled_state.json 2>/dev/null")
    raw = stdout.read().decode().strip()
    if raw:
        data = json.loads(raw)
        ts = data.get("timestamp", 0)
        print(f"[{i+1}] ts={ts:.3f}  EAR={data.get('ear_value',0):.3f}  "
              f"state={data.get('drowsiness_state')}  "
              f"drv={data.get('driver_id')}  "
              f"fps={data.get('fps',0):.1f}")
    else:
        print(f"[{i+1}] State file not found")
    if i < 2:
        time.sleep(2)

# Also check WebSocket endpoint is working
print("\nChecking API OLED status...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/sensors/oled/status | python3 -m json.tool")
print(stdout.read().decode()[:500])

# Check server is alive
print("Server health:")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/")
print(stdout.read().decode())

# Check safedrive_ai service status
print("\nsafedrive.service:")
stdin, stdout, stderr = ssh.exec_command("systemctl is-active safedrive.service")
print(stdout.read().decode().strip())

ssh.close()
