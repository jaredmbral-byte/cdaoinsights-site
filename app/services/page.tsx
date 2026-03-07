import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GTM Services for the CDAO Market | CDAO Insights',
  description:
    'GTM strategy, market intelligence, and community access for data and AI vendors targeting CDO and CAIO buyers. Built by Jared Bral.',
  alternates: { canonical: 'https://cdaoinsights.com/services' },
  openGraph: {
    title: 'GTM Services for the CDAO Market | CDAO Insights',
    description: 'GTM strategy, market intelligence, and community access for data and AI vendors targeting CDO and CAIO buyers.',
    url: 'https://cdaoinsights.com/services',
  },
}

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-[1200px] mx-auto px-6 pt-12 pb-8 border-b border-[#1E1E1E]">
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.5px] text-[#E8E8E8] mb-3">
            GTM for the CDAO Market
          </h1>
          <p className="text-sm text-[#888888] leading-relaxed max-w-xl">
            Strategic go-to-market services for data and AI vendors targeting enterprise CDO, CAIO, and VP Data buyers.
          </p>
        </section>

        {/* Service Cards */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: GTM Strategy */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    GTM Strategy &amp; Execution
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-[#00FF94] text-[#00FF94]">
                    Most Popular
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For data/AI vendors (Alation, Fivetran, Monte Carlo, Alteryx types) who want to reach CDOs, CAIOs, and VPs of Data
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Build and run their go-to-market motion into the enterprise data/AI buyer community
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Outbound sequences, event strategy, content positioning
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Sponsor/partner plays
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Starting at $10,000/mo
                </p>
                <a
                  href="mailto:jared@cdaoinsights.com?subject=GTM Strategy & Execution Inquiry"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Get in Touch
                </a>
              </div>
            </div>

            {/* Card 2: Market Intelligence */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    Market Intelligence Reports
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-blue-500/30 text-blue-400">
                    New
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For VCs, PE firms, consultancies, and enterprise data/AI vendors who need sharp, credible intelligence on the CDAO market
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Custom research briefs and ongoing intelligence
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Powered by cdaoinsights.com data and direct community access
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Starting at $3,500 per report / $5,500/mo ongoing
                </p>
                <a
                  href="mailto:jared@cdaoinsights.com?subject=Market Intelligence Report Inquiry"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Get in Touch
                </a>
              </div>
            </div>

            {/* Card 3: Sponsorship */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    Sponsorship &amp; Community Access
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-amber-500/30 text-amber-400">
                    Limited Availability
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For data/AI vendors who want visibility with a targeted audience of senior data and AI leaders
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Category-exclusive sponsorship packages on cdaoinsights.com
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Featured placement in intelligence briefs and weekly digests
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Access to the CDAO community for research and feedback
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Starting at $8,000/quarter
                </p>
                <a
                  href="mailto:jared@cdaoinsights.com?subject=Sponsorship & Community Access Inquiry"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Why Jared */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-t border-[#1E1E1E]">
          <h2 className="font-mono text-xs uppercase tracking-[2px] text-[#555555] mb-6">
            Why Jared
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                10+ years building event and community brands for enterprise data, AI, and CDAIO audiences. Started at Evanta (a Gartner company) in 2017.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Deep relationships in the enterprise data and AI vendor space. Built this exact audience from the ground up.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Now runs cdaoinsights.com as a real-time intelligence resource for CDOs and CAIOs. Direct access to the community that data/AI vendors need to reach.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Practitioner perspective. No agency fluff. Built to serve the buyer community first, which makes vendor GTM more credible and effective.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
