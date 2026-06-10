#!/usr/bin/env python3
"""Phase 1 — vendor mention monitor.

Pulls recent Google News mentions for tracked vendors (free, no API key) and writes
them into market_articles, which powers The Wire on the digest. Re-runnable and
deduped on source_url. Sponsors (ai4, gartner-dna) are processed first.

Usage: python3 scripts/fetch_mentions.py [limit] [days]
"""
import json, re, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

SITE = Path(__file__).resolve().parent.parent
ENV = {}
for line in (SITE / ".env.local").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip()
BASE = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
UA = {"User-Agent": "Mozilla/5.0 (cdaoinsights mention bot)"}

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 200
DAYS = int(sys.argv[2]) if len(sys.argv) > 2 else 14
PER_VENDOR = 3

def get_vendors():
    url = (
        f"{BASE}/rest/v1/vendors?select=name,slug,source"
        f"&tracking=eq.true&order=source.asc&limit={LIMIT}"
    )
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=30).read())

def fetch(v):
    name = v["name"]
    q = urllib.parse.quote(f'"{name}" when:{DAYS}d')
    url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
    out = []
    try:
        xml = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=12).read()
        root = ET.fromstring(xml)
        for item in root.findall(".//item")[:PER_VENDOR]:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            if not title or not link:
                continue
            src_el = item.find("source")
            source_name = (src_el.text if src_el is not None else None) or "Google News"
            clean = re.sub(r"\s+-\s+[^-]+$", "", title).strip() or title
            pub = item.findtext("pubDate")
            try:
                published = parsedate_to_datetime(pub).isoformat() if pub else None
            except Exception:
                published = None
            out.append({
                "title": clean[:300],
                "source_name": source_name[:120],
                "source_url": link,
                "published_at": published,
                "topics": [name, "vendor-mention"],
                # Raw + unverified. Below the 0.6 Wire threshold on purpose; Phase 2's
                # classifier confirms it's really about this vendor and re-scores relevance.
                "relevance": 0.4,
            })
    except Exception:
        pass
    return out

STOP = {"the", "a", "an", "of", "for", "to", "in", "on", "and", "with", "its", "is", "at", "by", "as"}

def tokens(title):
    return {w for w in re.sub(r"[^a-z0-9 ]", " ", title.lower()).split() if w not in STOP and len(w) > 2}

def recent_titles_by_vendor():
    """Titles already in market_articles (last 21d), keyed by vendor (topics[0])."""
    from datetime import datetime, timedelta, timezone
    cutoff = urllib.parse.quote((datetime.now(timezone.utc) - timedelta(days=21)).isoformat())
    out, start = {}, 0
    while True:
        url = (f"{BASE}/rest/v1/market_articles?select=title,topics"
               f"&ingested_at=gte.{cutoff}&topics=not.is.null&limit=1000&offset={start}")
        try:
            page = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=40).read())
        except Exception:
            return out
        for a in page:
            tp = a.get("topics") or []
            if tp:
                out.setdefault(tp[0], []).append(tokens(a.get("title") or ""))
        if len(page) < 1000:
            return out
        start += 1000

def is_dupe_story(tok, kept_list):
    """Same story, different outlet: high token overlap on the headline."""
    for other in kept_list:
        inter = len(tok & other)
        if inter and inter / max(1, min(len(tok), len(other))) >= 0.6:
            return True
    return False

def main():
    vendors = get_vendors()
    print(f"  monitoring {len(vendors)} tracked vendors (last {DAYS}d, top {PER_VENDOR}/vendor)")
    rows = []
    with ThreadPoolExecutor(max_workers=8) as ex:
        for res in ex.map(fetch, vendors):
            rows.extend(res)
    # dedupe: by source_url, then collapse same-story-from-multiple-outlets per vendor
    # (token-overlap on headlines, checked against this run AND the last 21 days in the DB)
    existing = recent_titles_by_vendor()
    seen, kept_tokens, deduped, story_dupes = set(), {}, [], 0
    for r in rows:
        if r["source_url"] in seen:
            continue
        seen.add(r["source_url"])
        vendor = (r.get("topics") or ["?"])[0]
        tok = tokens(r["title"])
        if is_dupe_story(tok, kept_tokens.get(vendor, [])) or is_dupe_story(tok, existing.get(vendor, [])):
            story_dupes += 1
            continue
        kept_tokens.setdefault(vendor, []).append(tok)
        deduped.append(r)
    if story_dupes:
        print(f"  collapsed {story_dupes} same-story duplicates (multiple outlets, one event)")
    inserted = 0
    for i in range(0, len(deduped), 100):
        batch = deduped[i : i + 100]
        req = urllib.request.Request(
            f"{BASE}/rest/v1/market_articles?on_conflict=source_url",
            data=json.dumps(batch).encode(),
            headers={**H, "Prefer": "resolution=ignore-duplicates,return=minimal"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=40)
            inserted += len(batch)
        except Exception as e:
            print(f"  batch {i} error: {e}", file=sys.stderr)
    print(f"  found {len(rows)} mentions, {len(deduped)} unique, ~{inserted} upserted to market_articles")

if __name__ == "__main__":
    main()
