#!/bin/bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONIOENCODING=utf-8
nohup /root/.lightclaw/venv/bin/python /root/.lightclaw/venv/bin/lightclaw run --from-configfile --log-level info > /root/.lightclaw/logs/lightclaw.log 2>&1 &
echo "Started LightClaw PID: $!"
