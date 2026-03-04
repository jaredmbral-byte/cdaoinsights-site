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

export default function HiringTicker() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
  }, [])

  if (!stats || stats.hiring.total === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[1px] text-[#555555]">
        Appointments
      </span>
      <span className="font-mono text-[11px] text-[#00FF94] tabular-nums">
        {stats.hiring.last90}
      </span>
      <span className="font-mono text-[11px] text-[#555555]">/ 90d</span>
    </div>
  )
}
