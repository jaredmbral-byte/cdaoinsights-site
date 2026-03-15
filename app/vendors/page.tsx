import { createServerClient } from '@/lib/supabase-server'
import VendorGrid from '@/components/VendorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data & AI Vendor Landscape | CDAO Insights',
  description:
    'Track the tools and platforms CDOs are buying and deploying in 2026 — from data platforms to AI governance.',
  keywords: 'data vendors, AI vendors, CDO tools, data governance platforms, enterprise data stack',
  alternates: { canonical: 'https://cdaoinsights.com/vendors' },
  openGraph: {
    title: 'Data & AI Vendor Landscape | CDAO Insights',
    description: 'Track the tools and platforms CDOs are buying and deploying in 2026 — from data platforms to AI governance.',
    url: 'https://cdaoinsights.com/vendors',
    siteName: 'CDAO Insights',
    type: 'website',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: { card: 'summary_large_image', site: '@cdaoinsights' },
}

export const revalidate = 900 // 15 minutes

export interface Vendor {
  id: string
  name: string
  slug: string
  category: string | null
  website_url: string | null
  job_mention_count?: number
}

export default async function VendorsPage() {
  const supabase = createServerClient()

  // Fetch vendors
  const vendorsResult = await supabase
    .from('vendors')
    .select('id, name, slug, category, website_url')
    .order('name', { ascending: true })

  const vendors = (vendorsResult.data || []) as Vendor[]

  // Fetch vendor mention counts from hiring_signals (last 90 days)
  const cutoff90 = new Date()
  cutoff90.setDate(cutoff90.getDate() - 90)

  const techResult = await supabase
    .from('hiring_signals')
    .select('job_title, tech_stack')
    .gte('posted_at', cutoff90.toISOString())

  const techRows = (techResult.data || []) as Array<{ job_title: string; tech_stack: string[] | null }>

  // Calculate vendor mentions (same logic as homepage)
  const TRACKED_VENDORS = vendors.map(v => v.name)
  const vendorCounts: Record<string, number> = {}
  TRACKED_VENDORS.forEach(v => { vendorCounts[v] = 0 })

  for (const row of techRows) {
    const searchText = `${row.job_title} ${(row.tech_stack || []).join(' ')}`.toLowerCase()
    for (const vendor of TRACKED_VENDORS) {
      if (searchText.includes(vendor.toLowerCase())) {
        vendorCounts[vendor]++
      }
    }
  }

  // Merge mention counts with vendor data
  const vendorsWithMentions = vendors.map(v => ({
    ...v,
    job_mention_count: vendorCounts[v.name] || 0
  }))

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-10 pb-24 w-full">
      {/* Header */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-2">
        Vendor Intelligence
      </p>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-2">
        The Data &amp; AI Vendor Landscape
      </h1>
      <p className="text-sm text-[#888888] leading-relaxed max-w-2xl mb-8">
        Tools and platforms CDOs are buying, deploying, and tracking in 2026
      </p>

      <VendorGrid vendors={vendorsWithMentions} />
    </main>
  )
}
