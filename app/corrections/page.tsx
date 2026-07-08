import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corrections — CDAO Insights',
  description:
    'CDAO Insights corrections policy. We publish automated intelligence from public sources, fix errors fast, and log them here.',
  alternates: { canonical: 'https://cdaoinsights.com/corrections' },
}

export default function CorrectionsPage() {
  return (
    <main className="flex-1">
      <section className="max-w-[760px] mx-auto px-6 pt-16 pb-20">
        <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#6B6864] mb-4">
          Corrections
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#0A0A0A] mb-4">
          Corrections policy
        </h1>
        <p className="text-base text-[#6B6864] leading-relaxed mb-12">
          This site publishes automated intelligence drawn from public sources.
          Automated extraction makes mistakes. When we find one, we fix it fast and note
          it here. See the{' '}
          <a href="/methodology" className="text-[#0A0A0A] underline underline-offset-2">
            methodology
          </a>{' '}
          for how the data is gathered.
        </p>

        <section className="mb-10">
          <h2 className="font-mono text-[11px] font-medium tracking-[2px] uppercase text-[#0A0A0A] mb-3">
            Report an error
          </h2>
          <p className="text-base text-[#3A3835] leading-relaxed">
            Found a wrong title, company, or date? Email{' '}
            <a
              href="mailto:corrections@cdaoinsights.com?subject=Correction"
              className="text-[#0A0A0A] underline underline-offset-2"
            >
              corrections@cdaoinsights.com
            </a>{' '}
            with a link to the source. We aim to fix confirmed errors within one business day.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-mono text-[11px] font-medium tracking-[2px] uppercase text-[#0A0A0A] mb-3">
            Correction log
          </h2>
          <p className="font-mono text-sm text-[#6B6864]">No corrections logged yet.</p>
        </section>
      </section>
    </main>
  )
}
