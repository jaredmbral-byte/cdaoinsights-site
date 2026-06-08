#!/usr/bin/env python3
"""Phase 1 — RSS feed resolver.

For tracked vendors with no rss_url yet, probe common feed paths and the homepage
<link rel=alternate> tag. Stores the feed on vendors.rss_url, or '' to mark it
checked-but-none (so re-runs skip it). Re-runnable; processes a bounded batch.

Usage: python3 scripts/resolve_rss.py [limit]
"""
import json, re, sys, urllib.parse, urllib.request
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
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
UA = {"User-Agent": "Mozilla/5.0 (cdaoinsights feed bot)"}

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 150
PATHS = ["/feed", "/rss", "/feed.xml", "/rss.xml", "/blog/rss.xml", "/blog/feed", "/index.xml", "/atom.xml"]

def get_vendors():
    url = (
        f"{BASE}/rest/v1/vendors?select=slug,domain"
        f"&tracking=eq.true&rss_url=is.null&domain=not.is.null&order=source.asc&limit={LIMIT}"
    )
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=30).read())

def looks_like_feed(body):
    head = body[:400].lstrip().lower()
    return head.startswith("<?xml") or "<rss" in head or "<feed" in head

def try_url(u):
    try:
        body = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=6).read()
        if looks_like_feed(body):
            return u
    except Exception:
        pass
    return None

def resolve(v):
    dom = v["domain"]
    base = f"https://{dom}"
    for p in PATHS:
        hit = try_url(base + p)
        if hit:
            return v["slug"], hit
    # homepage <link rel=alternate type=application/rss+xml href=...>
    try:
        html = urllib.request.urlopen(urllib.request.Request(base, headers=UA), timeout=6).read().decode("utf-8", "ignore")
        m = re.search(r'<link[^>]+application/(?:rss|atom)\+xml[^>]+href=["\']([^"\']+)', html, re.I)
        if m:
            href = m.group(1)
            if href.startswith("/"):
                href = base + href
            return v["slug"], href
    except Exception:
        pass
    return v["slug"], ""  # checked, none found

def patch(slug, rss):
    req = urllib.request.Request(
        f"{BASE}/rest/v1/vendors?slug=eq.{urllib.parse.quote(slug)}",
        data=json.dumps({"rss_url": rss}).encode(),
        headers={**H, "Prefer": "return=minimal"},
        method="PATCH",
    )
    try:
        urllib.request.urlopen(req, timeout=20)
        return True
    except Exception:
        return False

def main():
    vendors = get_vendors()
    print(f"  resolving feeds for {len(vendors)} vendors (no rss_url yet)")
    found = 0
    with ThreadPoolExecutor(max_workers=12) as ex:
        results = list(ex.map(resolve, vendors))
    for slug, rss in results:
        patch(slug, rss)
        if rss:
            found += 1
    print(f"  checked {len(results)} | feeds found {found} | marked-none {len(results) - found}")

if __name__ == "__main__":
    main()
