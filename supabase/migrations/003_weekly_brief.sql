-- Weekly brief entries for homepage
create table if not exists weekly_brief (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  body text not null,
  week_label text not null,
  category text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table weekly_brief enable row level security;

-- Public read access
create policy "Public read access" on weekly_brief
  for select using (true);

-- Seed initial entries
insert into weekly_brief (headline, body, week_label, category) values
(
  'CDAOs Gaining Ground. 94% Expect More Influence.',
  'Deloitte''s 2026 CDAO Survey finds 94% of respondents expect their organizational influence to grow this year. 78% credit AI directly with expanding their decision-making authority.',
  'March 3, 2026',
  'Leadership'
),
(
  '85% of AI Pilots Never Leave the Lab',
  'Fewer than 15% of organizations successfully scale AI beyond pilot stage. The bottleneck is not model quality. It is data infrastructure, governance, and change management.',
  'March 3, 2026',
  'AI'
),
(
  'Copilot Leaked Emails. DLP Policies Did Nothing.',
  'Microsoft Copilot surfaced confidential emails to unauthorized users despite active Data Loss Prevention policies. Legacy DLP frameworks were not designed for LLM-native retrieval behavior.',
  'March 3, 2026',
  'Risk'
),
(
  'C3.ai Revenue Down 46%. Buyers Are the Problem.',
  'C3.ai posted Q3 revenue down 46% year-over-year. Long procurement timelines and unclear AI ROI frameworks are stalling deals across the sector. This is a buying cycle problem, not a technology problem.',
  'March 3, 2026',
  'Market'
);
