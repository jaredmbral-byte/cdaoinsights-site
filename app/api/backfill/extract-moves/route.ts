import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractMoveDetails(headline: string): Promise<{ person_name: string | null; title: string | null; company_name: string | null; move_type: string | null }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Extract from this executive appointment headline. Return ONLY valid JSON with these fields:
- person_name: full name of the person (or null)
- title: their new job title (or null)
- company_name: the company they joined (or null)
- move_type: one of "appointed", "named", "joins", "leaves", "promoted" (or null)

Headline: "${headline}"

JSON:`
      }]
    })
    const content = response.content[0]
    if (content.type !== 'text') return { person_name: null, title: null, company_name: null, move_type: null }
    const match = content.text.match(/\{[\s\S]*?\}/)
    if (!match) return { person_name: null, title: null, company_name: null, move_type: null }
    const parsed = JSON.parse(match[0])
    return {
      person_name: parsed.person_name || null,
      title: parsed.title || null,
      company_name: parsed.company_name || null,
      move_type: parsed.move_type || null,
    }
  } catch {
    return { person_name: null, title: null, company_name: null, move_type: null }
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Fetch moves where person_name is null, limit 50
  const { data: moves, error: fetchError } = await supabaseAdmin
    .from('executive_moves')
    .select('id, headline, person_name, title, company_name, move_type')
    .is('person_name', null)
    .order('published_at', { ascending: false })
    .limit(50)

  if (fetchError || !moves) {
    return NextResponse.json({ error: 'Failed to fetch moves', details: fetchError }, { status: 500 })
  }

  let updatedCount = 0

  for (const move of moves) {
    const extracted = await extractMoveDetails(move.headline)

    // Only update if we extracted something meaningful
    if (extracted.person_name || extracted.title || extracted.company_name || extracted.move_type) {
      const { error: updateError } = await supabaseAdmin
        .from('executive_moves')
        .update({
          person_name: extracted.person_name || move.person_name,
          title: extracted.title || move.title,
          company_name: extracted.company_name || move.company_name,
          move_type: extracted.move_type || move.move_type,
        })
        .eq('id', move.id)

      if (!updateError) {
        updatedCount++
      }
    }
  }

  return NextResponse.json({
    processed: moves.length,
    updated: updatedCount,
    timestamp: new Date().toISOString(),
  })
}
