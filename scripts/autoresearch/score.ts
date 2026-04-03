/**
 * score.ts — THE ONLY FILE THE AGENT MODIFIES
 *
 * This is the relevance scoring function for cdaoinsights article ingestion.
 * Goal: maximize F1 score on the ground truth dataset in eval.ts.
 *
 * Scoring guide:
 *   HIGH   → score >= 0.65  (surface to senior data/AI executives)
 *   MEDIUM → score >= 0.35  (useful signal, lower priority)
 *   LOW    → score < 0.35   (filter out, not relevant)
 *
 * Target audience: Chief Data Officers (CDO), Chief AI Officers (CAIO),
 * Chief Data & Analytics Officers (CDAO/CDAIO), VPs of Data/Analytics/AI
 * at enterprise companies (Fortune 1000+).
 *
 * Core topics that matter:
 *   - AI governance, data governance, compliance
 *   - Agentic AI, AI agents in production
 *   - Pilot-to-production scaling of AI
 *   - Executive moves (CDO/CAIO appointments)
 *   - Vendor news: Snowflake, Databricks, Collibra, Alation, Atlan, Monte Carlo,
 *     Fivetran, dbt, Microsoft Fabric, Glean, ThoughtSpot, Dataiku, WisdomAI
 *   - Data mesh, data fabric, data catalog, data quality
 *   - Enterprise AI case studies
 *   - Gartner/Forrester analyst reports on data/AI strategy
 *
 * False positives to penalize:
 *   - CDO (financial instrument, not Chief Data Officer)
 *   - MMA/UFC/sports content
 *   - Consumer AI products (not enterprise)
 *   - Practitioner-level content (engineers, not executives)
 *   - Generic tech news without enterprise data angle
 */
export function scoreRelevance(title: string, description: string): number {
  const t = `${title} ${description}`.toLowerCase()
  let score = 0.2 // baseline

  // ── HIGH-VALUE SIGNALS: executive titles ──────────────────────────────
  if (t.includes('chief data officer') || t.includes('chief data and analytics officer')) score += 0.35
  if (t.includes('chief ai officer') || t.includes('caio')) score += 0.35
  if (t.includes('data leader') || t.includes('data executive')) score += 0.25
  if (t.includes('cdao') || t.includes('cdaio')) score += 0.35
  if (t.includes('vp of data') || t.includes('vp, data') || t.includes('vp of analytics') || t.includes('vp of ai')) score += 0.25
  if (t.includes('head of data') || t.includes('head of ai') || t.includes('head of analytics')) score += 0.2
  if ((t.includes('appoint') || t.includes('named') || t.includes('joins')) && (t.includes('cdo') || t.includes('chief') || t.includes('vp of'))) score += 0.15

  // ── HIGH-VALUE SIGNALS: enterprise AI governance (CDO #1 priority) ────
  if (t.includes('data governance')) score += 0.2
  if (t.includes('ai governance')) score += 0.25
  if (t.includes('govern') && (t.includes('ai model') || t.includes('models'))) score += 0.2
  if (t.includes('data strategy')) score += 0.2
  if (t.includes('data quality')) score += 0.15
  if (t.includes('data catalog')) score += 0.2
  if (t.includes('data mesh') || t.includes('data fabric')) score += 0.2
  if (t.includes('mdm') || t.includes('master data')) score += 0.15
  if (t.includes('data lineage') || t.includes('data observability')) score += 0.2

  // ── HIGH-VALUE SIGNALS: agentic AI (Gartner #1 theme 2026) ───────────
  if (t.includes('agentic ai') || t.includes('ai agent') || t.includes('ai agents')) score += 0.25
  if (t.includes('multi-agent') || t.includes('multiagent') || t.includes('autonomous agent')) score += 0.2

  // ── HIGH-VALUE SIGNALS: pilot-to-production (CDO pain point #1) ──────
  if (t.includes('pilot to production') || t.includes('pilot-to-production')) score += 0.25
  if (t.includes('scaling ai') || t.includes('ai at scale') || t.includes('ai in production') || t.includes('ai deployment')) score += 0.2
  if (t.includes('proof of concept') || t.includes('poc to production')) score += 0.15
  if ((t.includes('models in prod') || t.includes('models in production')) && (t.includes('govern') || t.includes('manage'))) score += 0.25

  // ── HIGH-VALUE SIGNALS: enterprise context ───────────────────────────
  if (t.includes('enterprise') && (t.includes('data') || t.includes('ai') || t.includes('analytics'))) score += 0.15
  if (t.includes('enterprise') && (t.includes('deploy') || t.includes('case study') || t.includes('production'))) score += 0.2
  if (t.includes('fortune 500') || t.includes('fortune 1000')) score += 0.15
  if (t.includes('case study') && (t.includes('data team') || t.includes('ai') || t.includes('personalize'))) score += 0.2
  if (t.includes('data team') && t.includes('personalize') && /\d/.test(t)) score += 0.25 // e.g., "1.9B customer"
  if ((t.includes('financial services') || t.includes('healthcare') || t.includes('pharma') || t.includes('retail') || t.includes('insurance')) && (t.includes('data') || t.includes('ai'))) score += 0.1

  // ── HIGH-VALUE SIGNALS: tracked vendors ──────────────────────────────
  if (t.includes('snowflake cortex') || t.includes('snowflake ai')) score += 0.35
  if (t.includes('snowflake') && (t.includes('analyst') || t.includes('natural language'))) score += 0.15
  if (t.includes('databricks ai') || t.includes('databricks lakehouse') || t.includes('databricks ai/bi')) score += 0.3
  if (t.includes('collibra')) score += 0.25
  if (t.includes('alation')) score += 0.25
  if (t.includes('atlan')) score += 0.25
  if (t.includes('monte carlo data') || t.includes('monte carlo')) score += 0.2
  if (t.includes('fivetran')) score += 0.15
  if (t.includes('microsoft fabric') || t.includes('ms fabric')) score += 0.2
  if (t.includes('power bi') || t.includes('powerbi')) score += 0.1
  if (t.includes('wisdomai') || t.includes('wisdom ai')) score += 0.25
  if (t.includes('glean')) score += 0.2
  if (t.includes('thoughtspot')) score += 0.2
  if (t.includes('dataiku')) score += 0.15
  if (t.includes('weights & biases') || t.includes('wandb')) score += 0.1
  if (t.includes('dbt') && (t.includes('enterprise') || t.includes('semantic'))) score += 0.15
  if (t.includes('palantir')) score += 0.15
  if (t.includes('google cloud') || t.includes('bigquery')) score += 0.1
  if (t.includes('looker') || t.includes('tableau') || t.includes('qlik')) score += 0.1
  if (t.includes('informatica') || t.includes('talend') || t.includes('matillion')) score += 0.1

  // ── MEDIUM SIGNALS: broader data/AI ecosystem ─────────────────────────
  if (t.includes('generative ai') || t.includes('genai') || t.includes('llm')) score += 0.1
  if (t.includes('analyst') && (t.includes('gartner') || t.includes('forrester') || t.includes('idc'))) score += 0.15
  if ((t.includes('gartner') || t.includes('forrester')) && (t.includes('predict') || t.includes('forecast'))) score += 0.2
  if (t.includes('funding') || t.includes('raises') || t.includes('series') || t.includes('acquisition')) score += 0.15
  if ((t.includes('openai') || t.includes('anthropic') || t.includes('microsoft')) && t.includes('ai')) score += 0.05
  if (t.includes('layoff') || t.includes('laid off') || t.includes('workforce reduction')) score += 0.1
  if (t.includes('survey') && (t.includes('data') || t.includes('engineering') || t.includes('practitioner'))) score += 0.15
  if (t.includes('aws') && (t.includes('sagemaker') || t.includes('data') || t.includes('ml'))) score += 0.15
  if (t.includes('cloud') && (t.includes('data') || t.includes('analytics'))) score += 0.05

  // ── NEGATIVE SIGNALS: penalize false positives ────────────────────────
  // CDO as financial instrument
  if ((t.includes('cdo') || t.includes('collateralized debt')) && (t.includes('bond') || t.includes('tranche') || t.includes('credit') || t.includes('securities') || t.includes('financial group') || t.includes('earnings') || t.includes('yield') || t.includes('default rate'))) score -= 0.5

  // Sports/MMA false positives (CDO Magazine competitor had this problem)
  if (t.includes('ufc') || t.includes('mma') || t.includes('fight') || t.includes('boxing')) score -= 0.5

  // Consumer/lifestyle content
  if (t.includes('meal prep') || t.includes('recipe') || t.includes('workout') || t.includes('fitness tip')) score -= 0.5

  // Pure developer content with no exec angle
  if ((t.includes('python') || t.includes('javascript') || t.includes('rust') || t.includes('golang')) && !t.includes('enterprise') && !t.includes('data platform')) score -= 0.15

  // Salary guides for practitioners (not exec-level)
  if (t.includes('salary guide') || t.includes('salary data') || t.includes('compensation guide')) {
    if (!t.includes('cdo') && !t.includes('chief') && !t.includes('executive')) score -= 0.2
  }

  return Math.min(Math.max(score, 0), 1.0)
}
