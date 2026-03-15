'use client'

import { useState } from 'react'
import type { Vendor } from '@/app/vendors/page'

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  'Data Platform': 'border-blue-500/30 text-blue-400',
  'Governance': 'border-amber-500/30 text-amber-400',
  'AI & Analytics': 'border-purple-500/30 text-purple-400',
  'Observability': 'border-cyan-500/30 text-cyan-400',
  'Integration': 'border-emerald-500/30 text-emerald-400',
  'Enterprise Suite': 'border-rose-500/30 text-rose-400',
  'Data Intelligence': 'border-indigo-500/30 text-indigo-400',
  'Data Security': 'border-red-500/30 text-red-400',
  'Data Resilience': 'border-orange-500/30 text-orange-400',
  'AI Governance': 'border-violet-500/30 text-violet-400',
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
      <div className="mb-6 pb-4 border-b border-[#1E1E1E] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'border-[#00FF94] text-[#00FF94] bg-[#00FF94]/5'
                  : 'border-[#1E1E1E] text-[#888888] hover:border-[#333] hover:text-[#E8E8E8]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#555555]">
          {sortedVendors.length} vendor{sortedVendors.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSortMode('mentions')}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              sortMode === 'mentions'
                ? 'border-[#00FF94] text-[#00FF94] bg-[#00FF94]/5'
                : 'border-[#1E1E1E] text-[#888888] hover:border-[#333] hover:text-[#E8E8E8]'
            }`}
          >
            Most Mentions
          </button>
          <button
            onClick={() => setSortMode('alpha')}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 rounded-sm border transition-colors ${
              sortMode === 'alpha'
                ? 'border-[#00FF94] text-[#00FF94] bg-[#00FF94]/5'
                : 'border-[#1E1E1E] text-[#888888] hover:border-[#333] hover:text-[#E8E8E8]'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Vendor Grid */}
      {sortedVendors.length === 0 ? (
        <div className="border border-[#1E1E1E] rounded-sm p-12 text-center">
          <p className="text-sm text-[#555555]">No vendors found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-[#E8E8E8] group-hover:text-[#00FF94] transition-colors">
                  {vendor.name}
                </h3>
                {vendor.job_mention_count !== undefined && vendor.job_mention_count > 0 && (
                  <span className="font-mono text-xs font-semibold text-[#00FF94] flex-shrink-0 ml-2">
                    {vendor.job_mention_count}
                  </span>
                )}
              </div>

              {vendor.category && (
                <span className={`inline-block font-mono text-[9px] uppercase tracking-[1px] px-2 py-1 rounded-sm border mb-2 ${
                  CATEGORY_COLORS[vendor.category] || 'border-[#333] text-[#888888]'
                }`}>
                  {vendor.category}
                </span>
              )}

              {vendor.website_url && (
                <a
                  href={vendor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#555555] hover:text-[#3B82F6] transition-colors block truncate"
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
