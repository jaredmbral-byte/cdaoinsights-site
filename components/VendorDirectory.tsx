'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export interface LakeVendor {
  name: string
  slug: string
  category: string | null
  sub_category: string | null
  raised: string | null
  founded: number | null
  mention_count?: number | null
  verified_count?: number | null
  last_event_at?: string | null
}

type Sort = 'active' | 'recent' | 'funded' | 'alpha'

const SORTS: [Sort, string][] = [
  ['active', 'Most active'],
  ['recent', 'Recent events'],
  ['funded', 'Most funded'],
  ['alpha', 'A–Z'],
]

function raisedNum(r: string | null): number {
  if (!r) return 0
  const m = r.replace(/[$,]/g, '').match(/([\d.]+)\s*([BMK]?)/i)
  if (!m) return 0
  const u = (m[2] || '').toUpperCase()
  return parseFloat(m[1]) * (u === 'B' ? 1e9 : u === 'M' ? 1e6 : u === 'K' ? 1e3 : 1)
}

// Heat: darker square = more verified events. Stays within the monochrome system.
function heat(v: LakeVendor): number {
  const ver = v.verified_count || 0
  if (ver > 0) return Math.min(0.25 + ver * 0.22, 1)
  if ((v.mention_count || 0) > 0) return 0.12
  return 0.05
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864] mb-2.5">{children}</div>
)

export default function VendorDirectory({ vendors }: { vendors: LakeVendor[] }) {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('active')

  const categories = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of vendors) if (v.category) m.set(v.category, (m.get(v.category) || 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [vendors])

  const activeCount = useMemo(
    () => vendors.filter((v) => (v.verified_count || 0) > 0).length,
    [vendors],
  )

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const rows = vendors.filter(
      (v) =>
        (cat === 'All' || v.category === cat) &&
        (!query || v.name.toLowerCase().includes(query)),
    )
    rows.sort((a, b) => {
      if (sort === 'active')
        return (
          (b.verified_count || 0) - (a.verified_count || 0) ||
          (b.mention_count || 0) - (a.mention_count || 0) ||
          a.name.localeCompare(b.name)
        )
      if (sort === 'recent')
        return (b.last_event_at || '').localeCompare(a.last_event_at || '') || a.name.localeCompare(b.name)
      if (sort === 'funded') return raisedNum(b.raised) - raisedNum(a.raised)
      return a.name.localeCompare(b.name)
    })
    return rows
  }, [vendors, cat, q, sort])

  const catBtn = (label: string, value: string, count?: number) => (
    <button
      key={value}
      onClick={() => setCat(value)}
      className={`flex w-full items-baseline justify-between gap-2 py-1 text-left transition-colors ${
        cat === value ? 'text-[#0A0A0A]' : 'text-[#6B6864] hover:text-[#0A0A0A]'
      }`}
    >
      <span className="text-[13px] truncate">{label}</span>
      {count !== undefined && <span className="font-mono text-[10px] text-[#8A8782] tabular-nums">{count}</span>}
    </button>
  )

  return (
    <section className="max-w-[1200px] mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-[196px_1fr] gap-8 lg:gap-10">
      {/* Nav plane */}
      <aside className="lg:sticky lg:top-[64px] lg:self-start space-y-7">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search vendors"
          className="font-mono text-[12px] bg-transparent border border-[#C9C4BB] rounded-sm px-3 py-1.5 w-full text-[#0A0A0A] placeholder:text-[#8A8782] focus:outline-none focus:border-[#8A8782]"
        />
        <div>
          <Label>Sort</Label>
          <div className="space-y-1">
            {SORTS.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSort(v)}
                className={`block text-[13px] transition-colors ${
                  sort === v ? 'text-[#0A0A0A]' : 'text-[#6B6864] hover:text-[#0A0A0A]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <div className="max-h-[360px] overflow-y-auto pr-1">
            {catBtn('All', 'All', vendors.length)}
            {categories.map(([c, n]) => catBtn(c, c, n))}
          </div>
        </div>
        <div className="pt-2 border-t border-[#C9C4BB]">
          <div className="font-mono text-[11px] text-[#6B6864] tabular-nums">
            {activeCount} active · {vendors.length} tracked
          </div>
          <div className="font-mono text-[10px] text-[#8A8782] mt-1">grows as the loop runs</div>
        </div>
      </aside>

      {/* Results */}
      <div>
        <div className="flex items-baseline justify-between py-2.5 border-b border-[#C9C4BB]">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
            {SORTS.find(([v]) => v === sort)?.[1]}
          </span>
          <span className="font-mono text-[10px] text-[#8A8782] tabular-nums">
            {filtered.length.toLocaleString()} shown
          </span>
        </div>
        <div className="divide-y divide-[#C9C4BB]">
          {filtered.map((v) => (
            <Link
              key={v.slug}
              href={`/vendors/${v.slug}`}
              className="grid grid-cols-[40px_1fr_auto] lg:grid-cols-[44px_minmax(0,1.3fr)_minmax(0,1fr)_96px_60px] gap-3 lg:gap-5 py-3 items-baseline group"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-[1px]"
                  style={{ backgroundColor: `rgba(10,10,10,${heat(v)})` }}
                />
                <span className="font-mono text-[11px] tabular-nums text-[#6B6864] w-4 text-right">
                  {v.verified_count ? v.verified_count : ''}
                </span>
              </div>
              <span className="text-[15px] text-[#0A0A0A] font-medium group-hover:opacity-60 transition-opacity truncate">
                {v.name}
              </span>
              <span className="hidden lg:block font-mono text-[11px] uppercase tracking-[0.03em] text-[#6B6864] truncate">
                {v.sub_category || v.category || ''}
              </span>
              <span className="hidden lg:block font-mono text-[12px] text-[#3A3A3A] tabular-nums text-right">
                {v.raised || ''}
              </span>
              <span className="font-mono text-[11px] text-[#8A8782] tabular-nums text-right">
                {v.founded || ''}
              </span>
            </Link>
          ))}
          {filtered.length === 0 && <div className="py-10 text-[#6B6864] text-sm">No vendors match.</div>}
        </div>
      </div>
    </section>
  )
}
