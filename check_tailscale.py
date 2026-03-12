"""Check and setup Tailscale Funnel on Pi."""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b")

cmds = [
    ("Tailscale version", "tailscale version"),
    ("DNS Name", "tailscale status | head -1"),
    ("Funnel help", "tailscale funnel --help 2>&1 | head -10"),
    ("Current serve status", "tailscale serve status 2>&1"),
]

lines = []
for label, cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    lines.append(f"=== {label} ===")
    lines.append(out or err or "(empty)")

ssh.close()

with open("tailscale_info.txt", "w") as f:
    f.write("\n".join(lines))
print("Wrote tailscale_info.txt")
