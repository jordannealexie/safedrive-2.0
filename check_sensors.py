"""Check OLED and all sensor connections on Pi."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi\n")

cmds = [
    ("Check I2C devices", "i2cdetect -y 1 2>&1"),
    ("Check OLED status via API", "curl -s http://localhost:8000/api/sensors/oled/status"),
    ("Check system status via API", "curl -s http://localhost:8000/api/system/status"),
    ("Check server log for OLED errors", "tail -30 /home/raspi4b/SafeDrive/server.log | grep -i oled"),
    ("Check server log for I2C errors", "tail -30 /home/raspi4b/SafeDrive/server.log | grep -i i2c"),
    ("Check server log for all errors", "tail -30 /home/raspi4b/SafeDrive/server.log | grep -i error"),
    ("Check .env content", "cat /home/raspi4b/SafeDrive/backend/.env"),
]

for label, cmd in cmds:
    print(f"=== {label} ===")
    print(f">>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip():
        print(f"STDERR: {err.strip()}")
    print()

ssh.close()
print("Done")
