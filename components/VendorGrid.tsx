'use client'

import { useState } from 'react'
import type { Vendor } from '@/lib/types'

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  'Data Platform': 'border-[#C9C4BB] text-[#6B6864]',
  'Governance': 'border-[#C9C4BB] text-[#6B6864]',
  'AI & Analytics': 'border-[#C9C4BB] text-[#6B6864]',
  'Observability': 'border-[#C9C4BB] text-[#6B6864]',
  'Integration': 'border-[#C9C4BB] text-[#6B6864]',
  'Enterprise Suite': 'border-[#C9C4BB] text-[#6B6864]',
  'Data Intelligence': 'border-[#C9C4BB] text-[#6B6864]',
  'Data Security': 'border-[#C9C4BB] text-[#6B6864]',
  'Data Resilience': 'border-[#C9C4BB] text-[#6B6864]',
  'AI Governance': 'border-[#C9C4BB] text-[#6B6864]',
}

interface VendorGridProps {
  vendors: Vendor[]
}

export default function VendorGrid({ vendors }: VendorGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [sortMode, setSortMode] = useState<'alpha' | 'mentions'>('alpha')

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(vendors.map(v => v.category).filter(Boolean) as string[]))]

  // Filter by category
  const filteredVendors = activeCategory === 'All'
    ? vendors
    : vendors.filter(v => v.category === activeCategory)

  // Sort vendors
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (sortMode === 'mentions') {
      return (b.job_mention_count || 0) - (a.job_mention_count || 0)
    }
    return a.name.localeCompare(b.name)
  })

  return (
    <>
      {/* Category Filter Tabs */}
      <div className="mb-6 pb-4 border-b border-[#C9C4BB] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'border-[#0A0A0A] text-[#0A0A0A] bg-[#0A0A0A]/5'
                  : 'border-[#C9C4BB] text-[#6B6864] hover:border-[#8A8782] hover:text-[#0A0A0A]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#6B6864]">
          {sortedVendors.length} vendor{sortedVendors.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSortMode('mentions')}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              sortMode === 'mentions'
                ? 'border-[#0A0A0A] text-[#0A0A0A] bg-[#0A0A0A]/5'
                : 'border-[#C9C4BB] text-[#6B6864] hover:border-[#8A8782] hover:text-[#0A0A0A]'
            }`}
          >
            Most Mentions
          </button>
          <button
            onClick={() => setSortMode('alpha')}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              sortMode === 'alpha'
                ? 'border-[#0A0A0A] text-[#0A0A0A] bg-[#0A0A0A]/5'
                : 'border-[#C9C4BB] text-[#6B6864] hover:border-[#8A8782] hover:text-[#0A0A0A]'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Vendor Grid */}
      {sortedVendors.length === 0 ? (
        <div className="border border-[#C9C4BB] rounded-sm p-12 text-center">
          <p className="text-sm text-[#6B6864]">No vendors found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-[#C9C4BB] rounded-sm p-4 hover:border-[#8A8782] transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-[#0A0A0A] group-hover:text-[#0A0A0A] transition-colors">
                  {vendor.name}
                </h3>
                {vendor.job_mention_count !== undefined && vendor.job_mention_count > 0 && (
                  <span className="font-mono text-xs font-semibold text-[#0A0A0A] flex-shrink-0 ml-2">
                    {vendor.job_mention_count}
                  </span>
                )}
              </div>

              {vendor.category && (
                <span className={`inline-block font-mono text-[9px] uppercase tracking-[1px] px-2 py-1 rounded-sm border mb-2 ${
                  CATEGORY_COLORS[vendor.category] || 'border-[#8A8782] text-[#6B6864]'
                }`}>
                  {vendor.category}
                </span>
              )}

              {vendor.website_url && (
                <a
                  href={vendor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#6B6864] hover:text-[#0A0A0A] transition-colors block truncate"
                >
                  {vendor.website_url.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
