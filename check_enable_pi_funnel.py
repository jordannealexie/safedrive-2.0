import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=20)

commands = [
    "tailscale status || true",
    "tailscale funnel status || true",
    "tailscale funnel --bg 8000 || true",
    "tailscale funnel status || true",
]

for command in commands:
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=60)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)

ssh.close()
