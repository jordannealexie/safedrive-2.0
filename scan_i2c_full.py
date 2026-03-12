"""Thorough I2C scan across all buses on Pi."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b", timeout=15)
print("Connected to Pi\n")

# Scan every available I2C bus
for bus_num in [0, 1, 10, 20, 21, 22]:
    print(f"=== I2C Bus {bus_num} ===")
    stdin, stdout, stderr = ssh.exec_command(f"sudo i2cdetect -y {bus_num} 2>&1", timeout=10)
    out = stdout.read().decode().strip()
    if out:
        print(out)
    print()

# Check GPIO pinout and physical wiring
print("=== GPIO readall ===")
stdin, stdout, stderr = ssh.exec_command("pinctrl 2>/dev/null || gpio readall 2>/dev/null || echo 'No GPIO tool found'", timeout=10)
out = stdout.read().decode().strip()
if out:
    print(out[:2000])
print()

# Try scanning for OLED at common addresses
print("=== Python address probe ===")
probe_script = """
import smbus2
bus = smbus2.SMBus(1)
for addr in [0x3C, 0x3D, 0x27, 0x78, 0x7A]:
    try:
        bus.read_byte(addr)
        print(f'  0x{addr:02X}: FOUND')
    except Exception as e:
        print(f'  0x{addr:02X}: {e}')
bus.close()
"""
stdin, stdout, stderr = ssh.exec_command(
    f"/home/raspi4b/SafeDrive/venv/bin/python3 -c \"{probe_script}\"", timeout=10
)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
if out:
    print(out)
if err:
    print(f"STDERR: {err}")

ssh.close()
