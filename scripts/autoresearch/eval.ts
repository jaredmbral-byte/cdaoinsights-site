/**
 * eval.ts — DO NOT MODIFY (this is the fixed evaluation harness)
 *
 * Loads ground-truth.json, runs scoreRelevance on each article,
 * and prints an F1 score. The agent modifies score.ts to improve this number.
 *
 * Run: npx ts-node scripts/autoresearch/eval.ts
 *
 * Score interpretation:
 *   >= 0.85 → excellent
 *   >= 0.75 → good
 *   >= 0.65 → acceptable (current production baseline)
 *   < 0.65  → worse than current production
 *
 * Classification thresholds (must stay fixed — agent cannot change these):
 *   HIGH   → score >= 0.65
 *   MEDIUM → 0.35 <= score < 0.65
 *   LOW    → score < 0.35
 */

import * as path from 'path'
import * as fs from 'fs'
import { scoreRelevance } from './score'

const GROUND_TRUTH_PATH = path.join(__dirname, 'ground-truth.json')

interface Article {
  title: string
  summary: string
  expected: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
}

function classify(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.65) return 'HIGH'
  if (score >= 0.35) return 'MEDIUM'
  return 'LOW'
}

function main() {
  const articles: Article[] = JSON.parse(fs.readFileSync(GROUND_TRUTH_PATH, 'utf-8'))

  let tp = 0, fp = 0, fn = 0, tn = 0
  const mistakes: Array<{ title: string; expected: string; got: string; score: number; reason: string }> = []

  for (const article of articles) {
    const score = scoreRelevance(article.title, article.summary)
    const predicted = classify(score)

    // Binary: HIGH = positive, MEDIUM+LOW = negative
    const expectedPositive = article.expected === 'HIGH'
    const predictedPositive = predicted === 'HIGH'

    if (expectedPositive && predictedPositive) tp++
    else if (!expectedPositive && predictedPositive) fp++
    else if (expectedPositive && !predictedPositive) fn++
    else tn++

    if (predicted !== article.expected) {
      mistakes.push({
        title: article.title,
        expected: article.expected,
        got: predicted,
        score: Math.round(score * 100) / 100,
        reason: article.reason,
      })
    }
  }

  const precision = tp / (tp + fp) || 0
  const recall = tp / (tp + fn) || 0
  const f1 = 2 * (precision * recall) / (precision + recall) || 0
  const accuracy = (tp + tn) / articles.length

  console.log('\n=== cdaoinsights Relevance Score Eval ===')
  console.log(`Articles: ${articles.length}`)
  console.log(`TP=${tp} FP=${fp} FN=${fn} TN=${tn}`)
  console.log(`Precision:  ${(precision * 100).toFixed(1)}%`)
  console.log(`Recall:     ${(recall * 100).toFixed(1)}%`)
  console.log(`F1 Score:   ${(f1 * 100).toFixed(1)}%  ← optimize this`)
  console.log(`Accuracy:   ${(accuracy * 100).toFixed(1)}%`)

  if (mistakes.length > 0) {
    console.log(`\nMisclassified (${mistakes.length}):`)
    for (const m of mistakes) {
      const dir = m.expected === 'HIGH' && m.got !== 'HIGH' ? '❌ MISSED' : '⚠️  FALSE+'
      console.log(`  ${dir} [score=${m.score}] ${m.title.slice(0, 60)}`)
      console.log(`         expected=${m.expected} got=${m.got} | ${m.reason}`)
    }
  } else {
    console.log('\n✅ Perfect classification!')
  }

  console.log('')

  // Exit with non-zero if below baseline (agent loop checks this)
  if (f1 < 0.65) {
    process.exit(1)
  }
}

main()
