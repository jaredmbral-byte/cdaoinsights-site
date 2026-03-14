import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GTM Services for the CDAO Market | CDAO Insights',
  description:
    'Cold outreach systems, ICP research, and AI-powered GTM workflows for data and AI vendors targeting CDO and CAIO buyers. Built by Jared Bral.',
  alternates: { canonical: 'https://cdaoinsights.com/services' },
  openGraph: {
    title: 'GTM Services for the CDAO Market | CDAO Insights',
    description: 'Cold outreach systems, ICP research, and AI-powered GTM workflows for data and AI vendors targeting CDO and CAIO buyers.',
    url: 'https://cdaoinsights.com/services',
  },
}

const CALENDLY_URL = 'https://calendly.com/jared-m-bral/30min'

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
            Cold outreach systems, ICP research, and AI-powered GTM workflows for data and AI vendors targeting enterprise CDO, CAIO, and VP Data buyers. No agency overhead. Practitioner execution.
          </p>
        </section>

        {/* Service Cards */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Card 1: Outbound & Cold Outreach */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    Outbound & Cold Outreach
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-[#00FF94] text-[#00FF94]">
                    Most Popular
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For data/AI vendors and startups who need a repeatable pipeline into senior data and AI executives
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Build and run cold email systems that actually land in inboxes
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  ICP definition, list building, and lead enrichment
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Sequencing, copy, and optimization — built to book meetings
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Direct access to a network of senior CDO and CAIO contacts
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Contact for pricing
                </p>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Book a 30-Min Call
                </a>
              </div>
            </div>

            {/* Card 2: ICP Research & Positioning */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    ICP Research & Positioning
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-blue-500/30 text-blue-400">
                    Strategy
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For vendors, VCs, and PE firms who need to understand the CDAO buyer and sharpen their market positioning
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Deep ICP profiling — who buys, why, and when
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Competitive positioning and messaging frameworks
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Market intelligence powered by cdaoinsights.com data
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Custom research briefs for diligence and strategy
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Contact for pricing
                </p>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Book a 30-Min Call
                </a>
              </div>
            </div>

            {/* Card 3: AI-Powered GTM Systems */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#E8E8E8]">
                    AI-Powered GTM Systems
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-amber-500/30 text-amber-400">
                    New
                  </span>
                </div>
                <p className="text-xs text-[#888888] mb-4">
                  For lean GTM teams who want to punch above their weight using tools they already own
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  AI workflows built on top of your CRM, Sales Nav, and enrichment stack
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Lead scoring, context enrichment, and signal-based outreach automation
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  No new tools required — better results from what you already pay for
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2">•</span>
                  Built for small teams with enterprise-level pipeline goals
                </li>
              </ul>

              <div className="mt-auto">
                <p className="font-mono text-xs text-[#555555] mb-3">
                  Contact for pricing
                </p>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 border border-[#1E1E1E] rounded-sm text-sm text-[#E8E8E8] hover:border-[#00FF94] hover:text-[#00FF94] transition-colors"
                >
                  Book a 30-Min Call
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
                10+ years building GTM and community programs for the enterprise data and AI market. Started at Evanta (a Gartner company) in 2017 selling $25k–$50k thought leadership sponsorships to vendors like Alation, Fivetran, and Monte Carlo.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Not an agency. No account managers, no overhead, no fluff. You work directly with the person who knows this market cold.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Runs cdaoinsights.com — a real-time intelligence platform for senior data and AI executives. Direct access to the exact buyers your team is trying to reach.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Uses best-in-class AI tools to deliver enterprise-quality GTM output at a fraction of the cost. Lean teams, big results.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-t border-[#1E1E1E]">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold text-[#E8E8E8] mb-3">
              Ready to build pipeline into the CDAO market?
            </h2>
            <p className="text-sm text-[#888888] mb-6">
              30 minutes. No pitch deck. Just a straight conversation about what you're trying to do and whether I can help.
            </p>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-[#00FF94] rounded-sm text-sm text-[#00FF94] hover:bg-[#00FF94] hover:text-black transition-colors font-medium"
            >
              Book a 30-Min Call
            </a>
          </div>
        </section>

      </main>
    </div>
  )
}
