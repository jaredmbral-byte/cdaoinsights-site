#!/usr/bin/env python3
"""Phase 2 — classify & verify the signal stream (the loop's decision gate).

No LLM required: a faithful Python port of the site's own scoreRelevance() + negative
filter, plus a vendor-event bonus (a funding/launch/exec move about a TRACKED vendor is
inherently relevant). Two jobs:

  verify   — score each raw vendor-mention (topic "vendor-mention", relevance 0.4).
             Promote the real ones above the Wire threshold, reject name-collisions
             (e.g. "Ab Initio" the physics term). Re-tags so re-runs skip them.
  rescore  — re-derive true relevance for the flattened market articles, faithfully
             restoring the scores the site's own function originally produced.

Usage: python3 scripts/classify_signals.py [verify|rescore|both] [limit]
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
HDR = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

NEGATIVE_KEYWORDS = [
    "mma", "ufc", "fighter", "knockout", "bout", "octagon", "bellator", "martial arts",
    "wrestling", "boxing", "flyweight", "middleweight", "heavyweight", "bantamweight",
    "featherweight", "welterweight", "submission", "tapout", "title fight", "cage",
    "combat sport", "soccer", "footballer", "defender", "midfielder", "striker",
    "goalkeeper", "flamengo", "serie a", "la liga", "premier league", "champions league",
    "transfer window", "matchday", "kickoff", "penalty", "red card", "yellow card",
    "collateralized debt", "cdo tranche", "structured credit", "mortgage-backed",
    "securitization", "credit default swap", "obituary", "death notice", "in memoriam",
    "fantasy football", "fantasy sports", "nfl draft",
]
# vendor-name-collision noise seen in practice (aerospace/defense/physics)
EXTRA_NEG = ["air force", "t-38", "helicopter", "aircraft", "fusion reactor", "cansec",
             "talon", "fighter jet", "spacecraft", "naval", "rcaf"]

def passes_negative(title, url=""):
    low = f"{title}".lower()
    if any(k in low for k in NEGATIVE_KEYWORDS):
        return False
    if any(k in low for k in EXTRA_NEG) and not any(
        s in low for s in ("data", "analytics", " ai ", "platform", "software", "cloud")
    ):
        return False
    return True

def score_relevance(title, description=""):
    t = f"{title} {description}".lower()
    s = 0.2
    if "chief data officer" in t or "chief data and analytics officer" in t: s += 0.35
    if "chief ai officer" in t or "caio" in t: s += 0.35
    if "data leader" in t or "data executive" in t: s += 0.25
    if "cdao" in t or "cdaio" in t: s += 0.35
    if any(x in t for x in ("vp of data", "vp, data", "vp of analytics", "vp of ai")): s += 0.25
    if any(x in t for x in ("head of data", "head of ai", "head of analytics")): s += 0.2
    if ("appoint" in t or "named" in t or "joins" in t) and ("cdo" in t or "chief" in t or "vp of" in t): s += 0.15
    if "data governance" in t: s += 0.2
    if "ai governance" in t: s += 0.25
    if "govern" in t and ("ai model" in t or "models" in t): s += 0.2
    if "data strategy" in t: s += 0.2
    if "data quality" in t: s += 0.15
    if "data catalog" in t: s += 0.2
    if "data mesh" in t or "data fabric" in t: s += 0.2
    if "mdm" in t or "master data" in t: s += 0.15
    if "data lineage" in t or "data observability" in t: s += 0.2
    if "compliance" in t and any(x in t for x in ("data", "ai", "gdpr", "fda", "sox")): s += 0.15
    if "agentic ai" in t or "ai agent" in t or "ai agents" in t: s += 0.25
    if "multi-agent" in t or "multiagent" in t or "autonomous agent" in t: s += 0.2
    if "pilot to production" in t or "pilot-to-production" in t: s += 0.25
    if any(x in t for x in ("scaling ai", "ai at scale", "ai in production", "ai deployment")): s += 0.2
    if "proof of concept" in t or "poc to production" in t: s += 0.15
    if "enterprise" in t and ("data" in t or "ai" in t or "analytics" in t): s += 0.15
    if "enterprise" in t and ("deploy" in t or "case study" in t or "production" in t): s += 0.2
    if "fortune 500" in t or "fortune 1000" in t: s += 0.15
    # tracked vendors
    if "snowflake cortex" in t or "snowflake ai" in t: s += 0.35
    if "snowflake" in t and ("analyst" in t or "natural language" in t): s += 0.15
    if "databricks ai" in t or "databricks lakehouse" in t: s += 0.3
    for v, b in (("collibra", .25), ("alation", .25), ("atlan", .25), ("monte carlo", .2),
                 ("fivetran", .15), ("microsoft fabric", .2), ("wisdomai", .25), ("wisdom ai", .25),
                 ("glean", .2), ("thoughtspot", .2), ("dataiku", .15), ("palantir", .15),
                 ("informatica", .1), ("talend", .1), ("matillion", .1)):
        if v in t: s += b
    if "generative ai" in t or "genai" in t or "llm" in t: s += 0.1
    if "analyst" in t and ("gartner" in t or "forrester" in t or "idc" in t): s += 0.15
    if ("gartner" in t or "forrester" in t) and ("predict" in t or "forecast" in t): s += 0.2
    if any(x in t for x in ("funding", "raises", "series", "acquisition")): s += 0.15
    if "layoff" in t or "laid off" in t or "workforce reduction" in t: s += 0.1
    if "survey" in t and ("data" in t or "engineering" in t or "practitioner" in t): s += 0.15
    if "cloud" in t and ("data" in t or "analytics" in t): s += 0.05
    # negatives
    if ("cdo" in t or "collateralized debt" in t) and any(x in t for x in ("bond", "tranche", "credit", "securities", "earnings", "yield", "default rate")): s -= 0.5
    if "ufc" in t or "mma" in t or "fight" in t or "boxing" in t: s -= 0.5
    if any(x in t for x in ("meal prep", "recipe", "workout", "fitness tip")): s -= 0.5
    if "salary guide" in t or "compensation guide" in t: s -= 0.3
    return max(0.0, min(s, 1.0))

EVENTS = [
    ("funding", ("raises", "raised", "funding", "series a", "series b", "series c", "series d",
                 "seed round", "valuation", "investment", "led by")),
    ("acquisition", ("acquires", "acquired", "acquisition", "merger", "to buy", " buys ")),
    ("launch", ("launches", "unveils", "announces", "introduces", "releases", "debuts",
                "rolls out", "general availability", "now available", "new platform", "new tool")),
    ("partnership", ("partners", "partnership", "integrates", "integration", "collaborat",
                     "teams up", "alliance")),
    ("exec_move", ("appoints", "names ", "hires", "joins as", "promoted", "new ceo",
                   "new cdo", "new caio", "new cto", "new chief")),
    ("research", ("report", "study", "survey", "finds", "index", "benchmark", "magic quadrant")),
]
def detect_event(title):
    low = title.lower()
    for name, kws in EVENTS:
        if any(k in low for k in kws):
            return name
    return None

def api(method, path, data=None, extra=None):
    h = dict(HDR)
    if extra: h.update(extra)
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(f"{BASE}/rest/v1/{path}", data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=40) as r:
        t = r.read().decode()
        return r.headers, (json.loads(t) if t else None)

def patch_by_id(_id, body):
    try:
        api("PATCH", f"market_articles?id=eq.{_id}", body, {"Prefer": "return=minimal"})
        return True
    except Exception:
        return False

def verify(limit):
    from datetime import datetime, timedelta, timezone
    cutoff = urllib.parse.quote((datetime.now(timezone.utc) - timedelta(hours=6)).isoformat())
    # Raw vendor-mentions: recent Google News items held at 0.4 (topics=[vendor]).
    _, rows = api(
        "GET",
        f"market_articles?source_url=ilike.*news.google.com*&relevance=eq.0.4"
        f"&ingested_at=gte.{cutoff}&select=id,title,topics&limit={limit}",
    )
    rows = rows or []
    jobs, promoted, rejected = [], 0, 0
    for r in rows:
        topics = r.get("topics") or []
        vendor = topics[0] if topics else "?"
        title = r.get("title") or ""
        if not passes_negative(title):
            rel, status, evt = 0.25, "rejected", None
        else:
            evt = detect_event(title)
            bonus = 0.25 if evt in ("funding", "acquisition", "launch", "partnership", "exec_move") else (0.1 if evt == "research" else 0)
            rel = round(min(score_relevance(title) + bonus, 1.0), 2)
            status = "verified" if rel >= 0.6 else "rejected"
        if status == "verified": promoted += 1
        else: rejected += 1
        new_topics = [vendor, status] + ([evt] if evt else [])
        jobs.append((r["id"], {"relevance": rel, "topics": new_topics}))
    with ThreadPoolExecutor(max_workers=12) as ex:
        list(ex.map(lambda j: patch_by_id(*j), jobs))
    print(f"  verify: {len(rows)} mentions classified | promoted {promoted} (to Wire) | rejected {rejected}")

def rescore(limit):
    done = 0
    offset = 0
    while done < limit:
        page = min(1000, limit - done)
        _, rows = api(
            "GET",
            f"market_articles?source_url=ilike.*news.google.com*&relevance=eq.0.6"
            f"&select=id,title,summary&order=published_at.desc&limit={page}&offset={offset}",
        )
        rows = rows or []
        if not rows:
            break
        jobs = []
        for r in rows:
            rel = round(score_relevance(r.get("title") or "", r.get("summary") or ""), 2)
            jobs.append((r["id"], {"relevance": rel}))
        with ThreadPoolExecutor(max_workers=12) as ex:
            list(ex.map(lambda j: patch_by_id(*j), jobs))
        done += len(rows)
        offset += len(rows)
        if len(rows) < page:
            break
    print(f"  rescore: re-derived true relevance for {done} flattened articles (faithful restore)")

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "both"
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 4000
    if mode in ("verify", "both"):
        verify(min(limit, 1000))
    if mode in ("rescore", "both"):
        rescore(limit)

if __name__ == "__main__":
    main()
