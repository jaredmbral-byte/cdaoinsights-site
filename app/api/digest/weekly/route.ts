import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff7 = new Date()
  cutoff7.setDate(cutoff7.getDate() - 7)

  const [movesResult, articlesResult, hiringResult] = await Promise.all([
    supabaseAdmin
      .from('executive_moves')
      .select('person_name, title, company_name, move_type, headline, source_url, published_at')
      .gte('published_at', cutoff7.toISOString())
      .neq('move_type', 'leaves')
      .order('published_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('market_articles')
      .select('title, source_name, source_url, published_at, topics, relevance')
      .gte('published_at', cutoff7.toISOString())
      .gte('relevance', 0.6)
      .order('relevance', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('hiring_signals')
      .select('job_title, company_name, location, seniority, source_url, posted_at')
      .eq('is_featured', true)
      .gte('posted_at', cutoff7.toISOString())
      .order('posted_at', { ascending: false })
      .limit(5),
  ])

  const moves = movesResult.data || []
  const articles = articlesResult.data || []
  const hiring = hiringResult.data || []

  const weekLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Generate HTML email
  const html = generateDigestHtml({ moves, articles, hiring, weekLabel })

  return NextResponse.json({
    week: weekLabel,
    stats: { moves: moves.length, articles: articles.length, hiring: hiring.length },
    html,
  })
}

function generateDigestHtml({ moves, articles, hiring, weekLabel }: {
  moves: any[]
  articles: any[]
  hiring: any[]
  weekLabel: string
}): string {
  const moveRows = moves.map(m => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #1E1E1E;">
        <a href="${m.source_url}" style="color: #E8E8E8; text-decoration: none; font-size: 14px;">${m.person_name || m.headline?.slice(0, 60) || 'Unknown'}</a>
        <div style="color: #888; font-size: 12px; margin-top: 2px;">${m.title || ''} ${m.company_name ? '· ' + m.company_name : ''}</div>
      </td>
    </tr>`).join('')

  const articleRows = articles.map(a => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #1E1E1E;">
        <a href="${a.source_url}" style="color: #E8E8E8; text-decoration: none; font-size: 14px;">${a.title?.slice(0, 100) || ''}</a>
        <div style="color: #888; font-size: 11px; margin-top: 2px;">${a.source_name || ''}</div>
      </td>
    </tr>`).join('')

  const hiringRows = hiring.map(h => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #1E1E1E;">
        <a href="${h.source_url || '#'}" style="color: #00FF94; text-decoration: none; font-size: 13px;">${h.job_title}</a>
        <div style="color: #888; font-size: 12px; margin-top: 2px;">${h.company_name} ${h.location ? '· ' + h.location : ''}</div>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #0A0A0A; color: #E8E8E8; font-family: 'Courier New', monospace;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="border-bottom: 1px solid #1E1E1E; padding-bottom: 24px; margin-bottom: 24px;">
      <div style="font-size: 11px; letter-spacing: 3px; color: #555; text-transform: uppercase; margin-bottom: 8px;">CDAO INSIGHTS</div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #E8E8E8;">Weekly Intelligence Brief</h1>
      <div style="font-size: 12px; color: #555; margin-top: 4px;">Week of ${weekLabel}</div>
    </div>

    <!-- Exec Moves -->
    ${moves.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 12px;">Executive Moves</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #1E1E1E; border-radius: 4px;">
        ${moveRows}
      </table>
    </div>` : ''}

    <!-- Top Signals -->
    ${articles.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 12px;">Top Market Signals</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #1E1E1E; border-radius: 4px;">
        ${articleRows}
      </table>
    </div>` : ''}

    <!-- Open Roles -->
    ${hiring.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <div style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 12px;">Leadership Roles Open</div>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #1E1E1E; border-radius: 4px;">
        ${hiringRows}
      </table>
    </div>` : ''}

    <!-- CTA -->
    <div style="text-align: center; padding: 24px; border: 1px solid #1E1E1E; border-radius: 4px; margin-bottom: 32px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 12px;">Full dashboard at</div>
      <a href="https://cdaoinsights.com" style="color: #00FF94; text-decoration: none; font-size: 14px; letter-spacing: 1px;">CDAOINSIGHTS.COM →</a>
    </div>

    <!-- Footer -->
    <div style="font-size: 11px; color: #555; text-align: center;">
      CDAO Insights · Enterprise data &amp; AI intelligence<br>
      <a href="https://cdaoinsights.com" style="color: #555;">cdaoinsights.com</a>
    </div>

  </div>
</body>
</html>`
}
