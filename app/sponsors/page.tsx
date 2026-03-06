import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Sponsor CDAO Insights | Reach Enterprise Data & AI Leaders',
  description:
    'Put your brand in front of 10,000+ enterprise CDOs, CAIOs, and senior data leaders. Category-exclusive sponsorship packages starting at $2,500/quarter.',
  robots: { index: false, follow: false },
}

const TIERS = [
  {
    name: 'Signal',
    price: '$2,500',
    period: '/quarter',
    features: [
      'Logo on homepage sponsor bar',
      'Company listing in vendor landscape',
      'Monthly mention in intelligence brief',
      'Category exclusivity',
    ],
  },
  {
    name: 'Intelligence',
    price: '$5,000',
    period: '/quarter',
    highlight: true,
    features: [
      'Everything in Signal, plus:',
      'Sponsored insight article (1/month)',
      'Logo on all section pages',
      'Dedicated sponsor profile page',
      'Priority placement in vendor landscape',
      'Quarterly audience analytics report',
    ],
  },
  {
    name: 'Strategic',
    price: '$10,000',
    period: '/quarter',
    features: [
      'Everything in Intelligence, plus:',
      'Co-branded quarterly research report',
      'Custom audience survey (1/quarter)',
      'Exclusive webinar or roundtable slot',
      'Featured case study with CDO interview',
      'Direct intro to advisory board',
    ],
  },
]

const CATEGORIES = [
  'Data Governance & Catalog',
  'Data Observability & Quality',
  'Data Integration & Pipelines',
  'AI/ML Platforms',
  'Cloud Data Platforms',
  'Data Security & Privacy',
]

const STATS = [
  { value: '10,000+', label: 'Weekly Readers' },
  { value: '72%', label: 'Director+ Seniority' },
  { value: 'Fortune 1000', label: 'Primary Audience' },
  { value: '6', label: 'Sponsor Categories' },
]

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  if (params.key !== 'cdao2026') {
    notFound()
  }

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-16 pb-24 w-full">
      {/* Hero */}
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-4">
        Sponsorship
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-3">
        Put your brand in front of enterprise data &amp; AI leaders
      </h1>
      <p className="text-base text-[#888888] leading-relaxed max-w-2xl mb-12">
        CDAO Insights reaches the people who choose data platforms, set governance
        policy, and sign vendor contracts at the largest companies. Category-exclusive
        sponsorships ensure your brand is the only one in its space.
      </p>

      {/* Audience stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {STATS.map((stat) => (
          <div key={stat.label} className="border border-[#1E1E1E] rounded-sm p-4 text-center">
            <p className="text-2xl font-semibold text-[#00FF94] mb-1">{stat.value}</p>
            <p className="font-mono text-[10px] uppercase tracking-[1px] text-[#888888]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sponsorship tiers */}
      <section className="mb-16">
        <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-6">
          Sponsorship Tiers
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-sm p-6 flex flex-col ${
                tier.highlight ? 'border-[#00FF94]/40 bg-[#00FF94]/[0.03]' : 'border-[#1E1E1E]'
              }`}
            >
              <h3 className="font-mono text-xs uppercase tracking-[2px] text-[#888888] mb-2">{tier.name}</h3>
              <p className="text-2xl font-semibold text-[#E8E8E8] mb-1">
                {tier.price}
                <span className="text-sm font-normal text-[#555555]">{tier.period}</span>
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="text-sm text-[#888888] leading-relaxed flex items-start gap-2">
                    <span className="text-[#00FF94] mt-0.5 flex-shrink-0">&bull;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sponsors@cdaoinsights.com?subject=Sponsorship Inquiry"
                className={`mt-6 block text-center font-mono text-xs uppercase tracking-[1px] px-4 py-2.5 rounded-sm transition-colors ${
                  tier.highlight
                    ? 'bg-[#00FF94] text-[#0A0A0A] hover:bg-[#00CC77]'
                    : 'border border-[#1E1E1E] text-[#888888] hover:border-[#555555] hover:text-[#E8E8E8]'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Available categories */}
      <section className="mb-16">
        <h2 className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-6">
          Available Sponsor Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="border border-[#1E1E1E] rounded-sm px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-[#E8E8E8]">{cat}</span>
              <span className="font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#00FF94]/30 text-[#00FF94]">
                Open
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border border-[#1E1E1E] rounded-sm p-8 text-center">
        <h2 className="text-xl font-semibold text-[#E8E8E8] mb-3">Ready to reach enterprise data leaders?</h2>
        <p className="text-sm text-[#888888] mb-6 max-w-lg mx-auto">
          Email us to discuss sponsorship options, get audience demographics, or schedule a call with our team.
        </p>
        <a
          href="mailto:sponsors@cdaoinsights.com?subject=Sponsorship Inquiry"
          className="inline-block font-mono text-xs uppercase tracking-[1px] px-6 py-3 rounded-sm bg-[#00FF94] text-[#0A0A0A] hover:bg-[#00CC77] transition-colors"
        >
          Contact sponsors@cdaoinsights.com
        </a>
      </section>
    </main>
  )
}
