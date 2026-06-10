import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import VendorDirectory, { type LakeVendor } from '@/components/VendorDirectory'

export const metadata: Metadata = {
  title: 'Vendor Lake | CDAO Insights',
  description:
    'Every enterprise data and AI vendor we track, monitored daily for funding, launches, and moves.',
}
export const dynamic = 'force-dynamic'

async function fetchAllVendors(): Promise<LakeVendor[]> {
  const sb = createServerClient()
  const FULL = 'name,slug,category,sub_category,raised,founded,mention_count,verified_count,last_event_at'
  const BASIC = 'name,slug,category,sub_category,raised,founded'
  // Graceful before migration 005: fall back if the activity columns don't exist yet.
  const probe = await sb.from('vendors').select(FULL).limit(1)
  const cols = probe.error ? BASIC : FULL
  const all: LakeVendor[] = []
  for (let start = 0; start < 4000; start += 1000) {
    const { data } = await sb
      .from('vendors')
      .select(cols)
      .order('name', { ascending: true })
      .range(start, start + 999)
    if (!data || data.length === 0) break
    all.push(...(data as unknown as LakeVendor[]))
    if (data.length < 1000) break
  }
  return all
}

export default async function VendorsPage() {
  const vendors = await fetchAllVendors()
  return (
    <main className="flex-1">
      <header className="max-w-[1200px] mx-auto px-6 pt-12 lg:pt-20 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
            Vendor Lake
          </span>
          <span className="h-px flex-1 bg-[#C9C4BB]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
            {vendors.length.toLocaleString()} tracked
          </span>
        </div>
        <h1 className="font-sans font-medium text-[#0A0A0A] tracking-[-0.03em] leading-[1.0] text-[clamp(36px,5.5vw,64px)]">
          The data &amp; AI <span className="text-[#6B6864]">landscape.</span>
        </h1>
        <p className="mt-5 max-w-[640px] text-[#3A3A3A] text-[16px] leading-[1.5]">
          Every vendor selling into the enterprise data and AI stack, watched daily for funding,
          launches, and leadership moves. New entrants are added as they surface.
        </p>
      </header>
      <VendorDirectory vendors={vendors} />
    </main>
  )
}
