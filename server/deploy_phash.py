#!/usr/bin/env python3
"""Deploy pHash endpoint to AI service on server"""
import subprocess

def ssh(cmd):
    r = subprocess.run(
        f"sshpass -p 'Tchaikovsky_0' ssh -o StrictHostKeyChecking=no -p 443 ubuntu@101.43.35.139 \"{cmd}\"",
        shell=True, capture_output=True, text=True
    )
    return r.stdout.strip(), r.returncode

# Copy phash.py to server
out, rc = ssh("cat > /opt/xunjianbao/ai-service/app/api/phash.py << 'ENDOFFILE'\n" + open("/Volumes/KINGSTON/xunjianbao/server/phash.py").read() + "\nENDOFFILE")
print(f"phash.py copy: rc={rc}")

# Update main.py
out, rc = ssh("""python3 -c "
import re
p = '/opt/xunjianbao/ai-service/app/main.py'
with open(p) as f:
    c = f.read()
if 'phash' not in c:
    c = c.replace('from app.api import detect, chat, health, report', 'from app.api import detect, chat, health, report, phash')
    c = c.replace('app.include_router(analyze_router, prefix=\\\"/api/v1\\\", tags=[\\\"ai\\\"])', 'app.include_router(analyze_router, prefix=\\\"/api/v1\\\", tags=[\\\"ai\\\"])\\napp.include_router(phash.router, tags=[\\\"image\\\"])')
    with open(p, 'w') as f:
        f.write(c)
    print('updated')
else:
    print('already has phash')
\""")
print(f"main.py update: {out}, rc={rc}")

# Restart AI service
out, rc = ssh("cd /opt/xunjianbao && docker compose restart ai")
print(f"AI restart: rc={rc}")

# Verify
import time
time.sleep(3)
out, rc = ssh("cd /opt/xunjianbao && docker compose logs --tail=10 ai 2>/dev/null | tail -5")
print(f"AI logs: {out}")
