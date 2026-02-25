import TallyForm from '@/components/TallyForm'

// ─── FAQ data (mirrors JSON-LD in layout for visible page content) ────────────
const faqs = [
  {
    q: 'What is CDAO Insights?',
    a: 'CDAO Insights is an independent community intelligence resource for enterprise Chief Data Officers, Chief AI Officers, and senior data and analytics leaders. It covers data strategy, AI adoption, governance trends, and peer benchmarks across large enterprises — without vendor sponsorship influencing editorial.',
  },
  {
    q: 'What are the top priorities for Chief Data Officers in 2026?',
    a: 'Enterprise CDOs are primarily focused on three areas: operationalizing AI at scale, improving data quality and governance as the foundation for AI reliability, and demonstrating measurable business value from data investments. Agentic AI for data stewardship, unstructured data governance, and MDM modernization are emerging as high-priority initiatives.',
  },
  {
    q: 'What is the difference between a Chief Data Officer and a Chief AI Officer?',
    a: 'A Chief Data Officer (CDO) is responsible for enterprise data strategy, governance, data quality, and infrastructure. A Chief AI Officer (CAIO) focuses on AI strategy, model deployment, and AI governance. The roles are increasingly separate at large enterprises. The distinction matters: CDOs own the data foundation; CAIOs own what gets built on top of it.',
  },
  {
    q: 'What data governance challenges are enterprises facing in 2026?',
    a: 'The most common enterprise data governance challenges are: managing data quality at the scale required for AI reliability, governing unstructured data as GenAI adoption accelerates, maintaining data lineage across multi-cloud environments, and building stewardship programs that scale without proportional headcount growth.',
  },
  {
    q: 'How are large enterprises structuring their data and AI organizations?',
    a: 'Most large enterprises are moving toward a hybrid model: a central data platform team that owns infrastructure, governance, and standards, paired with embedded data professionals within business units. Chief AI Officer roles are increasingly separate from CDO functions, particularly where multiple AI deployments are in production.',
  },
]

export default function Home() {
  return (
    <div className="relative z-10 flex flex-col min-h-screen font-sans">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="w-full border-b border-[#D9D6D0]">
        <nav
          className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between"
          aria-label="Main navigation"
        >
          <a
            href="/"
            className="font-mono font-medium text-sm uppercase tracking-[2px] text-[#1A1A1A]"
            aria-label="CDAO Insights home"
          >
            CDAO Insights
          </a>
          <a
            href="#join"
            className="font-mono text-sm uppercase tracking-[2px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            Join →
          </a>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section
          className="max-w-3xl mx-auto px-6 pt-24 pb-20"
          aria-labelledby="hero-heading"
        >
          {/* Eyebrow */}
          <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-6">
            Community Intelligence Resource
          </p>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-light leading-[1.15] tracking-[-1px] text-[#1A1A1A] mb-6"
          >
            What enterprise data and AI leaders are{' '}
            <em className="not-italic text-[#6B6B6B]">actually</em> building
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-[#6B6B6B] leading-relaxed max-w-2xl mb-12">
            Peer signals, market context, and trends for CDOs, CAIOs, and senior
            data leaders at large enterprises. No vendor agendas. No thought
            leadership theater.
          </p>

          {/* Email Capture */}
          <div
            id="join"
            className="bg-white border border-[#D9D6D0] rounded-xl p-6 sm:p-8 max-w-lg"
          >
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">
              Get the briefing
            </p>
            <p className="text-sm text-[#6B6B6B] mb-5">
              Join data and AI leaders at enterprise organizations.
            </p>
            <TallyForm />
            <p className="text-xs text-[#999590] mt-4">
              No spam. No vendor partnerships that shape what you read.
              Unsubscribe any time.
            </p>
          </div>
        </section>

        {/* ── Pillars ──────────────────────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-6 pb-24 border-t border-[#D9D6D0] pt-16"
          aria-label="What CDAO Insights covers"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Peer Intelligence
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                What your counterparts are prioritizing, where they&apos;re
                struggling, and what&apos;s actually shipping inside enterprise
                organizations.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Market Signals
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Where enterprise data and AI investment is moving — sourced from
                hiring patterns, org changes, and technology adoption before the
                analysts catch up.
              </p>
            </article>
            <article>
              <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#1A1A1A] mb-3">
                Independent
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Community-driven editorial. No sponsor determines what gets
                covered or how it&apos;s framed. The signal stays clean.
              </p>
            </article>
          </div>
        </section>

        {/* ── FAQ (AEO-optimized) ───────────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-6 pb-24 border-t border-[#D9D6D0] pt-16"
          aria-labelledby="faq-heading"
        >
          <h2
            id="faq-heading"
            className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#999590] mb-12"
          >
            Context
          </h2>
          <dl className="space-y-10">
            {faqs.map((item, i) => (
              <div key={i}>
                <dt className="text-base font-medium text-[#1A1A1A] mb-3">
                  {item.q}
                </dt>
                <dd className="text-sm text-[#6B6B6B] leading-relaxed max-w-2xl">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#D9D6D0]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#999590]">
            CDAO Insights — Enterprise data &amp; AI leaders
          </span>
          <span className="font-mono text-xs uppercase tracking-[2px] text-[#B5B1AB]">
            © {new Date().getFullYear()} CDAO Insights
          </span>
        </div>
      </footer>

    </div>
  )
}
