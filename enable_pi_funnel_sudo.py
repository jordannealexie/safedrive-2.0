import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=20)

commands = [
    "echo 'raspi4b' | sudo -S tailscale funnel --bg 8000",
    "echo 'raspi4b' | sudo -S tailscale funnel status",
]

for command in commands:
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=90)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)

ssh.close()
