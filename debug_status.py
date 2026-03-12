"""Debug driver status on Pi."""
import paramiko, json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=15)

# Check the state file
i, o, e = ssh.exec_command("cat /tmp/safedrive_oled_state.json 2>&1")
print("State file:", o.read().decode().strip())

# Check active sessions
i, o, e = ssh.exec_command("curl -s http://localhost:8000/api/sessions")
sess = o.read().decode().strip()
print("Sessions:", sess[:300])

# Check drivers
i, o, e = ssh.exec_command("curl -s http://localhost:8000/api/drivers")
data = json.loads(o.read().decode())
for d in data:
    print(f"  {d['id']}: status={d['status']}, detection={d['detectionStatus']}")

ssh.close()
