"""Scan I2C bus on Pi to find connected devices."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi\n")

# Install i2c-tools if needed, then scan
cmds = [
    ("Install i2c-tools", "sudo apt-get install -y i2c-tools 2>&1 | tail -3"),
    ("Scan I2C bus 1", "sudo i2cdetect -y 1 2>&1"),
    ("Scan I2C bus 0", "sudo i2cdetect -y 0 2>&1"),
    ("Check I2C interfaces enabled", "ls /dev/i2c-* 2>&1"),
    ("Check config for I2C", "grep -i i2c /boot/firmware/config.txt 2>/dev/null; grep -i i2c /boot/config.txt 2>/dev/null"),
    ("Python I2C scan", "/home/raspi4b/SafeDrive/venv/bin/python3 -c \"import smbus2; bus=smbus2.SMBus(1); devs=[hex(i) for i in range(128) if bus.read_byte(i) is not None]; print('Found:', devs)\" 2>&1"),
]

for label, cmd in cmds:
    print(f"=== {label} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(out.strip())
    if err.strip():
        print(f"STDERR: {err.strip()}")
    print()

ssh.close()
