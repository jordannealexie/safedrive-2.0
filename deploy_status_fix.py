"""Deploy driver status fix to Pi."""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b")

sftp = ssh.open_sftp()
sftp.put("backend/app/routers/domain.py", "/home/raspi4b/SafeDrive/backend/app/routers/domain.py")
sftp.close()
print("Uploaded domain.py")

stdin, stdout, stderr = ssh.exec_command("sudo systemctl restart safedrive-api")
print(stdout.read().decode(), stderr.read().decode())
time.sleep(8)

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/health")
print("Health:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/drivers")
import json
data = json.loads(stdout.read().decode())
for d in data:
    print(f"  {d['id']}: status={d['status']}, detection={d['detectionStatus']}")

ssh.close()
print("Done")
