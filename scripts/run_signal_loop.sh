#!/bin/bash
# cdaoinsights signal loop — Phase 1 (fetch mentions) + Phase 2 (classify & verify).
# Heuristic, no LLM, safe to run unattended. Scheduled daily via launchd.
SITE="/Users/jaredsm4/Desktop/LenovoShare/cdaoinsights-site"
LOG="$HOME/scripts/cdao-signal-loop.log"
mkdir -p "$HOME/scripts"
cd "$SITE" || exit 1
echo "[$(date -u +%FT%TZ)] signal loop start" >> "$LOG"
/usr/bin/python3 scripts/fetch_mentions.py 300 14 >> "$LOG" 2>&1
/usr/bin/python3 scripts/classify_signals.py verify 1000 >> "$LOG" 2>&1
/usr/bin/python3 scripts/compute_vendor_signals.py >> "$LOG" 2>&1
echo "[$(date -u +%FT%TZ)] signal loop done" >> "$LOG"
