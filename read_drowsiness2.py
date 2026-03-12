import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.14", username="raspi4b", password="raspi4b")

# Read the full main.py (first 300 lines)
files = [
    "/home/raspi4b/safedrive_ai/main.py",
    "/home/raspi4b/safedrive_ai/hardware/config.py",
    "/home/raspi4b/safedrive_ai/hardware/__init__.py",
]

for f in files:
    print(f"\n{'='*60}")
    print(f"FILE: {f}")
    print('='*60)
    stdin, stdout, stderr = ssh.exec_command(f"cat {f}")
    content = stdout.read().decode()
    err = stderr.read().decode()
    if content:
        print(content[:5000])
        if len(content) > 5000:
            print(f"\n... [{len(content) - 5000} more chars]")
    if err:
        print(f"ERROR: {err}")

ssh.close()
