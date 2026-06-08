#!/usr/bin/env python3
"""Phase 3 — synthesize verified signal into Field Notes (the editorial layer).

Pulls the verified vendor events + top headlines, asks Claude (Max plan) to write
Field Notes in the CDAO Insights voice, and inserts them into weekly_brief so they
appear on the Digest. This is the asset a CDO forwards.

Usage: python3 scripts/synthesize_field_notes.py [count]
"""
import json, re, subprocess, sys, urllib.request
from datetime import datetime
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
CLAUDE = str(Path.home() / ".hermes/node/bin/claude")
ENV = {}
for line in (SITE / ".env.local").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip()
BASE = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY")
HDR = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
COUNT = int(sys.argv[1]) if len(sys.argv) > 1 else 5

def get(p):
    return json.loads(urllib.request.urlopen(urllib.request.Request(f"{BASE}/rest/v1/{p}", headers=HDR), timeout=30).read())

def main():
    verified = get("market_articles?topics=cs.%7Bverified%7D&select=title,source_name,topics&order=relevance.desc&limit=25")
    top = get("market_articles?relevance=gte.0.72&select=title,source_name&order=published_at.desc&limit=30")

    lines = ["VERIFIED VENDOR EVENTS (your tracked lake):"]
    for a in verified:
        tp = a.get("topics") or []
        lines.append(f"- [{tp[0] if tp else '?'}] {a['title']} ({a.get('source_name','')})")
    lines.append("\nTOP CDAO-RELEVANT HEADLINES THIS WEEK:")
    for a in top:
        lines.append(f"- {a['title']} ({a.get('source_name','')})")
    ctx = "\n".join(lines)

    instr = (
        f"You are the CDAO Insights intel desk. From the verified vendor events and headlines below, "
        f"write {COUNT} Field Notes for enterprise Chief Data, Analytics and AI officers. "
        "Each Field Note has: a sharp specific headline (under 12 words), a 2 to 3 sentence body grounded "
        "in the actual items (name the vendor or source and the concrete fact), and a category (one of: "
        "Leadership, AI, Risk, Market, Governance, Vendors). Voice rules: field notes, not think pieces; "
        "sourced, not summarized; the reader is already senior, so no 101s; humble, not hedged; no em dashes; "
        "no hype; small load-bearing words. Output ONLY a JSON array of objects with keys headline, body, "
        "category. No prose, no code fences."
    )
    res = subprocess.run([CLAUDE, "-p", instr], input=ctx, capture_output=True, text=True, timeout=200)
    out = res.stdout.strip()
    m = re.search(r"\[[\s\S]*\]", out)
    if not m:
        print("  no JSON returned from claude:", out[:300], file=sys.stderr)
        sys.exit(1)
    notes = json.loads(m.group(0))
    week = datetime.now().strftime("%B %-d, %Y")
    rows = [
        {"headline": n["headline"], "body": n["body"], "category": n.get("category", "AI"), "week_label": week}
        for n in notes if n.get("headline") and n.get("body")
    ]
    urllib.request.urlopen(
        urllib.request.Request(
            f"{BASE}/rest/v1/weekly_brief",
            data=json.dumps(rows).encode(),
            headers={**HDR, "Prefer": "return=minimal"},
            method="POST",
        ),
        timeout=40,
    )
    print(f"  wrote {len(rows)} Field Notes for {week}:")
    for n in rows:
        print(f"    [{n['category']}] {n['headline']}")

if __name__ == "__main__":
    main()
