import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology — CDAO Insights',
  description:
    'How CDAO Insights gathers its data: public sources only, automated screening and de-duplication, daily refresh, and where the limits are.',
  alternates: { canonical: 'https://cdaoinsights.com/methodology' },
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-mono text-[11px] font-medium tracking-[2px] uppercase text-[#0A0A0A] mb-3">
        {heading}
      </h2>
      <div className="text-base text-[#3A3835] leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function MethodologyPage() {
  return (
    <main className="flex-1">
      <section className="max-w-[760px] mx-auto px-6 pt-16 pb-20">
        <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#6B6864] mb-4">
          Methodology
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#0A0A0A] mb-4">
          How this data is gathered
        </h1>
        <p className="text-base text-[#6B6864] leading-relaxed mb-12">
          CDAO Insights tracks the data and AI leadership market from public sources.
          Here is exactly where the data comes from, what our labels mean, and where the
          limits are.
        </p>

        <Section heading="Sources">
          <p>
            Every item comes from a public source. Press releases, news coverage,
            PR Newswire, public job boards and company careers pages, and public company
            filings. We do not use private, paywalled, or non-public data.
          </p>
        </Section>

        <Section heading='What "screened" means'>
          <p>
            Items pass an automated relevance filter and de-duplication step. Screened
            means the system matched the item to the data and AI leadership beat and
            removed obvious noise and repeats.
          </p>
          <p>
            Screened does not mean a human confirmed every fact. It is an automated
            signal, and you should treat it as a lead worth checking, not a verified record.
          </p>
        </Section>

        <Section heading="How often it updates">
          <p>
            The executive moves, hiring, and market intelligence feeds refresh daily
            through automated ingestion. The homepage and section pages read the latest
            rows each time you load them.
          </p>
        </Section>

        <Section heading="Editorial independence">
          <p>
            Sponsorship does not influence what gets tracked or how it is ranked. Sponsors
            buy visibility to this audience. They do not buy coverage or placement in the feeds.
          </p>
        </Section>

        <Section heading="Limits and accuracy">
          <p>
            Automated extraction makes mistakes. It can misattribute a job title, a
            company, or a date, especially when a headline is ambiguous. We are honest
            about that.
          </p>
          <p>
            When we find an error we fix it and note it on the{' '}
            <a href="/corrections" className="text-[#0A0A0A] underline underline-offset-2">
              corrections page
            </a>
            . If you spot one, please tell us there.
          </p>
        </Section>
      </section>
    </main>
  )
}
