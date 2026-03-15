-- Vendor seed data for cdaoinsights /vendors page
-- Generated from Notion Gartner D&A Summit exhibitor list (March 2026)
-- 43 vendors across data/AI categories

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text,
  description text default '',
  use_case text default '',
  website_url text,
  logo_url text,
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists vendor_signals (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  signal_date date not null,
  job_mention_count int default 0,
  news_mention_count int default 0,
  created_at timestamptz default now()
);

INSERT INTO vendors (name, slug, website_url, category, description, use_case, featured) VALUES
  ('Alation', 'alation', 'https://alation.com', 'Governance', '', '', false),
  ('Atlan', 'atlan', 'https://atlan.com', 'Governance', '', '', false),
  ('Collibra', 'collibra', 'https://collibra.com', 'Governance', '', '', false),
  ('DataHub (Acryl Data)', 'datahub-acryl-data', 'https://datahubproject.io', 'Governance', '', '', false),
  ('Informatica', 'informatica', 'https://informatica.com', 'Governance', '', '', false),
  ('Coalesce', 'coalesce', 'https://coalesce.io', 'Governance', '', '', false),
  ('Databricks', 'databricks', 'https://databricks.com', 'Data Platform', '', '', false),
  ('Snowflake', 'snowflake', 'https://snowflake.com', 'Data Platform', '', '', false),
  ('Cloudera', 'cloudera', 'https://cloudera.com', 'Data Platform', '', '', false),
  ('AWS', 'aws', 'https://aws.amazon.com', 'Data Platform', '', '', false),
  ('Google Cloud', 'google-cloud', 'https://cloud.google.com', 'Data Platform', '', '', false),
  ('Microsoft', 'microsoft', 'https://microsoft.com', 'Data Platform', '', '', false),
  ('Oracle', 'oracle', 'https://oracle.com', 'Data Platform', '', '', false),
  ('Reltio', 'reltio', 'https://reltio.com', 'Integration', '', '', false),
  ('Semarchy', 'semarchy', 'https://semarchy.com', 'Integration', '', '', false),
  ('Fivetran', 'fivetran', 'https://fivetran.com', 'Integration', '', '', false),
  ('Actian', 'actian', 'https://actian.com', 'Integration', '', '', false),
  ('Dataiku', 'dataiku', 'https://dataiku.com', 'AI & Analytics', '', '', false),
  ('SAS', 'sas', 'https://sas.com', 'AI & Analytics', '', '', false),
  ('Teradata', 'teradata', 'https://teradata.com', 'AI & Analytics', '', '', false),
  ('ThoughtSpot', 'thoughtspot', 'https://thoughtspot.com', 'AI & Analytics', '', '', false),
  ('Qlik', 'qlik', 'https://qlik.com', 'AI & Analytics', '', '', false),
  ('Alteryx', 'alteryx', 'https://alteryx.com', 'AI & Analytics', '', '', false),
  ('Pyramid Analytics', 'pyramid-analytics', 'https://pyramidanalytics.com', 'AI & Analytics', '', '', false),
  ('Monte Carlo', 'monte-carlo', 'https://montecarlodata.com', 'Observability', '', '', false),
  ('Acceldata', 'acceldata', 'https://acceldata.io', 'Observability', '', '', false),
  ('Precisely', 'precisely', 'https://precisely.com', 'Observability', '', '', false),
  ('SAP', 'sap', 'https://sap.com', 'Enterprise Suite', '', '', false),
  ('Salesforce', 'salesforce', 'https://salesforce.com', 'Enterprise Suite', '', '', false),
  ('IBM', 'ibm', 'https://ibm.com', 'Enterprise Suite', '', '', false),
  ('Siemens', 'siemens', 'https://siemens.com', 'Enterprise Suite', '', '', false),
  ('Dun & Bradstreet', 'dun-bradstreet', 'https://dnb.com', 'Data Intelligence', '', '', false),
  ('Neo4j', 'neo4j', 'https://neo4j.com', 'Data Intelligence', '', '', false),
  ('Capital One Software', 'capital-one-software', 'https://capitalonesoftware.com', 'Data Intelligence', '', '', false),
  ('Varonis', 'varonis', 'https://varonis.com', 'Data Security', '', '', false),
  ('CYERA', 'cyera', 'https://cyera.com', 'Data Security', '', '', false),
  ('Thales', 'thales', 'https://thalesgroup.com', 'Data Security', '', '', false),
  ('Kiteworks', 'kiteworks', 'https://kiteworks.com', 'Data Security', '', '', false),
  ('FASOO', 'fasoo', 'https://fasoo.com', 'Data Security', '', '', false),
  ('Commvault', 'commvault', 'https://commvault.com', 'Data Resilience', '', '', false),
  ('DataBee (Comcast)', 'databee-comcast', 'https://databee.ai', 'Data Resilience', '', '', false),
  ('Airia', 'airia', 'https://airia.com', 'AI Governance', '', '', false),
  ('GitLab', 'gitlab', 'https://gitlab.com', 'AI Governance', '', '', false)
ON CONFLICT (slug) DO NOTHING;

-- Done: 43 vendors