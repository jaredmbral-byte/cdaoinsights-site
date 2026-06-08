// Static, server-rendered chart primitives for the homepage analytics layer.
// No client JS, no chart library — plain SVG + CSS bars styled to the brand
// guide (ink fills, rule gridlines, JetBrains Mono axis labels).

import type {
  HeadlineStat,
  Delta,
  BarDatum,
  WeekPoint,
  TopicMomentum,
} from '@/lib/homepage-analytics'

const INK = '#0A0A0A'
const MID = '#6B6864'
const RULE = '#C9C4BB'

function DeltaBadge({ delta }: { delta: Delta }) {
  const arrow = delta.dir === 'up' ? '↑' : delta.dir === 'down' ? '↓' : '→'
  return (
    <div className="font-mono text-[10px] mt-1 text-[#3A3A3A] tabular-nums">
      {arrow} {delta.text}
    </div>
  )
}

function EmptyNote() {
  return <p className="text-xs text-[#6B6864] py-4">Not enough data yet — check back as signals accrue.</p>
}

// ── Card chrome ─────────────────────────────────────────────────────────────

export function ChartCard({
  title,
  hint,
  href,
  children,
}: {
  title: string
  hint?: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-[#C9C4BB] rounded-sm p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6864]">{title}</h3>
          {hint && <p className="font-mono text-[10px] text-[#8A8782] mt-0.5 truncate">{hint}</p>}
        </div>
        {href && (
          <a
            href={href}
            className="font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864] hover:text-[#0A0A0A] transition-colors shrink-0"
          >
            All →
          </a>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ── Week-in-numbers strip ───────────────────────────────────────────────────

export function StatStrip({ stats }: { stats: HeadlineStat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-t border-l border-[#C9C4BB]">
      {stats.map((s, i) => {
        const Tag = (s.href ? 'a' : 'div') as 'a'
        return (
          <Tag
            key={i}
            href={s.href}
            className="border-r border-b border-[#C9C4BB] p-4 group hover:bg-[#EDEAE2] transition-colors block"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]">{s.label}</div>
            <div
              className="mt-2 font-sans font-medium tracking-[-0.02em] text-[#0A0A0A] leading-none capitalize"
              style={{ fontSize: 'clamp(20px, 2.2vw, 30px)' }}
            >
              {s.value}
            </div>
            {s.sub && <div className="font-mono text-[10px] text-[#6B6864] mt-1.5">{s.sub}</div>}
            {s.delta && <DeltaBadge delta={s.delta} />}
          </Tag>
        )
      })}
    </div>
  )
}

// ── Horizontal bar list (skills, industries, persona mix) ───────────────────

export function BarList({ items, unit = '' }: { items: BarDatum[]; unit?: string }) {
  if (!items.length) return <EmptyNote />
  const peak = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="flex flex-col">
      {items.map((it, idx) => {
        const pct = Math.max(2, Math.round((it.value / peak) * 100))
        const Tag = (it.href ? 'a' : 'div') as 'a'
        return (
          <Tag
            key={idx}
            href={it.href}
            className="group block py-2 border-b border-[#C9C4BB] last:border-0"
          >
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-[13px] text-[#0A0A0A] truncate capitalize">{it.label}</span>
              <span className="font-mono text-[12px] text-[#0A0A0A] tabular-nums shrink-0">
                {it.value.toLocaleString()}
                {unit}
              </span>
            </div>
            <div className="h-[5px] bg-[#EDEAE2]">
              <div
                className="h-full bg-[#0A0A0A] group-hover:bg-[#3A3A3A] transition-[width,background-color]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Tag>
        )
      })}
    </div>
  )
}

// ── Topic momentum (this week count + WoW delta) ────────────────────────────

export function TopicMomentumList({ items }: { items: TopicMomentum[] }) {
  if (!items.length) return <EmptyNote />
  const peak = Math.max(1, ...items.map((i) => i.thisWeek))
  return (
    <div className="flex flex-col">
      {items.map((it, idx) => {
        const pct = Math.max(2, Math.round((it.thisWeek / peak) * 100))
        const badge =
          it.deltaPct === null
            ? 'new'
            : it.deltaPct > 0
              ? `↑${it.deltaPct}%`
              : it.deltaPct < 0
                ? `↓${Math.abs(it.deltaPct)}%`
                : 'flat'
        return (
          <a
            key={idx}
            href={`/intelligence?topic=${it.topic}`}
            className="group block py-2 border-b border-[#C9C4BB] last:border-0"
          >
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-[13px] text-[#0A0A0A] capitalize">{it.topic.replace(/-/g, ' ')}</span>
              <span className="font-mono text-[11px] text-[#3A3A3A] tabular-nums shrink-0">
                {it.thisWeek} · {badge}
              </span>
            </div>
            <div className="h-[5px] bg-[#EDEAE2]">
              <div
                className="h-full bg-[#0A0A0A] group-hover:bg-[#3A3A3A] transition-[width,background-color]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </a>
        )
      })}
    </div>
  )
}

// ── Weekly trend area chart (appointment velocity) ──────────────────────────

export function TrendArea({
  points,
  height = 150,
  ariaLabel = 'Weekly trend',
}: {
  points: WeekPoint[]
  height?: number
  ariaLabel?: string
}) {
  if (!points.length) return <EmptyNote />
  const W = 720
  const H = height
  const pad = { t: 16, r: 8, b: 24, l: 8 }
  const max = Math.max(1, ...points.map((p) => p.value))
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const n = points.length
  const X = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw)
  const Y = (v: number) => pad.t + ih - (v / max) * ih

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${X(n - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} L${X(0).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      className="block"
    >
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={W - pad.r}
          y1={Y(max * f)}
          y2={Y(max * f)}
          stroke={RULE}
          strokeWidth="1"
          strokeDasharray={f === 0 ? undefined : '2 3'}
        />
      ))}
      <path d={area} fill={INK} opacity="0.06" />
      <path d={line} fill="none" stroke={INK} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.value)} r="2.2" fill={INK} />
      ))}
      {labelIdx.map((i) => (
        <text
          key={i}
          x={X(i)}
          y={H - 7}
          textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          fontFamily="var(--font-inconsolata), monospace"
          fontSize="10"
          fill={MID}
        >
          {points[i].label}
        </text>
      ))}
      <text
        x={W - pad.r}
        y={pad.t - 2}
        textAnchor="end"
        fontFamily="var(--font-inconsolata), monospace"
        fontSize="10"
        fill={MID}
      >
        peak {max}/wk
      </text>
    </svg>
  )
}
