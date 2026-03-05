import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripHtml } from '@/lib/text'

// One-time cleanup: strip HTML from existing market_articles titles and summaries
// POST /api/clean-articles with Authorization: Bearer <CRON_SECRET>

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all articles
  const { data: articles, error: fetchError } = await supabaseAdmin
    .from('market_articles')
    .select('id, title, summary')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  let updated = 0
  let skipped = 0

  for (const article of articles || []) {
    const cleanedTitle = stripHtml(article.title)
    const cleanedSummary = article.summary ? stripHtml(article.summary) : null

    // Only update if something changed
    if (cleanedTitle !== article.title || cleanedSummary !== article.summary) {
      const { error } = await supabaseAdmin
        .from('market_articles')
        .update({
          title: cleanedTitle,
          summary: cleanedSummary && cleanedSummary.length >= 10 ? cleanedSummary : null,
        })
        .eq('id', article.id)

      if (!error) updated++
    } else {
      skipped++
    }
  }

  return NextResponse.json({
    total: (articles || []).length,
    updated,
    skipped,
    timestamp: new Date().toISOString(),
  })
}
