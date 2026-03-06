-- Add persona column for role taxonomy classification
-- Maps job titles to standardized personas (CDO, CAIO, VP Data, Director AI/ML, etc.)
ALTER TABLE hiring_signals ADD COLUMN IF NOT EXISTS persona text;

-- Add tech_stack column for future technology extraction from job descriptions
ALTER TABLE hiring_signals ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}';

-- Index for persona-based queries and dashboard panels
CREATE INDEX IF NOT EXISTS idx_hiring_signals_persona ON hiring_signals (persona);

-- Index for tech stack queries
CREATE INDEX IF NOT EXISTS idx_hiring_signals_tech_stack ON hiring_signals USING GIN (tech_stack);
