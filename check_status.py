import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")

# Check state file
stdin, stdout, stderr = ssh.exec_command("cat /tmp/safedrive_oled_state.json 2>/dev/null || echo 'NOT FOUND'")
print("State file:", stdout.read().decode())

# Check safedrive_ai log output
stdin, stdout, stderr = ssh.exec_command("sudo journalctl -u safedrive.service --no-pager -n 30")
print("\nsafedrive_ai journal:")
print(stdout.read().decode())

# Check our server is still running
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:8000/api/system/status | python3 -m json.tool")
print("\nSystem status:")
print(stdout.read().decode()[:2000])

# Check our server log
stdin, stdout, stderr = ssh.exec_command("tail -10 /home/raspi4b/SafeDrive/server.log")
print("\nServer log:")
print(stdout.read().decode())

ssh.close()
