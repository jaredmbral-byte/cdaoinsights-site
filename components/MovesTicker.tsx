'use client'

import { useEffect, useState } from 'react'

interface MovesData {
  moves: Array<{
    id: string
    headline: string
    person_name: string | null
    company_name: string | null
    move_type: string | null
    source_url: string
    published_at: string | null
  }>
  counts: {
    last30: number
    last60: number
    last90: number
  }
}

export default function MovesTicker() {
  const [data, setData] = useState<MovesData | null>(null)

  useEffect(() => {
    fetch('/api/stats/moves')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [])

  if (!data || data.moves.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[1px] text-[#555555]">
        Moves
      </span>
      <span className="font-mono text-[11px] text-[#00FF94] tabular-nums">
        {data.counts.last90}
      </span>
      <span className="font-mono text-[11px] text-[#555555]">/ 90d</span>
    </div>
  )
}
