import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("100.69.59.30", username="raspi4b", password="raspi4b", timeout=20)

commands = [
    "ls -l /tmp/safedrive_oled_state.json || true",
    "date",
    "python3 - <<'PY'\nimport os, json, time\np='/tmp/safedrive_oled_state.json'\nprint('exists', os.path.exists(p))\nif os.path.exists(p):\n    st=os.stat(p)\n    print('mtime_epoch', st.st_mtime)\n    print('age_sec', time.time()-st.st_mtime)\n    with open(p,'r') as f:\n        data=json.load(f)\n    print('driver_id', data.get('driver_id'))\n    print('drowsiness_state', data.get('drowsiness_state'))\n    print('is_moving', data.get('is_moving'))\nPY",
]

for command in commands:
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=40)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    if out.strip():
        print(out)
    if err.strip():
        print("ERR:", err)

ssh.close()
