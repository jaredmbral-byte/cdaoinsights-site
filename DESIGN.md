# DESIGN.md — cdaoinsights.com Design System Contract
> Read this file at the start of any session involving UI changes.
> Do not deviate from the tokens, patterns, or principles documented here.
> Last updated: 2026-03-06

---

## Color Tokens

Defined in `tailwind.config.ts` and mirrored as CSS variables in `app/globals.css`.

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0A0A0A` | Page background, scrollbar track |
| `surface` | `#111111` | Card/panel hover state, elevated surface |
| `border` | `#1E1E1E` | All borders, dividers, panel outlines |
| `accent` | `#00FF94` | Stat numbers, live pulse indicator, active filters, selection highlight |
| `link` | `#3B82F6` | Hover color for article/move headlines |
| `danger` | `#EF4444` | Departure badges ("Departs"), error states |
| `text.DEFAULT` | `#E8E8E8` | Primary text, headlines, data values |
| `text.muted` | `#888888` | Secondary text, company names, source names, sidebar labels |
| `text.subtle` | `#555555` | Tertiary text, timestamps, section headers, footer |

Additional hardcoded values used in components:
- `#333` / `#333333` — border on hover state, scrollbar thumb hover, general badge fallback border
- `rgba(0, 255, 148, 0.2)` — text selection background

**Rule:** Do not introduce new colors. All UI elements must use only the tokens above.

---

## Typography

Fonts loaded in `app/layout.tsx` via `next/font/google`:

| Font | Variable | Tailwind class | Weights loaded |
|---|---|---|---|
| Inter | `--font-inter` | `font-sans` | Variable (all) |
| Inconsolata | `--font-inconsolata` | `font-mono` | 400, 500, 700 |

### When to use monospace (`font-mono`)

**Always** use `font-mono` for:
- Numbers (stat counts, compensation values, percentages)
- Timestamps ("2h ago", "3d ago")
- Category/topic badges
- Section headers (uppercase labels like "WEEKLY BRIEF", "EXECUTIVE MOVES")
- Nav links
- Footer text
- Source names
- Count labels in sidebars

**Never** use `font-mono` for:
- Article headlines
- FAQ questions and answers
- Body/description text
- Hero heading and subheading

### Section header pattern

```
font-mono text-[10px] uppercase tracking-[2px] text-[#555555]
```

Used consistently across all dashboard panels for section labels.

### Nav link pattern

```
font-mono text-xs uppercase tracking-[2px] text-[#888888] hover:text-[#E8E8E8] transition-colors
```

---

## Layout Principles

1. **Max width:** `1200px` centered with `px-6` horizontal padding.
2. **Information density over whitespace.** Panels are compact. Padding inside panels is `p-4`. Row padding is `py-2.5`.
3. **Border-based elevation.** No shadows. No gradients. Panels are `border border-[#1E1E1E] rounded-sm`. Hover state adds `hover:border-[#333]`.
4. **Minimal border-radius.** Use `rounded-sm` only. Never `rounded-lg`, `rounded-xl`, or `rounded-full` on panels/cards.
5. **Grid-based dashboard layout.** Homepage uses `grid-cols-[280px_1fr]` on desktop. Intelligence uses `grid-cols-[240px_1fr]`. Both collapse to single column on mobile.
6. **Minimal vertical scrolling.** Above-fold content should show stat panels + primary data table. FAQ and reference content is below fold.
7. **Dividers:** `divide-y divide-[#1E1E1E]` between table rows. `border-t border-[#1E1E1E]` between major sections.
8. **Sticky nav:** 56px (`h-14`), semi-transparent with backdrop blur: `bg-[#0A0A0A]/95 backdrop-blur-sm`.

---

## Signal/Category Badge System

### Topic badges (intelligence articles)

Pattern: `font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border`

| Topic | Border | Text |
|---|---|---|
| `ai` | `border-blue-500/30` | `text-blue-400` |
| `genai` | `border-purple-500/30` | `text-purple-400` |
| `governance` | `border-amber-500/30` | `text-amber-400` |
| `strategy` | `border-green-500/30` | `text-green-400` |
| `leadership` | `border-rose-500/30` | `text-rose-400` |
| `funding` | `border-emerald-500/30` | `text-emerald-400` |
| `data-quality` | `border-orange-500/30` | `text-orange-400` |
| `security` | `border-red-500/30` | `text-red-400` |
| `agentic-ai` | `border-indigo-500/30` | `text-indigo-400` |
| `infrastructure` | `border-cyan-500/30` | `text-cyan-400` |
| `general` | `border-[#333]` | `text-[#888888]` |

### Move type badges

Pattern: `font-mono text-[10px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border`

- Default: `border-[#1E1E1E] text-[#888888]`
- "Departs" (leaves): `border-red-500/30 text-[#EF4444]`

### Weekly brief category badges

Pattern: `font-mono text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-sm border border-[#1E1E1E] text-[#888888]`

### Person name badges

Same pattern as weekly brief category badges.

---

## Stat Panel Pattern

Used on the homepage dashboard. 4-column grid on desktop, 2-column on mobile.

```
border border-[#1E1E1E] rounded-sm p-4 hover:border-[#333] transition-colors
```

Content structure:
1. Label: `font-mono text-[10px] uppercase tracking-[1px] text-[#555555]`
2. Value: `text-2xl font-semibold text-[#00FF94]`
3. Subtitle: `font-mono text-[10px] text-[#555555]`

---

## Information Structure per Entry

### Intelligence article rows (signal table)

1. **Headline** — `text-sm text-[#E8E8E8]`, link hover to `text-[#3B82F6]`, `line-clamp-1`
2. **Topic badges** — max 2 per row
3. **Source name** — `font-mono text-[10px] text-[#555555]`
4. **Timestamp** — `font-mono text-[10px] text-[#555555]`, right-aligned

### Executive move rows

1. **Headline** — `text-sm text-[#E8E8E8]`, link hover to `text-[#3B82F6]`
2. **Company name** — `text-[#888888]` inline with pipe separator
3. **Timestamp** — `font-mono` inline
4. **Person badge + move type badge** — right-aligned

### Weekly brief cards (2x2 grid)

1. **Category badge** — top
2. **Headline** — `text-sm font-medium text-[#E8E8E8]`
3. **Body** — `text-xs text-[#888888] leading-relaxed`

---

## AEO Rules (Non-Negotiable)

1. **Never flatten heading hierarchy.** `h1` → `h2` → `h3`. One `h1` per page.
2. **Never remove JSON-LD.** Every page has structured data via `<script type="application/ld+json">`. The root layout has WebSite + Organization + FAQPage schemas.
3. **FAQ blocks are preserved on all pages.** They exist for AEO and must not be removed, even if they're below the fold.
4. **All content changes are additive only.** Do not remove existing semantic content. Add new panels alongside existing content.
5. **Preserve `aria-label` and `aria-labelledby` attributes** on sections and nav.
6. **OpenGraph and Twitter meta tags** on every page via Next.js `metadata` export.

---

## What Not to Do

- Do not introduce new color schemes or color tokens beyond those documented above.
- Do not add rounded cards (`rounded-lg`, `rounded-xl`). Use `rounded-sm` only.
- Do not reduce information density. More data visible above fold is always better.
- Do not remove `font-mono` from data elements (numbers, timestamps, badges, labels).
- Do not add shadows or gradients. Elevation is communicated through borders only.
- Do not use card-based layouts with large padding. Rows and compact panels are preferred.
- Do not add decorative elements (icons, illustrations, emojis) unless explicitly requested.
- Do not wrap data tables in carousels or tabs. Visible data beats hidden data.
