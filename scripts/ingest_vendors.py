#!/usr/bin/env python3
"""Vendor Lake ingest — add any list of companies to the cdaoinsights `vendors` table.

Usage:
  python3 scripts/ingest_vendors.py <csv_path> <source_tag>

Examples:
  python3 scripts/ingest_vendors.py "../path/MAD_Landscape_FirstMark.csv" mad
  python3 scripts/ingest_vendors.py "~/Documents/.../Gartner ... Sponsors.csv" gartner-dna

Source-agnostic: maps common column names (Company / Company Name / Vendor,
Website / Company URL / Domain, Category, Country, Founded, Raised). Dedupes by
slug against what's already in the lake, so re-running or adding overlapping
lists is safe. Probes the live table so it only writes columns that exist.
"""
import csv, json, os, re, sys, urllib.request, urllib.error
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent

def load_env():
    env = {}
    f = SITE / ".env.local"
    for line in f.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

ENV = load_env()
BASE = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY")
if not BASE or not KEY:
    sys.exit("ERROR: Supabase URL / service role key missing from .env.local")
HEAD = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

def api(method, path, data=None, extra=None):
    url = f"{BASE}/rest/v1/{path}"
    h = dict(HEAD)
    if extra:
        h.update(extra)
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            t = r.read().decode()
            return r.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return 0, str(e)

def slugify(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "vendor"

def domain_of(url):
    if not url:
        return ""
    d = re.sub(r"^https?://", "", url.strip()).split("/")[0]
    return d[4:] if d.startswith("www.") else d

def get(row, *names):
    for n in names:
        for k in row:
            if k and k.strip().lower() == n:
                return (row[k] or "").strip()
    return ""

def probe_columns():
    code, res = api("GET", "vendors?limit=1")
    if code == 200 and isinstance(res, list) and res:
        return set(res[0].keys())
    # Empty table: assume the full lake schema (the table is created with all of these).
    return {
        "name", "slug", "category", "sub_category", "description", "use_case",
        "website_url", "logo_url", "domain", "source", "rss_url", "raised",
        "country", "founded", "featured", "tracking",
    }

def existing_slugs():
    code, res = api("GET", "vendors?select=slug&limit=20000")
    return {r["slug"] for r in res} if code == 200 and isinstance(res, list) else set()

def main():
    if len(sys.argv) < 3:
        sys.exit("usage: ingest_vendors.py <csv_path> <source_tag>")
    path = os.path.expanduser(sys.argv[1])
    source = sys.argv[2]
    cols = probe_columns()
    have = existing_slugs()
    rows = list(csv.DictReader(open(path, newline="")))

    payload, seen = [], set()
    for r in rows:
        name = get(r, "company", "company name", "name", "vendor")
        if not name:
            continue
        slug = slugify(name)
        if slug in have or slug in seen:
            continue
        seen.add(slug)
        url = get(r, "website", "company url", "url", "website_url", "domain")
        row = {"name": name, "slug": slug}
        if "website_url" in cols:
            row["website_url"] = url or None
        if "category" in cols:
            row["category"] = (get(r, "category") or get(r, "sub category"))[:120] or None
        if "source" in cols:
            row["source"] = source
        if "domain" in cols:
            row["domain"] = domain_of(url)
        if "sub_category" in cols:
            row["sub_category"] = get(r, "sub category") or None
        if "raised" in cols:
            row["raised"] = get(r, "raised") or None
        if "country" in cols:
            row["country"] = get(r, "country") or None
        if "founded" in cols:
            try:
                row["founded"] = int(get(r, "founded"))
            except ValueError:
                row["founded"] = None  # keep the key so every row has identical keys
        payload.append(row)

    inserted = 0
    for i in range(0, len(payload), 200):
        batch = payload[i : i + 200]
        code, res = api(
            "POST",
            "vendors?on_conflict=slug",
            batch,
            {"Prefer": "resolution=ignore-duplicates,return=minimal"},
        )
        if code in (200, 201, 204):
            inserted += len(batch)
        else:
            print(f"  batch {i} failed [{code}]: {res}", file=sys.stderr)

    print(
        f"[{source}] {len(rows)} rows read | {len(payload)} new after dedupe | "
        f"~{inserted} written | columns used: {sorted(c for c in cols if c not in ('id','created_at'))}"
    )

if __name__ == "__main__":
    main()
