// ── Tech stack extraction from job descriptions ──────────────────────────────
// Scans job description text for known data/AI/analytics technology mentions.
// Returns a deduplicated array of technology names found.

const TECH_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  // Cloud data platforms
  { name: 'Snowflake', patterns: [/\bsnowflake\b/i] },
  { name: 'Databricks', patterns: [/\bdatabricks\b/i] },
  { name: 'BigQuery', patterns: [/\bbigquery\b/i, /\bbig\s*query\b/i] },
  { name: 'Redshift', patterns: [/\bredshift\b/i] },
  { name: 'Synapse', patterns: [/\bazure\s*synapse\b/i] },
  { name: 'Fabric', patterns: [/\bmicrosoft\s*fabric\b/i] },

  // Data engineering & integration
  { name: 'dbt', patterns: [/\bdbt\b/] },
  { name: 'Airflow', patterns: [/\bairflow\b/i, /\bapache\s*airflow\b/i] },
  { name: 'Spark', patterns: [/\bapache\s*spark\b/i, /\bpyspark\b/i] },
  { name: 'Kafka', patterns: [/\bkafka\b/i, /\bapache\s*kafka\b/i] },
  { name: 'Fivetran', patterns: [/\bfivetran\b/i] },
  { name: 'Informatica', patterns: [/\binformatica\b/i] },
  { name: 'Talend', patterns: [/\btalend\b/i] },
  { name: 'Matillion', patterns: [/\bmatillion\b/i] },
  { name: 'Dagster', patterns: [/\bdagster\b/i] },
  { name: 'Prefect', patterns: [/\bprefect\b/i] },

  // Data governance & quality
  { name: 'Collibra', patterns: [/\bcollibra\b/i] },
  { name: 'Alation', patterns: [/\balation\b/i] },
  { name: 'Atlan', patterns: [/\batlan\b/i] },
  { name: 'Monte Carlo', patterns: [/\bmonte\s*carlo\b/i] },
  { name: 'Great Expectations', patterns: [/\bgreat\s*expectations\b/i] },
  { name: 'Soda', patterns: [/\bsoda\s*(?:core|cloud|sql)\b/i] },
  { name: 'Informatica MDM', patterns: [/\binformatica\s*mdm\b/i] },

  // BI & analytics
  { name: 'Tableau', patterns: [/\btableau\b/i] },
  { name: 'Power BI', patterns: [/\bpower\s*bi\b/i] },
  { name: 'Looker', patterns: [/\blooker\b/i] },
  { name: 'ThoughtSpot', patterns: [/\bthoughtspot\b/i] },
  { name: 'Qlik', patterns: [/\bqlik\b/i] },
  { name: 'Sigma', patterns: [/\bsigma\s*computing\b/i] },

  // AI/ML platforms
  { name: 'TensorFlow', patterns: [/\btensorflow\b/i] },
  { name: 'PyTorch', patterns: [/\bpytorch\b/i] },
  { name: 'SageMaker', patterns: [/\bsagemaker\b/i] },
  { name: 'Vertex AI', patterns: [/\bvertex\s*ai\b/i] },
  { name: 'Azure ML', patterns: [/\bazure\s*(?:ml|machine\s*learning)\b/i] },
  { name: 'Hugging Face', patterns: [/\bhugging\s*face\b/i] },
  { name: 'LangChain', patterns: [/\blangchain\b/i] },
  { name: 'MLflow', patterns: [/\bmlflow\b/i] },
  { name: 'Weights & Biases', patterns: [/\bweights\s*(?:&|and)\s*biases\b/i, /\bwandb\b/i] },
  { name: 'DataRobot', patterns: [/\bdatarobot\b/i] },
  { name: 'H2O', patterns: [/\bh2o\.ai\b/i, /\bh2o\s*ai\b/i] },

  // Cloud providers
  { name: 'AWS', patterns: [/\baws\b/, /\bamazon\s*web\s*services\b/i] },
  { name: 'Azure', patterns: [/\bazure\b/i, /\bmicrosoft\s*azure\b/i] },
  { name: 'GCP', patterns: [/\bgcp\b/, /\bgoogle\s*cloud\b/i] },

  // Databases
  { name: 'PostgreSQL', patterns: [/\bpostgres(?:ql)?\b/i] },
  { name: 'MongoDB', patterns: [/\bmongodb\b/i] },
  { name: 'Elasticsearch', patterns: [/\belasticsearch\b/i] },
  { name: 'Neo4j', patterns: [/\bneo4j\b/i] },
  { name: 'Cassandra', patterns: [/\bcassandra\b/i] },

  // Programming languages (data context)
  { name: 'Python', patterns: [/\bpython\b/i] },
  { name: 'SQL', patterns: [/\bsql\b/i] },
  { name: 'R', patterns: [/\bR\b(?=\s|,|\/|$)/] },
  { name: 'Scala', patterns: [/\bscala\b/i] },

  // Data formats & tools
  { name: 'Delta Lake', patterns: [/\bdelta\s*lake\b/i] },
  { name: 'Apache Iceberg', patterns: [/\biceberg\b/i] },
  { name: 'Hudi', patterns: [/\bapache\s*hudi\b/i] },
  { name: 'Terraform', patterns: [/\bterraform\b/i] },
  { name: 'Kubernetes', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { name: 'Docker', patterns: [/\bdocker\b/i] },
]

/**
 * Extract technology mentions from job description text.
 * Returns deduplicated array of technology names found.
 */
export function extractTechStack(description: string): string[] {
  if (!description) return []

  const found = new Set<string>()
  for (const tech of TECH_PATTERNS) {
    if (tech.patterns.some(p => p.test(description))) {
      found.add(tech.name)
    }
  }

  return Array.from(found).sort()
}
