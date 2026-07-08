import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-inconsolata',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CDAO Insights | Intelligence for Chief Data & AI Officers',
  description:
    'The go-to resource for CDOs and CAIOs: executive moves, hiring signals, market intelligence, and weekly briefs.',
  keywords: 'chief data officer, CDAO, CDO insights, data executive intelligence, CDO moves',
  metadataBase: new URL('https://cdaoinsights.com'),
  alternates: { canonical: 'https://cdaoinsights.com' },
  openGraph: {
    title: 'CDAO Insights | Intelligence for Chief Data & AI Officers',
    description:
      'The go-to resource for CDOs and CAIOs: executive moves, hiring signals, market intelligence, and weekly briefs.',
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
    description: 'The go-to resource for CDOs and CAIOs: executive moves, hiring signals, market intelligence, and weekly briefs.',
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
        { '@type': 'Question', name: 'What is CDAO Insights?', acceptedAnswer: { '@type': 'Answer', text: 'CDAO Insights is an independent intelligence resource for enterprise Chief Data Officers (CDOs), Chief AI Officers (CAIOs), and senior data and analytics leaders. It tracks executive moves, hiring signals, and market and vendor intelligence across large enterprises. Vendor sponsorship does not influence editorial.' } },
        { '@type': 'Question', name: 'What does CDAO Insights cover?', acceptedAnswer: { '@type': 'Answer', text: 'Four tracks: executive appointments and departures in data and AI leadership, senior data and AI job postings, market and vendor intelligence, and enterprise AI tool activity.' } },
        { '@type': 'Question', name: 'Where does CDAO Insights data come from?', acceptedAnswer: { '@type': 'Answer', text: 'Public sources: press releases, news coverage, company announcements, public job boards and company careers pages, and public filings.' } },
        { '@type': 'Question', name: 'How often is CDAO Insights updated?', acceptedAnswer: { '@type': 'Answer', text: 'Hiring, market intelligence, and executive move feeds refresh daily.' } },
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
    <html lang="en" className={`${interTight.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="bg-[#F5F3EE] text-[#0A0A0A]">
        {/* ── Sticky Nav (Brand Guide: mono uppercase, 0.06em tracking) ── */}
        <header className="sticky top-0 z-50 bg-[#F5F3EE] border-b border-[#C9C4BB]">
          <nav
            className="max-w-[1400px] mx-auto px-5 lg:px-12 h-[52px] flex items-center justify-between"
            aria-label="Main navigation"
          >
            <a
              href="/"
              className="flex items-center gap-2.5 text-[#0A0A0A]"
              aria-label="CDAO Insights home"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
                <line x1="0" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.4" />
                <line x1="0" y1="2" x2="0" y2="16" stroke="currentColor" strokeWidth="1.4" />
                <rect x="2.5" y="11" width="2" height="5" fill="currentColor" />
                <rect x="6.5" y="7" width="2" height="9" fill="currentColor" />
                <rect x="10.5" y="3" width="2" height="13" fill="currentColor" />
                <circle cx="11.5" cy="1.5" r="1.2" fill="currentColor" />
              </svg>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#0A0A0A]">
                CDAO Insights
              </span>
            </a>
            <div className="hidden md:flex items-center gap-7">
              <a href="/moves" className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                Moves
              </a>
              <a href="/hiring" className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                Hiring
              </a>
              <a href="/intelligence" className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B6864] hover:text-[#0A0A0A] transition-colors">
                Intelligence
              </a>
            </div>
            <div className="flex md:hidden items-center gap-4">
              <a href="/moves" className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#0A0A0A]">Moves</a>
              <a href="/hiring" className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#0A0A0A]">Hiring</a>
              <a href="/intelligence" className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#0A0A0A]">Intel</a>
            </div>
            <div className="hidden lg:block font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">
              V1.0
            </div>
          </nav>
        </header>

        {children}
        <Analytics />

        {/* ── Footer (Brand Guide: ink bg, paper text) ─────────────────── */}
        <footer className="bg-[#0A0A0A] text-[#F5F3EE] mt-24">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-12 py-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            <div className="max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#8A8782] mb-5">
                End of document
              </p>
              <h3 className="font-sans font-medium text-2xl sm:text-4xl leading-[1.05] tracking-[-0.025em] text-balance">
                Field notes for the people making the architecture calls.
              </h3>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#8A8782] sm:text-right">
              CDAO Insights · V1.0<br />
              &copy; {new Date().getFullYear()} · cdaoinsights.com
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
