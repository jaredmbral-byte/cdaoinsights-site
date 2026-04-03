# cdaoinsights Relevance Scorer — Autoresearch Program

## What you are doing

You are autonomously improving a relevance scoring function for cdaoinsights.com — a real-time intelligence platform for enterprise Chief Data Officers (CDOs), Chief AI Officers (CAIOs), and VP-level data/AI/analytics leaders.

Your goal: improve the F1 score on the evaluation harness by editing `score.ts`.

## The loop

1. Read `score.ts` to understand the current scoring logic
2. Run `npx ts-node scripts/autoresearch/eval.ts` to get the current F1 score
3. Form a hypothesis about what's wrong (false positives? missed high-value articles?)
4. Edit `score.ts` to improve precision or recall
5. Run eval again
6. If F1 improved → `git add scripts/autoresearch/score.ts && git commit -m "improve: <what you changed>"`
7. If F1 did not improve → `git checkout scripts/autoresearch/score.ts` to revert
8. Repeat from step 2

## Files

- `score.ts` — **ONLY FILE YOU MAY EDIT**
- `eval.ts` — fixed evaluation harness, do not touch
- `ground-truth.json` — labeled articles, do not touch
- `program.md` — this file, do not touch

## Scoring rules (do not change thresholds in eval.ts)

- HIGH (≥0.65): Must show to a senior data/AI executive
- MEDIUM (0.35–0.65): Useful signal, lower priority
- LOW (<0.35): Irrelevant, would waste executive's time

## Target audience context

These are the people who use cdaoinsights:
- CDO at JPMorgan managing 500 AI models in production
- CAIO at Pfizer navigating FDA AI compliance
- VP of Data at Target overseeing 1.9B personalization touchpoints
- Head of Analytics at Nationwide Insurance modernizing data infrastructure

What they care about:
1. Agentic AI governance and production deployment
2. Data governance frameworks at scale
3. Peer executive moves (who got hired where)
4. Vendor intelligence (Snowflake, Databricks, Collibra, Alation, Atlan, Monte Carlo, Fivetran, Microsoft Fabric, Glean, ThoughtSpot, WisdomAI)
5. AI pilot → production scaling strategies
6. Gartner/Forrester analyst research on enterprise data/AI

What they do NOT care about:
- CDO as a financial instrument (collateralized debt obligation)
- Sports, MMA, lifestyle content
- Consumer AI apps
- Pure developer tooling (Python updates, frontend frameworks)
- SMB content (they're Fortune 1000+)

## Experiment strategy

Work systematically. On each round, pick ONE of these approaches:

**Round type A: Fix false positives**
Look at articles marked FALSE+ in eval output. What patterns do they share?
Add targeted negative signals to penalize them.

**Round type B: Fix missed articles (false negatives)**
Look at MISSED articles in eval output. What signals did the scorer miss?
Add or boost positive signals to catch them.

**Round type C: Tune thresholds**
Try adjusting baseline score or signal weights to shift the precision/recall tradeoff.
Use when F1 is good but precision and recall are imbalanced.

**Round type D: Add new signal categories**
Identify patterns in high-value articles that have no corresponding signal yet.
Example: "executive appointed" patterns, Gartner report patterns, specific industry signals.

## Commit message format

`improve: <type> — <what changed> (F1: X.X% → Y.Y%)`

Examples:
- `improve: fix false+ — penalize CDO financial instrument patterns (F1: 72.3% → 78.1%)`
- `improve: boost recall — add VP/Head of Data title signals (F1: 78.1% → 81.4%)`

## Starting baseline

Run eval first to establish your starting F1. Then improve it.
Target: F1 ≥ 90%. Stretch: F1 = 100% (all 30 articles correctly classified).

Good luck.
