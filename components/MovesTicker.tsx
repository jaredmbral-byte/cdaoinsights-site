'use client'

import { useEffect, useState, useRef } from 'react'

interface MoveItem {
  id: string
  headline: string
  person_name: string | null
  company_name: string | null
  move_type: string | null
  source_url: string
  published_at: string | null
}

interface MovesData {
  moves: MoveItem[]
  counts: {
    last30: number
    last60: number
    last90: number
  }
}

type TimeWindow = '30' | '60' | '90'

const MOVE_TYPE_LABELS: Record<string, string> = {
  appointed: 'Appointed',
  named: 'Named',
  joins: 'Joins',
  leaves: 'Departs',
  promoted: 'Promoted',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function MovesTicker() {
  const [data, setData] = useState<MovesData | null>(null)
  const [window, setWindow] = useState<TimeWindow>('90')
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/stats/moves')
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-scroll animation
  useEffect(() => {
    if (!scrollRef.current || paused || !data?.moves.length) return

    const el = scrollRef.current
    let animId: number

    const step = () => {
      if (el.scrollTop >= el.scrollHeight - el.clientHeight) {
        el.scrollTop = 0
      } else {
        el.scrollTop += 0.5
      }
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [paused, data])

  if (loading) {
    return (
      <div className="border border-[#D9D6D0] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-[#E8E5E0] rounded w-32 mb-4" />
        <div className="h-8 bg-[#E8E5E0] rounded w-20 mb-2" />
        <div className="h-3 bg-[#E8E5E0] rounded w-48" />
      </div>
    )
  }

  if (!data || data.moves.length === 0) {
    return null
  }

  const count =
    window === '30'
      ? data.counts.last30
      : window === '60'
        ? data.counts.last60
        : data.counts.last90

  return (
    <div className="border border-[#D9D6D0] rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590]">
            Executive Moves
          </p>
          <div className="flex gap-1">
            {(['30', '60', '90'] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-full transition-colors ${
                  window === w
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#999590] hover:text-[#1A1A1A]'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-4xl font-light tracking-[-2px] text-[#1A1A1A]">
            {count}
          </span>
          <span className="text-sm text-[#6B6B6B]">
            {count === 1 ? 'move' : 'moves'} tracked
          </span>
        </div>

        <p className="text-xs text-[#B5B1AB]">
          CDO, CAIO &amp; CDAIO appointments and departures in the last {window} days
        </p>
      </div>

      {/* Scrolling moves list */}
      <div className="border-t border-[#D9D6D0]">
        <div className="px-6 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#B5B1AB] mb-2">
            Latest moves
          </p>
        </div>
        <div
          ref={scrollRef}
          className="max-h-[220px] overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="divide-y divide-[#E8E5E0]">
            {data.moves.slice(0, 10).map((move) => (
              <div
                key={move.id}
                className="px-6 py-2.5 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={move.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1A1A1A] font-medium hover:underline truncate block"
                  >
                    {move.headline}
                  </a>
                  <div className="flex items-center gap-2 text-xs text-[#999590]">
                    {move.company_name && (
                      <span className="text-[#6B6B6B]">{move.company_name}</span>
                    )}
                    {move.published_at && (
                      <>
                        {move.company_name && <span className="text-[#D9D6D0]">|</span>}
                        <span>{timeAgo(move.published_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                {move.move_type && (
                  <span className={`font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded ml-3 flex-shrink-0 ${
                    move.move_type === 'leaves'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-[#F0EEE9] text-[#6B6B6B]'
                  }`}>
                    {MOVE_TYPE_LABELS[move.move_type] || move.move_type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-3 border-t border-[#E8E5E0]">
          <a
            href="/moves"
            className="font-mono text-xs uppercase tracking-[1px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          >
            View all moves →
          </a>
        </div>
      </div>
    </div>
  )
}
