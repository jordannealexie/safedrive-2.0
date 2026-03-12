"""Check SPI configuration on Pi."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi\n")

cmds = [
    ("SPI devices", "ls -la /dev/spi* 2>&1"),
    ("SPI enabled in config", "grep -i spi /boot/firmware/config.txt 2>/dev/null; grep -i spi /boot/config.txt 2>/dev/null"),
    ("SPI kernel module loaded", "lsmod | grep spi"),
    ("SPI GPIO pins status", "pinctrl get 7,8,9,10,11,24,25 2>/dev/null"),
    ("Check GPIO 24,25 (likely DC,RST)", "pinctrl get 24 2>/dev/null; pinctrl get 25 2>/dev/null"),
]

for label, cmd in cmds:
    print(f"=== {label} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    print()

ssh.close()
