import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Returns new CDO/CAIO appointments from the last N days
// Protected by EXPORT_SECRET env var
// Output: JSON or CSV depending on ?format=csv

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.EXPORT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const format = searchParams.get('format') || 'json'

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data, error } = await supabaseAdmin
    .from('executive_moves')
    .select('person_name, title, company_name, move_type, headline, source_url, published_at')
    .gte('published_at', cutoff.toISOString())
    .neq('move_type', 'leaves')
    .order('published_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const moves = data || []

  if (format === 'csv') {
    const rows = [
      ['Name', 'Title', 'Company', 'Move Type', 'Headline', 'Source', 'Date'].join(','),
      ...moves.map(m => [
        `"${m.person_name || ''}"`,
        `"${m.title || ''}"`,
        `"${m.company_name || ''}"`,
        `"${m.move_type || ''}"`,
        `"${(m.headline || '').replace(/"/g, '""')}"`,
        `"${m.source_url || ''}"`,
        `"${m.published_at ? new Date(m.published_at).toLocaleDateString('en-US') : ''}"`,
      ].join(','))
    ].join('\n')

    return new Response(rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="new-cdo-appointments-${days}d.csv"`,
      },
    })
  }

  return NextResponse.json({
    period_days: days,
    count: moves.length,
    generated_at: new Date().toISOString(),
    appointments: moves,
  })
}
