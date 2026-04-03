# cdaoinsights Autoresearch Loop

Autonomous relevance scorer improvement using Karpathy's autoresearch pattern.

## Baseline (April 2026)
- F1: **86.7%** | Precision: 100% | Recall: 76.5%
- 4 missed HIGH articles (false negatives)
- 4 misclassified MEDIUM articles (scored as LOW)

## Known issues from baseline run
**Missed HIGH articles (score just below 0.65 threshold):**
1. Snowflake Cortex — scored 0.65 exactly, fell into MEDIUM. Threshold edge case.
2. CDAO at JPMorgan — "cdao" signal not matching properly (score=0.50)
3. Target's Data Team article — "data team" with AI deployment missed (score=0.45)
4. Gartner CDO prediction — Gartner + CDO combo not scoring high enough (score=0.55)

**MEDIUM articles scored LOW (too aggressive filtering):**
1. State of Data Engineering — practitioner content is still ecosystem signal
2. AWS SageMaker Canvas — business users angle is valid MEDIUM
3. OpenAI $40B raise — AI ecosystem signal should be MEDIUM
4. Palantir layoffs — tracked vendor signal

## How to run

```bash
# Test current score
cd /path/to/cdaoinsights-site
npx tsx scripts/autoresearch/eval.ts

# Run agent loop (Claude Code)
# Point Claude Code at this directory, reference program.md
```

## Files
- `score.ts` — agent edits this to improve F1
- `eval.ts` — fixed harness (do not edit)
- `ground-truth.json` — 30 labeled articles (do not edit)
- `program.md` — instructions for the AI agent

## Target
F1 ≥ 90% (stretch: 100%)

When score.ts is tuned to 90%+, copy the `scoreRelevance` function
back into `app/api/ingest/news/route.ts` to deploy to production.
