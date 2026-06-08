'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface LakeVendor {
  name: string
  slug: string
  category: string | null
  sub_category: string | null
  website_url: string | null
  domain: string | null
  source: string | null
  raised: string | null
  country: string | null
  founded: number | null
}

const SOURCE_LABEL: Record<string, string> = {
  mad: 'MAD',
  'gartner-dna': 'Gartner',
  ai4: 'Ai4',
  manual: 'Manual',
}

export default function VendorDirectory({ vendors }: { vendors: LakeVendor[] }) {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')

  const categories = useMemo(() => {
    const set = new Set(vendors.map((v) => v.category).filter(Boolean) as string[])
    return ['All', ...Array.from(set).sort()]
  }, [vendors])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return vendors.filter(
      (v) =>
        (cat === 'All' || v.category === cat) &&
        (!query || v.name.toLowerCase().includes(query)),
    )
  }, [vendors, cat, q])

  return (
    <section className="max-w-[1200px] mx-auto px-6 pb-24">
      {/* Controls */}
      <div className="sticky top-[52px] z-10 bg-[#F5F3EE] border-y border-[#C9C4BB] py-3 flex items-center gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search vendors"
          className="font-mono text-[12px] bg-transparent border border-[#C9C4BB] rounded-sm px-3 py-1.5 w-[200px] text-[#0A0A0A] placeholder:text-[#8A8782] focus:outline-none focus:border-[#8A8782]"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#8A8782] tabular-nums ml-auto">
          {filtered.length.toLocaleString()} shown
        </span>
      </div>

      {/* Category tabs */}
      <div className="py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-sm border transition-colors ${
                cat === c
                  ? 'border-[#0A0A0A] text-[#0A0A0A]'
                  : 'border-[#C9C4BB] text-[#6B6864] hover:border-[#8A8782]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#C9C4BB] border-t border-[#C9C4BB]">
        {filtered.map((v) => (
          <Link
            key={v.slug}
            href={`/vendors/${v.slug}`}
            className="grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_70px_70px] gap-3 lg:gap-5 py-3 items-baseline group"
          >
            <span className="text-[15px] text-[#0A0A0A] font-medium group-hover:opacity-60 transition-opacity truncate">
              {v.name}
            </span>
            <span className="hidden lg:block font-mono text-[11px] uppercase tracking-[0.03em] text-[#6B6864] truncate">
              {v.sub_category || v.category || ''}
            </span>
            <span className="hidden lg:block font-mono text-[12px] text-[#3A3A3A] tabular-nums text-right">
              {v.raised || ''}
            </span>
            <span className="hidden lg:block font-mono text-[11px] text-[#8A8782] tabular-nums text-right">
              {v.founded || ''}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#8A8782] text-right">
              {SOURCE_LABEL[v.source || ''] || v.source || ''}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-[#6B6864] text-sm">No vendors match.</div>
        )}
      </div>
    </section>
  )
}
