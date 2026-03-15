import type { Metadata } from 'next'
import { Inter, Inconsolata } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const inconsolata = Inconsolata({
  subsets: ['latin'],
  variable: '--font-inconsolata',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CDAO Insights | Intelligence for Chief Data & AI Officers',
  description:
    'The go-to resource for CDOs and CAIOs — executive moves, compensation benchmarks, hiring signals, and weekly intelligence briefs.',
  keywords: 'chief data officer, CDAO, CDO insights, data executive intelligence, CDO compensation, CDO moves',
  metadataBase: new URL('https://cdaoinsights.com'),
  alternates: { canonical: 'https://cdaoinsights.com' },
  openGraph: {
    title: 'CDAO Insights | Intelligence for Chief Data & AI Officers',
    description:
      'The go-to resource for CDOs and CAIOs — executive moves, compensation benchmarks, hiring signals, and weekly intelligence briefs.',
    url: 'https://cdaoinsights.com',
    siteName: 'CDAO Insights',
    type: 'website',
    locale: 'en_US',
    images: [{ url: 'https://cdaoinsights.com/og-default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cdaoinsights',
    title: 'CDAO Insights | Intelligence for Chief Data & AI Officers',
    description: 'The go-to resource for CDOs and CAIOs — executive moves, compensation benchmarks, hiring signals, and weekly intelligence briefs.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

// AEO: Structured data for AI answer engines and search
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://cdaoinsights.com/#website',
      url: 'https://cdaoinsights.com',
      name: 'CDAO Insights',
      description:
        'Community intelligence resource for enterprise Chief Data Officers, Chief AI Officers, and senior data leaders.',
      publisher: { '@id': 'https://cdaoinsights.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://cdaoinsights.com/#organization',
      name: 'CDAO Insights',
      url: 'https://cdaoinsights.com',
      description:
        'An independent community resource for enterprise Chief Data Officers (CDOs), Chief AI Officers (CAIOs), and senior data and analytics leaders. Covers data strategy, governance, AI adoption, and organizational trends across large enterprises.',
      foundingDate: '2026',
      knowsAbout: [
        'Chief Data Officer',
        'Chief AI Officer',
        'Enterprise Data Strategy',
        'Data Governance',
        'AI Adoption',
        'Data Maturity',
        'Master Data Management',
        'Data Quality',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://cdaoinsights.com/#faq',
      mainEntity: [
        { '@type': 'Question', name: 'What is CDAO Insights?', acceptedAnswer: { '@type': 'Answer', text: 'CDAO Insights is an independent community intelligence resource for enterprise Chief Data Officers (CDOs), Chief AI Officers (CAIOs), and senior data and analytics leaders. It covers data strategy, AI adoption, governance trends, and peer benchmarks across large enterprises \u2014 without vendor sponsorship influencing editorial.' } },
        { '@type': 'Question', name: 'What are the top priorities for Chief Data Officers in 2026?', acceptedAnswer: { '@type': 'Answer', text: 'In 2026, enterprise CDOs are primarily focused on three areas: operationalizing AI and machine learning at scale, improving data quality and governance as a foundational requirement for AI reliability, and demonstrating measurable business value from data investments.' } },
        { '@type': 'Question', name: 'What is the difference between a Chief Data Officer and a Chief AI Officer?', acceptedAnswer: { '@type': 'Answer', text: 'A Chief Data Officer (CDO) is responsible for enterprise data strategy, governance, data quality, and infrastructure. A Chief AI Officer (CAIO) focuses on AI strategy, model deployment, and AI governance. The roles are increasingly separate at large enterprises. CDOs own the data foundation; CAIOs own what gets built on top of it.' } },
        { '@type': 'Question', name: 'What data governance challenges are enterprises facing in 2026?', acceptedAnswer: { '@type': 'Answer', text: 'The most common challenges are: managing data quality at the scale required for AI reliability, governing unstructured data as GenAI adoption accelerates, maintaining data lineage across multi-cloud environments, and building stewardship programs that scale without proportional headcount growth.' } },
        { '@type': 'Question', name: 'How are large enterprises structuring their data and AI organizations?', acceptedAnswer: { '@type': 'Answer', text: 'Most large enterprises use a hybrid model: a central data platform team that owns infrastructure, governance, and standards, combined with embedded data professionals within business units. Chief AI Officer roles are increasingly separate from CDO functions.' } },
        { '@type': 'Question', name: 'How should a CDO structure their data organization?', acceptedAnswer: { '@type': 'Answer', text: 'Most enterprise CDOs use a hybrid model: a central data platform team (infrastructure, governance, tooling) combined with embedded data leads in business units. The center of excellence handles standards; the embedded leads handle execution. Flat is better \u2014 CDOs with fewer than 3 reporting layers move faster.' } },
        { '@type': 'Question', name: 'What AI governance framework do CDOs use?', acceptedAnswer: { '@type': 'Answer', text: 'The most common frameworks are NIST AI RMF (especially post-EU AI Act), internal model risk management (MRM) adapted from financial services, and ISO/IEC 42001. Most CDOs layer these on top of existing data governance programs rather than building standalone AI governance from scratch.' } },
        { '@type': 'Question', name: 'What is the difference between data mesh and data fabric?', acceptedAnswer: { '@type': 'Answer', text: 'Data mesh is an organizational and ownership model \u2014 domain teams own and serve their own data products. Data fabric is a technology architecture \u2014 a unified integration layer that connects disparate sources via metadata and automation. They are not mutually exclusive.' } },
        { '@type': 'Question', name: 'Who does the CDO typically report to?', acceptedAnswer: { '@type': 'Answer', text: 'Most CDOs report to the CEO (especially in data-native or heavily regulated industries), CTO, or COO. Reporting to the CFO is common in financial services. CDOs with CEO reporting lines consistently have more budget authority and strategic influence.' } },
        { '@type': 'Question', name: 'What KPIs does a CDO track?', acceptedAnswer: { '@type': 'Answer', text: 'Common CDO KPIs include: data product adoption rate, data quality scores, time-to-insight for business requests, AI/ML model deployment velocity, data governance compliance rate, cost per data asset served, and revenue or cost savings attributed to data initiatives.' } },
        { '@type': 'Question', name: 'What do CDOs read to stay current?', acceptedAnswer: { '@type': 'Answer', text: 'CDOs rely on MIT Sloan Management Review (data strategy), Harvard Business Review (leadership), Gartner research (vendor and market), TDWI briefings (technical depth), and peer networks like CDO Forum and MIT CDOIQ Symposium.' } },
        { '@type': 'Question', name: 'Where do CDOs network and meet peers?', acceptedAnswer: { '@type': 'Answer', text: 'Top venues: MIT CDOIQ Symposium (Cambridge, MA), CDO Forum events, DataCouncil conferences, Gartner Data & Analytics Summit, and private peer groups run by firms like Evanta and CDAO Division.' } },
        { '@type': 'Question', name: 'What is a data product and why do CDOs care?', acceptedAnswer: { '@type': 'Answer', text: 'A data product is a curated, documented, and reliably maintained data asset that consumers can discover and use without understanding its underlying pipelines. CDOs care because data products shift the org from reactive data delivery to scalable self-service.' } },
        { '@type': 'Question', name: 'Why do AI pilots fail in enterprise data organizations?', acceptedAnswer: { '@type': 'Answer', text: 'Top reasons: poor data quality, lack of clear business problem definition, no plan for operationalizing post-pilot, absence of executive sponsorship past proof-of-concept, and governance gaps that cause legal or compliance blocks at deployment.' } },
        { '@type': 'Question', name: 'How long do CDOs stay in their roles?', acceptedAnswer: { '@type': 'Answer', text: 'CDO tenure is short \u2014 typically 2 to 3 years on average. Government CDOs average 3\u20134 years. Healthcare and insurance 2.5\u20133.5 years. Financial services and manufacturing 2\u20132.5 years. Retail CDOs have the shortest tenure at 1.5\u20132 years.' } },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${inconsolata.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="bg-[#0A0A0A] text-[#E8E8E8]">
        {/* ── Sticky Nav ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#1E1E1E]">
          <nav
            className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between"
            aria-label="Main navigation"
          >
            <a
              href="/"
              className="font-mono font-bold text-sm tracking-[3px] text-[#E8E8E8] uppercase"
              aria-label="CDAO Insights home"
            >
              CDAO INSIGHTS
            </a>
            <div className="flex items-center gap-6">
              <a href="/moves" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Moves
              </a>
              <a href="/hiring" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Hiring
              </a>
              <a href="/intelligence" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Intelligence
              </a>
              <a href="/ai-tools" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                AI Tools
              </a>
              <a href="/compensation" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Compensation
              </a>
              <a href="/services" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Services
              </a>
            </div>
          </nav>
        </header>

        {children}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#1E1E1E]">
          <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="font-mono text-xs uppercase tracking-[2px] text-[#555555]">
              CDAO Insights — Enterprise data &amp; AI leaders
            </span>
            <span className="font-mono text-xs uppercase tracking-[2px] text-[#555555]">
              &copy; {new Date().getFullYear()} CDAO Insights
            </span>
          </div>
        </footer>
      </body>
    </html>
  )
}
