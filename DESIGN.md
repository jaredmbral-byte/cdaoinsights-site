# DESIGN.md — cdaoinsights.com Design System Contract
> Read this file at the start of any session involving UI changes.
> Single source of truth, derived from the Brand Guide V1.0 (April 2026).
> Last updated: 2026-04-21

---

## Brand Direction

CDAO Insights is an operator-run intelligence desk for enterprise Chief Data, Analytics & AI Officers. Field notes, not think pieces. The visual system follows four principles:

1. **Ground truth over narrative.** Every claim sources to a practitioner, filing, budget line or vendor doc.
2. **Small words, load-bearing ones.** Written like engineers to engineers. Specific verbs, plain nouns.
3. **Humble, not hedged.** We acknowledge what's unsettled, then say what we think anyway.
4. **The reader is already senior.** No 101s. We start at the second meeting.

Visually: warm monochrome (paper + ink), serious typography, generous whitespace around the hero, dense information-rich tables below.

---

## Color Tokens

Defined in `tailwind.config.ts` and mirrored as CSS variables in `app/globals.css`. Use the named tokens below — do not introduce new colors.

| Token (Tailwind) | Hex | Usage | Use ratio |
|---|---|---|---|
| `paper` | `#F5F3EE` | Page background | ~70% |
| `paper-2` | `#EDEAE2` | Elevated surfaces, row hover, secondary panels | ~12% |
| `rule` | `#C9C4BB` | All borders, dividers, panel outlines | structural |
| `mid` | `#6B6864` | Secondary text, labels, metadata, source names | ~4% |
| `graphite` | `#3A3A3A` | Body secondary, descriptive paragraphs | ~6% |
| `ink` | `#0A0A0A` | Primary text, headlines, data values | ~8% |
| `chalk` | `#FFFFFF` | Logo containers, white cards on print surfaces | accent |

Legacy aliases (kept for existing code): `bg`, `surface`, `border`, `accent`, `link`, `text.DEFAULT`, `text.muted`, `text.subtle`.

Additional:
- `#8A8782` — hover border (darker rule)
- `#DC2626` — departure badges only (reserved)
- `rgba(0, 0, 0, 0.08)` — text selection background

**Rule:** Do not introduce accent colors, gradients, or semantic badge colors (blue, purple, amber, etc.). Color in this system is structural — it separates surfaces, not decorates them.

---

## Typography

Fonts loaded in `app/layout.tsx` via `next/font/google`:

| Font | CSS variable | Tailwind class | Weights |
|---|---|---|---|
| Inter Tight | `--font-inter` | `font-sans` | 300, 400, 500, 600, 700 |
| JetBrains Mono | `--font-inconsolata` | `font-mono` | 400, 500 |

### Type Scale

| Role | Size | Weight | Tracking | Line height | Font |
|---|---|---|---|---|---|
| H0 (Hero display) | `clamp(56px, 11vw, 184px)` | 500 | `-0.045em` | `0.88` | Inter Tight |
| H1 (Section head) | `clamp(32px, 4.6vw, 68px)` | 500 | `-0.03em` | `1.0` | Inter Tight |
| H2 (Lead) | 32 / 40 | 500 | `-0.025em` | `1.05` | Inter Tight |
| H3 (Subhead) | 22 / 32 | 500 | `-0.015em` | `1.1` | Inter Tight |
| Body | 16 / 24 | 400 | 0 | 1.5 | Inter Tight |
| Caption | 13 / 20 | 400 | 0 | 1.5 | Inter Tight |
| Label | 11 / 16 uppercase | 500 | `0.06em` | 1.5 | JetBrains Mono |

### When to use monospace (`font-mono`)

**Always** use mono for:
- Numbers (stat counts, compensation values, percentages)
- Timestamps ("2h ago", "3d ago")
- Section labels (uppercase like "WHO WE SERVE")
- Hero kicker labels above headings
- Nav links
- Footer text
- Source names, citations
- Count labels in sidebars

**Never** use mono for:
- Hero / display headings
- Article headlines
- Body/description paragraphs
- FAQ questions and answers

### Emphasis within headings

Inside a display heading, emphasis is set by **color** (graphite/`#6B6864`), **not** italic. Example:

```tsx
<h1>Intelligence for the people who <span className="text-[#6B6864]">own the data.</span></h1>
```

Never use italics for emphasis. Never underline for emphasis. Use weight or color.

### Standard patterns

- **Section label:** `font-mono text-[10px] uppercase tracking-[0.06em] text-[#6B6864]`
- **Nav link:** `font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B6864] hover:text-[#0A0A0A] transition-colors`
- **Stat number:** `text-2xl font-semibold text-[#0A0A0A]`

---

## Layout Principles

1. **Max width:** `1400px` for nav / hero / footer (the editorial frame). `1200px` for dense dashboard content.
2. **Gutters:** `px-5` mobile, `lg:px-12` desktop for 1400-wide; `px-6` for 1200-wide.
3. **Hero has breathing room.** `pt-12 lg:pt-24 pb-16 lg:pb-28` with a `pb-12 lg:pb-24` meta row and `mt-16 lg:mt-28 pt-16 lg:pt-24 border-t` sub row.
4. **Data rows are dense.** Stat panels `p-4`, table rows `py-2.5`. Information density wins below the fold.
5. **Border-based elevation.** No shadows. No gradients. Panels: `border border-[#C9C4BB] rounded-sm`. Hover: `hover:border-[#8A8782]`.
6. **Minimal border-radius.** `rounded-sm` only.
7. **Dividers:** `divide-y divide-[#C9C4BB]` inside tables. `border-t border-[#C9C4BB]` between major sections.
8. **Sticky nav:** 52px height, opaque paper background, rule border-bottom.

---

## Link Treatment

- Default: `text-[#0A0A0A]` (inherits)
- Nav hover: `hover:text-[#0A0A0A]` from `text-[#6B6864]` (mid → ink on hover)
- Prominent callout: `underline underline-offset-4 hover:opacity-60`
- Table row headline: `text-[#0A0A0A]` with the row itself gaining `hover:bg-[#EDEAE2]`

No blue links. No color hover shift — only opacity fade or ink-emphasis.

---

## Badge System (Monochrome)

All badges share the same shape:

```
font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border
```

**Default (all topic, person, category, and appointed-type move badges):**
```
border-[#C9C4BB] text-[#6B6864]
```

**Departure badge (only non-monochrome):**
```
border-red-200 text-[#DC2626]
```

No more semantic color per topic. Labels do the work.

---

## Stat Panel Pattern

Used on the homepage dashboard.

```
border border-[#C9C4BB] rounded-sm p-4 hover:border-[#8A8782] transition-colors
```

1. Label: `font-mono text-[10px] uppercase tracking-[1px] text-[#6B6864]`
2. Value: `text-2xl font-semibold text-[#0A0A0A]`
3. Subtitle: `font-mono text-[10px] text-[#6B6864]`

---

## Logo

Primary mark: a "rising signal" composed of an L-axis + three stepped bars + a signal dot. Built on a 6-unit grid, 2x clear space on all sides. The SVG lives inline in `app/layout.tsx` nav. Minimum sizes: 24px (mark alone), 120px (horizontal lockup).

Variants:
- **A — Axis Mark** (primary): mark + wordmark, stacked.
- **B — Quadrant Monogram** (secondary): C·D·A·O in a four-quadrant seal. Use for social avatar.
- **C — Editorial Wordmark** (editorial): large wordmark + rule + INSIGHTS. Use on long-form reports.
- **D — Bracketed Signal** (utility): `[ cdao·insights ]` inline. Use in product UI, code-adjacent surfaces.

---

## Voice (Brand Guide §05)

**We write:**
- "About 41% of the CDAOs we tracked this quarter reported directly to the CEO — up from 28% in 2024."
- "Most 'AI platform' RFPs we've read are really three RFPs stapled together."
- "This is a governance problem before it's a tooling problem."

**We don't:**
- ~~"In today's rapidly evolving data landscape, leaders must unlock transformative value."~~
- ~~"Revolutionize your enterprise AI journey with next-generation insights."~~
- ~~"We're on a mission to democratize data for all."~~

Tone attributes: **Grounded** (not academic, not folksy) · **Humble, insightful** (not hedged, not prophetic) · **Serious, not corporate** (not stiff, not breezy).

---

## AEO Rules (Non-Negotiable)

1. **Never flatten heading hierarchy.** `h1` → `h2` → `h3`. One `h1` per page.
2. **Never remove JSON-LD.** Every page has structured data via `<script type="application/ld+json">`.
3. **FAQ blocks are preserved on all pages.** They exist for AEO.
4. **All content changes are additive only.** Do not remove existing semantic content.
5. **Preserve `aria-label` and `aria-labelledby`.**
6. **OpenGraph and Twitter meta tags** on every page via Next.js `metadata` export.

---

## What Not to Do

- Do not introduce new color schemes, accent colors, or semantic badge colors.
- Do not add rounded cards (`rounded-lg`, `rounded-xl`). Use `rounded-sm` only.
- Do not add shadows or gradients. Elevation is communicated through borders only.
- Do not use italics for emphasis in headings — use color (graphite/mid).
- Do not use blue links or color-shift hover states.
- Do not add decorative icons, illustrations, or emojis unless explicitly requested.
- Do not wrap data tables in carousels or tabs. Visible data beats hidden data.
- Do not use Inter (plain) or Inconsolata. Use Inter Tight and JetBrains Mono.
