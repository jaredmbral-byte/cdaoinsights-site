'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  hiring: {
    last30: number
    last60: number
    last90: number
    total: number
  }
  articles: {
    total: number
  }
  recentHires: Array<{
    job_title: string
    company_name: string
    seniority: string | null
    industry: string | null
    posted_at: string | null
    source_url: string | null
  }>
  topIndustries: Array<{ name: string; count: number }>
}

type TimeWindow = '30' | '60' | '90'

export default function HiringTicker() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [window, setWindow] = useState<TimeWindow>('90')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="border border-[#D9D6D0] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-[#E8E5E0] rounded w-32 mb-4" />
        <div className="h-8 bg-[#E8E5E0] rounded w-20 mb-2" />
        <div className="h-3 bg-[#E8E5E0] rounded w-48" />
      </div>
    )
  }

  if (!stats || stats.hiring.total === 0) {
    return null // Don't show ticker if no data
  }

  const count =
    window === '30'
      ? stats.hiring.last30
      : window === '60'
        ? stats.hiring.last60
        : stats.hiring.last90

  return (
    <div className="border border-[#D9D6D0] rounded-xl overflow-hidden">
      {/* Stat bar */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590]">
            CDO &amp; CAIO Appointment Tracker
          </p>
          {/* Time window toggle */}
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
            {count === 1 ? 'leader' : 'leaders'} appointed
          </span>
        </div>

        <p className="text-xs text-[#B5B1AB]">
          New Chief Data Officer, Chief AI Officer &amp; VP Data appointments at enterprise organizations in the last {window} days
        </p>
      </div>

      {/* Recent hires list */}
      {stats.recentHires.length > 0 && (
        <div className="border-t border-[#D9D6D0]">
          <div className="px-6 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#B5B1AB] mb-2">
              Latest signals
            </p>
          </div>
          <div className="divide-y divide-[#E8E5E0]">
            {stats.recentHires.slice(0, 3).map((hire, i) => (
              <div key={i} className="px-6 py-2.5 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors">
                <div className="min-w-0 flex-1">
                  {hire.source_url ? (
                    <a
                      href={hire.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1A1A1A] font-medium hover:underline truncate block"
                    >
                      {hire.job_title}
                    </a>
                  ) : (
                    <span className="text-sm text-[#1A1A1A] font-medium truncate block">
                      {hire.job_title}
                    </span>
                  )}
                  <span className="text-xs text-[#999590]">{hire.company_name}</span>
                </div>
                {hire.seniority && (
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded bg-[#F0EEE9] text-[#6B6B6B] ml-3 flex-shrink-0">
                    {hire.seniority}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-[#E8E5E0]">
            <a
              href="/hiring"
              className="font-mono text-xs uppercase tracking-[1px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              View all →
            </a>
          </div>
        </div>
      )}

      {/* Top industries */}
      {stats.topIndustries.length > 0 && (
        <div className="border-t border-[#D9D6D0] px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#B5B1AB] mb-3">
            Top hiring industries
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.topIndustries.map((ind) => (
              <span
                key={ind.name}
                className="font-mono text-[10px] uppercase tracking-[1px] px-2.5 py-1 rounded-full border border-[#D9D6D0] text-[#6B6B6B]"
              >
                {ind.name} ({ind.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
