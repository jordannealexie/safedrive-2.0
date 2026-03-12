import paramiko
import time
import sys

PI_HOST = '192.168.1.14'
PI_USER = 'raspi4b'
PI_PASS = 'raspi4b'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("Connecting to Pi...", flush=True)
ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)
print("Connected!", flush=True)

def run(cmd, timeout=120):
    print(f"\n>>> {cmd}", flush=True)
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out, flush=True)
    if err: print(err, flush=True)
    print(f"Exit code: {exit_code}", flush=True)
    return out, err

# Step 1: Check if tailscale is already installed
out, _ = run("which tailscale 2>/dev/null || echo 'NOT_FOUND'")

if 'NOT_FOUND' in out:
    print("\nWaiting for apt lock to be released...", flush=True)
    run("while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 2; done", timeout=120)
    print("\nInstalling Tailscale...", flush=True)
    run("sudo apt-get install -y tailscale tailscale-archive-keyring", timeout=180)
else:
    print(f"\nTailscale already installed at: {out.strip()}", flush=True)

# Step 2: Start tailscaled service
run("sudo systemctl enable --now tailscaled")

# Step 3: Check version
run("tailscale version")

# Step 4: Check current status
out, _ = run("tailscale status 2>&1 || true")

# Step 5: Start tailscale up
print("\n" + "=" * 60, flush=True)
print("Running 'sudo tailscale up'...", flush=True)
print("This will output an authentication URL.", flush=True)
print("=" * 60, flush=True)

channel = ssh.get_transport().open_session()
channel.exec_command("sudo tailscale up 2>&1")
channel.settimeout(30)

output_lines = []
start = time.time()
while time.time() - start < 30:
    if channel.recv_ready():
        data = channel.recv(4096).decode()
        print(data, end='', flush=True)
        output_lines.append(data)
    if channel.exit_status_ready():
        # Read any remaining
        while channel.recv_ready():
            data = channel.recv(4096).decode()
            print(data, end='', flush=True)
            output_lines.append(data)
        break
    time.sleep(0.5)

print("\n\nFinal tailscale status:", flush=True)
run("tailscale status 2>&1 || true")
run("tailscale ip -4 2>&1 || true")

ssh.close()
print("\nDone!", flush=True)
