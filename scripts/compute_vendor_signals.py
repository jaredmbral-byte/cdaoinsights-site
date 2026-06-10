#!/usr/bin/env python3
"""Recompute per-vendor activity from market_articles — the self-improving loop's state.

Counts mentions and verified events per vendor (matched by topics[0] == vendor name,
which is how fetch_mentions tags them) and writes mention_count, verified_count,
last_event_at back onto vendors. Runs daily after the classify step. Over time, as the
loop captures more events, more vendors light up and re-rank in the directory.

Usage: python3 scripts/compute_vendor_signals.py
"""
import json, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
ENV = {}
for line in (SITE / ".env.local").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip()
BASE = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY")
HDR = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def get_all(path):
    out, start = [], 0
    while True:
        req = urllib.request.Request(
            f"{BASE}/rest/v1/{path}&limit=1000&offset={start}", headers=HDR
        )
        page = json.loads(urllib.request.urlopen(req, timeout=40).read())
        out.extend(page)
        if len(page) < 1000:
            break
        start += 1000
    return out

def main():
    vendors = get_all("vendors?select=name,slug")
    names = {v["name"] for v in vendors}
    name_to_slug = {v["name"]: v["slug"] for v in vendors}

    articles = get_all("market_articles?select=topics,published_at&topics=not.is.null")
    counts = {}
    for a in articles:
        tp = a.get("topics") or []
        if not tp:
            continue
        vname = tp[0]
        if vname not in names:
            continue
        c = counts.setdefault(vname, {"m": 0, "v": 0, "last": None})
        c["m"] += 1
        if "verified" in tp:
            c["v"] += 1
        pub = a.get("published_at")
        if pub and (c["last"] is None or pub > c["last"]):
            c["last"] = pub

    def update(item):
        vname, c = item
        body = {"mention_count": c["m"], "verified_count": c["v"], "last_event_at": c["last"]}
        req = urllib.request.Request(
            f"{BASE}/rest/v1/vendors?slug=eq.{urllib.parse.quote(name_to_slug[vname])}",
            data=json.dumps(body).encode(),
            headers={**HDR, "Prefer": "return=minimal"},
            method="PATCH",
        )
        try:
            urllib.request.urlopen(req, timeout=20)
            return True
        except Exception:
            return False

    with ThreadPoolExecutor(max_workers=12) as ex:
        list(ex.map(update, counts.items()))

    active = sum(1 for c in counts.values() if c["v"] > 0)
    print(f"  updated {len(counts)} vendors with mentions | {active} have verified events")

if __name__ == "__main__":
    main()
