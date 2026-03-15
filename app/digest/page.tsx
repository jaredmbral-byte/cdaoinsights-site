import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weekly Digest Preview | CDAO Insights' }
export const dynamic = 'force-dynamic'

export default async function DigestPreviewPage() {
  // This just links to the API for preview — not a public page
  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-10 pb-24">
      <p className="font-mono text-xs uppercase tracking-[2px] text-[#555555] mb-4">Internal</p>
      <h1 className="text-2xl font-semibold text-[#E8E8E8] mb-4">Weekly Digest</h1>
      <p className="text-sm text-[#888888] mb-6">
        Preview the weekly digest at{' '}
        <a href="/api/digest/weekly" className="text-[#00FF94]">/api/digest/weekly</a>
        {' '}(requires auth header).
      </p>
      <p className="text-xs text-[#555555]">
        To send: integrate with Resend, Loops, or Mailchimp using the HTML from the API response.
      </p>
    </main>
  )
}
