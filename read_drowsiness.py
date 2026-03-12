import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")

files_to_read = [
    "/home/raspi4b/safedrive_ai/main.py",
    "/home/raspi4b/safedrive_ai/hardware/oled_display.py",
    "/home/raspi4b/safedrive_ai/config/settings.py",
    "/home/raspi4b/safedrive_ai/core/drowsiness_detector.py",
]

for f in files_to_read:
    print(f"\n{'='*60}")
    print(f"FILE: {f}")
    print('='*60)
    stdin, stdout, stderr = ssh.exec_command(f"cat {f}")
    content = stdout.read().decode()
    err = stderr.read().decode()
    if content:
        print(content)
    if err:
        print(f"ERROR: {err}")

# Also check the systemd service
print(f"\n{'='*60}")
print("SYSTEMD SERVICE: safedrive.service")
print('='*60)
stdin, stdout, stderr = ssh.exec_command("cat /etc/systemd/system/safedrive.service 2>/dev/null || systemctl cat safedrive.service 2>/dev/null")
print(stdout.read().decode())
print(stderr.read().decode())

# Check safedrive_ai directory structure
print(f"\n{'='*60}")
print("safedrive_ai directory structure")
print('='*60)
stdin, stdout, stderr = ssh.exec_command("find /home/raspi4b/safedrive_ai -name '*.py' -not -path '*/venv/*' | sort")
print(stdout.read().decode())

ssh.close()
