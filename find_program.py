"""Find the drowsiness detection program on Pi and fix OLED."""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi\n")

cmds = [
    ("Running Python processes", "ps aux | grep -i python | grep -v grep"),
    ("Find EAR-related scripts", "find /home -name '*.py' -exec grep -l 'EAR' {} \\; 2>/dev/null | head -20"),
    ("Find drowsiness scripts", "find /home -name '*.py' -exec grep -l -i 'drowsi\\|sleepy\\|yawn' {} \\; 2>/dev/null | head -20"),
    ("Find OLED-writing scripts", "find /home -name '*.py' -exec grep -l 'oled\\|ssd1306\\|luma' {} \\; 2>/dev/null | head -20"),
    ("Home directory listing", "ls -la /home/raspi4b/"),
    ("Desktop listing", "ls -la /home/raspi4b/Desktop/ 2>/dev/null"),
    ("Projects listing", "ls -la /home/raspi4b/Projects/ 2>/dev/null; ls -la /home/raspi4b/safedrive/ 2>/dev/null; ls -la /home/raspi4b/SafeDrive/ 2>/dev/null"),
    ("Crontab", "crontab -l 2>/dev/null"),
    ("Systemd services", "systemctl list-units --type=service --state=running | grep -v snap | head -20"),
    ("rc.local", "cat /etc/rc.local 2>/dev/null"),
    ("Autostart in .bashrc", "grep -i 'python\\|script' /home/raspi4b/.bashrc 2>/dev/null"),
]

for label, cmd in cmds:
    print(f"=== {label} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    elif err:
        print(f"STDERR: {err}")
    else:
        print("(empty)")
    print()

ssh.close()
