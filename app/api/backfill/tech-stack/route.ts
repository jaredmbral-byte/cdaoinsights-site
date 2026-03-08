import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractTechStack } from '@/lib/tech-stack'

// One-time backfill: infer tech_stack from job titles for rows where it's null/empty
// Usage: POST /api/backfill/tech-stack with Authorization: Bearer <CRON_SECRET>

function inferTechFromRole(title: string): string[] {
  const t = title.toLowerCase()
  const tech: string[] = []

  if (t.includes('data engineer') || t.includes('analytics engineer')) {
    tech.push('SQL', 'Python')
    if (t.includes('senior') || t.includes('lead') || t.includes('staff')) {
      tech.push('Spark')
    }
  }
  if (t.includes('ml engineer') || t.includes('machine learning engineer') || t.includes('ai engineer')) {
    tech.push('Python')
    if (!tech.includes('SQL')) tech.push('SQL')
  }
  if (t.includes('mlops')) {
    tech.push('Python', 'Kubernetes', 'Docker')
  }
  if (t.includes('data architect')) {
    tech.push('SQL')
  }
  if (t.includes('data platform')) {
    tech.push('SQL', 'Python')
  }

  return tech
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all rows that need backfilling (null or empty tech_stack)
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('hiring_signals')
    .select('id, job_title, tech_stack')
    .or('tech_stack.is.null,tech_stack.eq.{}')
    .order('ingested_at', { ascending: false })
    .limit(500)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: 'No rows need backfilling', updated: 0 })
  }

  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const titleTech = extractTechStack(row.job_title)
    const inferredTech = inferTechFromRole(row.job_title)
    const techStack = [...new Set([...titleTech, ...inferredTech])].sort()

    if (techStack.length > 0) {
      const { error } = await supabaseAdmin
        .from('hiring_signals')
        .update({ tech_stack: techStack })
        .eq('id', row.id)

      if (!error) updated++
      else skipped++
    } else {
      skipped++
    }
  }

  return NextResponse.json({
    total: rows.length,
    updated,
    skipped,
    timestamp: new Date().toISOString(),
  })
}

export async function GET(request: Request) {
  return POST(request)
}
