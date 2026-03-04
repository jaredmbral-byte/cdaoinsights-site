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
  title: 'CDAO Insights — Intelligence for Enterprise Data & AI Leaders',
  description:
    'A community resource for Chief Data Officers, Chief AI Officers, and senior data leaders at enterprise organizations. Peer signals, trends, and market intelligence — without the vendor noise.',
  metadataBase: new URL('https://cdaoinsights.com'),
  alternates: { canonical: 'https://cdaoinsights.com' },
  openGraph: {
    title: 'CDAO Insights',
    description:
      'Intelligence for enterprise data and AI leaders. Peer signals, benchmarks, and market context.',
    url: 'https://cdaoinsights.com',
    siteName: 'CDAO Insights',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CDAO Insights',
    description: 'Intelligence for enterprise data and AI leaders.',
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
        {
          '@type': 'Question',
          name: 'What is CDAO Insights?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CDAO Insights is an independent community intelligence resource for enterprise Chief Data Officers (CDOs), Chief AI Officers (CAIOs), and senior data and analytics leaders. It covers data strategy, AI adoption, governance trends, and peer benchmarks across large enterprises — without vendor sponsorship influencing editorial.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the top priorities for Chief Data Officers in 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In 2026, enterprise CDOs are primarily focused on three areas: operationalizing AI and machine learning at scale, improving data quality and governance as a foundational requirement for AI reliability, and demonstrating measurable business value from data investments. Agentic AI for data stewardship, unstructured data governance, and MDM modernization are emerging as high-priority initiatives.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between a Chief Data Officer and a Chief AI Officer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Chief Data Officer (CDO) is typically responsible for enterprise data strategy, governance, data quality, and infrastructure. A Chief AI Officer (CAIO) focuses on AI strategy, model deployment, and AI governance. The roles are increasingly separate at large enterprises, though many organizations still combine them under a CDAO or Chief Data and AI Officer title. The distinction matters: CDOs own the data foundation; CAIOs own what gets built on top of it.',
          },
        },
        {
          '@type': 'Question',
          name: 'What data governance challenges are enterprises facing in 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The most common enterprise data governance challenges in 2026 are: managing data quality at the scale required for AI model reliability, governing unstructured data as GenAI adoption accelerates, maintaining data lineage across complex multi-cloud environments, and building data stewardship programs that scale without proportional headcount growth. Master data management (MDM) backlogs are a persistent operational bottleneck at large financial services, healthcare, and manufacturing organizations.',
          },
        },
        {
          '@type': 'Question',
          name: 'How are large enterprises structuring their data and AI organizations?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Most large enterprises are moving toward a hybrid model: a central data platform team that owns infrastructure, governance, and standards, combined with embedded data professionals within individual business units. Chief AI Officer roles are increasingly separate from CDO functions, particularly at companies with multiple AI deployments in production. The federated or data mesh model is gaining traction at organizations with mature platform capabilities.',
          },
        },
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
              <a href="/compensation" className="font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors">
                Compensation
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
