"""
Deploy SafeDrive backend to Raspberry Pi via SSH/SFTP using paramiko.
"""
import paramiko
import os
import stat
import sys
import time

PI_HOST = "192.168.1.14"
PI_USER = "raspi4b"
PI_PASS = "raspi4b"
PI_BASE = "/home/raspi4b/SafeDrive"
PI_DEST = f"{PI_BASE}/backend"
PI_VENV = f"{PI_BASE}/venv"
LOCAL_BACKEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")

# Files/dirs to skip
SKIP = {"__pycache__", ".pyc", ".pyo"}


def should_skip(name):
    return name in SKIP or name.endswith(".pyc") or name.endswith(".pyo")


def sftp_mkdir_p(sftp, remote_dir):
    """Recursively create remote directories."""
    dirs_to_create = []
    current = remote_dir
    while True:
        try:
            sftp.stat(current)
            break
        except FileNotFoundError:
            dirs_to_create.append(current)
            current = os.path.dirname(current).replace("\\", "/")
            if current == "/" or current == "":
                break
    for d in reversed(dirs_to_create):
        print(f"  mkdir {d}")
        sftp.mkdir(d)


def upload_directory(sftp, local_dir, remote_dir):
    """Recursively upload a directory."""
    for item in os.listdir(local_dir):
        if should_skip(item):
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + "/" + item
        if os.path.isdir(local_path):
            sftp_mkdir_p(sftp, remote_path)
            upload_directory(sftp, local_path, remote_path)
        else:
            print(f"  upload {local_path} -> {remote_path}")
            sftp.put(local_path, remote_path)


def run_cmd(ssh, cmd, timeout=120, background=False):
    """Run a command via SSH and print output."""
    print(f"\n>>> {cmd}")
    if background:
        # For background commands, don't wait for output
        transport = ssh.get_transport()
        channel = transport.open_session()
        channel.exec_command(cmd)
        time.sleep(1)
        print("(launched in background)")
        return 0, "", ""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    exit_code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip())
    if err.strip():
        print(f"STDERR: {err.strip()}")
    print(f"Exit code: {exit_code}")
    return exit_code, out, err


def main():
    print(f"Connecting to {PI_USER}@{PI_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=15)
        print("Connected!\n")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)

    # Step 1: Create target directory
    print("=== Step 1: Creating target directory ===")
    run_cmd(ssh, f"mkdir -p {PI_DEST}")

    # Step 2: Upload files
    print("\n=== Step 2: Uploading backend files ===")
    sftp = ssh.open_sftp()
    try:
        sftp_mkdir_p(sftp, PI_DEST)
        upload_directory(sftp, LOCAL_BACKEND, PI_DEST)
        print("\nAll files uploaded!")
    finally:
        sftp.close()

    # Step 3: Create virtual environment and install requirements
    print("\n=== Step 3: Creating virtual environment ===")
    run_cmd(ssh, f"python3 -m venv {PI_VENV}", timeout=60)

    print("\n=== Step 3b: Installing Python requirements ===")
    run_cmd(ssh, f"{PI_VENV}/bin/pip install -r {PI_DEST}/requirements.txt", timeout=300)

    # Step 4: Kill any existing uvicorn
    print("\n=== Step 4: Stopping any existing server ===")
    run_cmd(ssh, "pkill -f 'uvicorn app.main:app' || true")
    time.sleep(2)

    # Step 5: Start the server in background using venv python
    print("\n=== Step 5: Starting FastAPI server ===")
    start_cmd = (
        f"cd {PI_DEST} && "
        f"nohup {PI_VENV}/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 "
        f"> {PI_BASE}/server.log 2>&1 &"
    )
    run_cmd(ssh, start_cmd, background=True)
    time.sleep(5)

    # Step 6: Verify
    print("\n=== Step 6: Verifying server is running ===")
    exit_code, out, _ = run_cmd(ssh, "curl -s http://localhost:8000/api/system/health")
    if "ok" in out.lower():
        print("\n✅ Server is UP and running on the Raspberry Pi!")
    else:
        # Check if process is running
        run_cmd(ssh, "ps aux | grep uvicorn | grep -v grep")
        # Show logs
        print("\nServer log tail:")
        run_cmd(ssh, "tail -30 {}/server.log".format(PI_BASE))

    ssh.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
