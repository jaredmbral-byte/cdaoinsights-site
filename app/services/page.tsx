import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GTM Services | CDAO Insights',
  description:
    'Your competitors are already in the room with the buyers you need. Here is how to catch up.',
  alternates: { canonical: 'https://cdaoinsights.com/services' },
  openGraph: {
    title: 'GTM Services | CDAO Insights',
    description: 'Your competitors are already in the room with the buyers you need. Here is how to catch up.',
    url: 'https://cdaoinsights.com/services',
  },
}

const CALENDLY_URL = 'https://calendly.com/jared-m-bral/30min'

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-[1200px] mx-auto px-6 pt-12 pb-10 border-b border-[#1E1E1E]">
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.5px] text-[#E8E8E8] mb-4 max-w-2xl">
            Your competitors are already in the room with the buyers you need.
          </h1>
          <p className="text-sm text-[#888888] leading-relaxed max-w-xl mb-3">
            CDOs, CIOs, CISOs, and CAIOs delete 50 cold emails before lunch. They take meetings from people they trust. Most vendors never figure out how to become one of those people.
          </p>
          <p className="text-sm text-[#888888] leading-relaxed max-w-xl">
            That gap is widening fast. AI is changing how top GTM teams build pipeline. If your outreach still looks the same as it did two years ago, you are already behind.
          </p>
        </section>

        {/* Pain blocks */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-b border-[#1E1E1E]">
          <h2 className="font-mono text-xs uppercase tracking-[2px] text-[#555555] mb-8">
            Sound familiar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#1E1E1E] rounded-sm p-5">
              <p className="text-sm text-[#E8E8E8] font-medium mb-2">Your outreach is not working.</p>
              <p className="text-sm text-[#888888] leading-relaxed">Emails go unanswered. LinkedIn gets ignored. You have a great product and no meetings to show for it.</p>
            </div>
            <div className="border border-[#1E1E1E] rounded-sm p-5">
              <p className="text-sm text-[#E8E8E8] font-medium mb-2">You do not know who to target.</p>
              <p className="text-sm text-[#888888] leading-relaxed">Your ICP is fuzzy. You are selling to everyone and converting no one. The list is big. The pipeline is thin.</p>
            </div>
            <div className="border border-[#1E1E1E] rounded-sm p-5">
              <p className="text-sm text-[#E8E8E8] font-medium mb-2">Your tools are not pulling their weight.</p>
              <p className="text-sm text-[#888888] leading-relaxed">You are paying for CRM, Sales Nav, and enrichment tools. Most of that stack sits underused while your team does everything manually.</p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-b border-[#1E1E1E]">
          <h2 className="font-mono text-xs uppercase tracking-[2px] text-[#555555] mb-8">
            How I help
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#E8E8E8]">Get in front of the right buyers</h3>
                <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-[#00FF94] text-[#00FF94] shrink-0 ml-2">
                  Most Popular
                </span>
              </div>
              <p className="text-xs text-[#888888] mb-4 leading-relaxed">
                I build and run outbound systems that book meetings with senior executives. Cold email sequences that land. Lists that are actually your buyers. Copy that gets replies.
              </p>
              <ul className="space-y-2 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Targeted outreach into CDO, CAIO, CIO, CISO, and CMO audiences
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  ICP definition, list building, and lead enrichment
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Sequences built to convert, not just send
                </li>
              </ul>
              <p className="font-mono text-xs text-[#555555] mt-6">Contact for pricing</p>
            </div>

            {/* Card 2 */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#E8E8E8]">Know exactly who to target and what to say</h3>
                <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-blue-500/30 text-blue-400 shrink-0 ml-2">
                  Strategy
                </span>
              </div>
              <p className="text-xs text-[#888888] mb-4 leading-relaxed">
                Most companies guess at their ICP and wonder why conversion is low. I research your buyer from the inside out and build positioning that speaks to what they actually care about.
              </p>
              <ul className="space-y-2 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Deep ICP research across C-suite buyer personas
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Messaging frameworks grounded in how executives buy
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Market intelligence for VCs, PE firms, and consultancies
                </li>
              </ul>
              <p className="font-mono text-xs text-[#555555] mt-6">Contact for pricing</p>
            </div>

            {/* Card 3 */}
            <div className="border border-[#1E1E1E] rounded-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-[#E8E8E8]">Make your existing tools actually work</h3>
                <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-sm border border-amber-500/30 text-amber-400 shrink-0 ml-2">
                  New
                </span>
              </div>
              <p className="text-xs text-[#888888] mb-4 leading-relaxed">
                Your team is sitting on a CRM, Sales Nav, and a handful of enrichment tools. Most of that stack is being used at 20% capacity. I build AI workflows that change that.
              </p>
              <ul className="space-y-2 flex-1">
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  AI workflows on top of tools you already own
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Lead scoring, signal detection, and automated enrichment
                </li>
                <li className="text-sm text-[#888888] flex items-start">
                  <span className="text-[#00FF94] mr-2 shrink-0">•</span>
                  Lean teams producing results that used to need a full department
                </li>
              </ul>
              <p className="font-mono text-xs text-[#555555] mt-6">Contact for pricing</p>
            </div>

          </div>
        </section>

        {/* Why Jared */}
        <section className="max-w-[1200px] mx-auto px-6 py-12 border-b border-[#1E1E1E]">
          <h2 className="font-mono text-xs uppercase tracking-[2px] text-[#555555] mb-6">
            Why Jared
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                4x Winners Circle Achiever at Gartner. Helped build the Chief Data Officer brand from scratch and led one of Gartner's fastest-growing C-suite programs three years running.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Trusted connector across CDAO, CIO, CISO, and CMO networks. Built peer forums, executive roundtables, and speaker programs across Fortune 500 companies.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                Enterprise sales background spanning Global 2000 accounts in spatial computing and augmented reality, and government identity management with the DoD, FBI, and Navy. Knows how complex buying decisions get made.
              </p>
            </div>
            <div className="border-l-2 border-[#00FF94] pl-4">
              <p className="text-sm text-[#888888] leading-relaxed">
                You work directly with Jared. One person, full accountability. Powered by AI tools that make a lean engagement punch at enterprise scale.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold text-[#E8E8E8] mb-3">
              Your next best customer is already talking to someone.
            </h2>
            <p className="text-sm text-[#888888] mb-6">
              30 minutes. No pitch deck. A straight conversation about where your pipeline is stuck and whether I can help move it.
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
