import { createServerClient } from "@/lib/supabase-server";
import { cleanTitle } from "@/lib/text";
import type { MarketArticle } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enterprise AI Tools Tracker | CDAO Insights",
  description: "Real-time tracking of enterprise AI tools CDOs and CAIOs are deploying. Snowflake Cortex, Databricks AI, agentic analytics, and more.",
  alternates: { canonical: "https://cdaoinsights.com/ai-tools" },
  openGraph: {
    title: "Enterprise AI Tools Tracker | CDAO Insights",
    description: "Real-time tracking of enterprise AI tools CDOs and CAIOs are deploying.",
    url: "https://cdaoinsights.com/ai-tools",
    siteName: "CDAO Insights",
    type: "website",
    images: [{ url: "https://cdaoinsights.com/og-default.png" }],
  },
};

export const revalidate = 900;

const AI_TOOL_CATEGORIES = [
  { key: "platforms", label: "Data & AI Platforms", tools: ["Snowflake", "Databricks", "Google Vertex", "Azure AI"], color: "border-blue-500/30 text-blue-400" },
  { key: "agentic-analytics", label: "Agentic Analytics", tools: ["WisdomAI", "ThoughtSpot", "Hex", "Sigma", "Glean"], color: "border-emerald-500/30 text-emerald-400" },
  { key: "ai-governance", label: "AI Governance & Ops", tools: ["Dataiku", "Weights & Biases", "Fiddler", "Arthur AI", "Domino"], color: "border-amber-500/30 text-amber-400" },
  { key: "enterprise-assistants", label: "Enterprise AI Assistants", tools: ["Microsoft Copilot", "GitHub Copilot", "Glean", "Notion AI"], color: "border-violet-500/30 text-violet-400" },
  { key: "agentic-frameworks", label: "Agentic Frameworks", tools: ["LangChain", "CrewAI", "LangGraph", "AutoGen"], color: "border-indigo-500/30 text-indigo-400" },
];

const SPOTLIGHT_SOURCES = ["Databricks Blog", "Snowflake Blog"];
const SPOTLIGHT_KEYWORDS = ["databricks", "snowflake cortex", "snowflake ai", "unity catalog", "databricks ai"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function normalizeTitle(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default async function AiToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || "";

  const supabase = createServerClient();
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);

  const spotlightFilter = [
    ...SPOTLIGHT_SOURCES.map((s) => `source_name.eq.${s}`),
    ...SPOTLIGHT_KEYWORDS.map((k) => `title.ilike.%${k}%`),
  ].join(",");

  const [spotlightResult, allToolsResult, fundingResult, dynamicTopicsResult] = await Promise.all([
    supabase
      .from("market_articles")
      .select("id, title, source_name, source_url, published_at, topics, relevance")
      .or(spotlightFilter)
      .gte("published_at", cutoff30.toISOString())
      .order("published_at", { ascending: false })
      .limit(6),
    (() => {
      let q = supabase
        .from("market_articles")
        .select("id, title, source_name, source_url, published_at, topics, relevance")
        .gte("relevance", 0.4)
        .order("published_at", { ascending: false })
        .limit(150);
      if (activeCategory) {
        const cat = AI_TOOL_CATEGORIES.find((c) => c.key === activeCategory);
        if (cat) {
          q = q.or(cat.tools.map((t) => `title.ilike.%${t}%`).join(","));
        }
      } else {
        q = q.or("topics.cs.{enterprise-ai-tools},topics.cs.{agentic-ai},topics.cs.{ai}");
      }
      return q;
    })(),
    // Funding rounds — enterprise AI startups
    supabase
      .from("market_articles")
      .select("id, title, source_name, source_url, published_at, topics")
      .contains("topics", ["funding"])
      .or("title.ilike.%AI%,title.ilike.%data%,title.ilike.%analytics%")
      .order("published_at", { ascending: false })
      .limit(5),
    // Fetch dynamic tool mentions from extracted topics
    supabase
      .from("market_articles")
      .select("topics")
      .gte("published_at", cutoff30.toISOString())
      .gte("relevance", 0.4)
      .limit(500),
  ]);

  const spotlightArticles = (spotlightResult.data || []) as MarketArticle[];
  const fundingArticles = (fundingResult.data || []) as MarketArticle[];

  const seenTitles = new Set<string>();
  const allToolsArticles = ((allToolsResult.data || []) as MarketArticle[]).filter((a) => {
    const norm = normalizeTitle(a.title);
    if (seenTitles.has(norm)) return false;
    seenTitles.add(norm);
    return true;
  });

  // Compute dynamic tool counts from extracted topics
  const topicsRows = (dynamicTopicsResult.data || []) as Array<{ topics: string[] }>;
  const dynamicToolCounts: Record<string, number> = {};
  for (const row of topicsRows) {
    for (const topic of row.topics || []) {
      if (topic.startsWith("tool:")) {
        // Convert tool:wisdomai back to display name
        const toolName = topic
          .replace("tool:", "")
          .replace(/-/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        dynamicToolCounts[toolName] = (dynamicToolCounts[toolName] || 0) + 1;
      }
    }
  }

  // Merge with hardcoded counts (fallback for manual tracking)
  const ALL_TRACKED_TOOLS = [
    "Snowflake", "Databricks", "WisdomAI", "Glean", "ThoughtSpot",
    "Hex", "Sigma", "Microsoft Copilot", "GitHub Copilot",
    "Dataiku", "Weights & Biases", "LangChain", "CrewAI",
    "Google Vertex", "Azure AI", "Fiddler", "Domino",
  ];
  const toolCounts: Record<string, number> = {};
  for (const tool of ALL_TRACKED_TOOLS) {
    toolCounts[tool] = allToolsArticles.filter((a) =>
      a.title.toLowerCase().includes(tool.toLowerCase())
    ).length;
  }

  // Merge dynamic counts, prefer dynamic if higher
  const mergedToolCounts: Record<string, number> = { ...toolCounts };
  for (const [tool, count] of Object.entries(dynamicToolCounts)) {
    // Check if it matches an existing tracked tool (fuzzy)
    const existing = ALL_TRACKED_TOOLS.find(
      (t) => t.toLowerCase().replace(/[^a-z]/g, "") === tool.toLowerCase().replace(/[^a-z]/g, "")
    );
    if (existing) {
      mergedToolCounts[existing] = Math.max(mergedToolCounts[existing] || 0, count);
    } else if (count >= 2) {
      // New tool discovered with 2+ mentions — surface it
      mergedToolCounts[tool] = count;
    }
  }

  const topTools = Object.entries(mergedToolCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <main className="flex-1 max-w-[1200px] mx-auto px-6 pt-10 pb-24 w-full">
      <p className="font-mono text-xs font-medium tracking-[2px] uppercase text-[#555555] mb-2">Enterprise AI</p>
      <h1 className="text-2xl sm:text-3xl font-semibold leading-[1.15] tracking-[-0.5px] text-[#E8E8E8] mb-2">
        AI Tools in the Wild
      </h1>
      <p className="text-sm text-[#888888] leading-relaxed max-w-2xl mb-8">
        Real-time tracking of AI tools enterprise CDOs and CAIOs are evaluating and deploying.
        Case studies, releases, and signals — updated continuously.
      </p>

      {/* Platform Spotlights */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">Platform AI — Databricks & Snowflake</h2>
          <span className="font-mono text-[10px] text-[#555555]">30d</span>
        </div>
        {spotlightArticles.length === 0 ? (
          <div className="border border-[#1E1E1E] rounded-sm p-6 text-center">
            <p className="text-xs text-[#555555]">No platform articles yet — check back after next ingest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spotlightArticles.map((article) => {
              const isDatabricks = article.source_name === "Databricks Blog" || article.title.toLowerCase().includes("databricks");
              return (
                <a key={article.id} href={article.source_url} target="_blank" rel="noopener noreferrer"
                  className="block border border-[#1E1E1E] rounded-sm p-3 hover:border-[#333] hover:bg-[#111111] transition-colors group">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`font-mono text-[9px] uppercase tracking-[1px] px-1.5 py-0.5 rounded-sm border ${isDatabricks ? "border-orange-500/30 text-orange-400" : "border-blue-500/30 text-blue-400"}`}>
                      {isDatabricks ? "Databricks" : "Snowflake"}
                    </span>
                    {article.published_at && (
                      <span className="font-mono text-[9px] text-[#555555]">{timeAgo(article.published_at)}</span>
                    )}
                  </div>
                  <h3 className="text-sm text-[#E8E8E8] group-hover:text-[#3B82F6] leading-snug line-clamp-2">
                    {cleanTitle(article.title)}
                  </h3>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Funding Rounds */}
      {fundingArticles.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">
              Recent Funding
            </h2>
            <a href="/intelligence?topic=funding" className="font-mono text-[10px] uppercase tracking-[1px] text-[#555555] hover:text-[#E8E8E8] transition-colors">
              All →
            </a>
          </div>
          <div className="border border-[#1E1E1E] rounded-sm divide-y divide-[#1E1E1E]">
            {fundingArticles.map((article) => (
              <a
                key={article.id}
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-[#111111] transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm text-[#E8E8E8] group-hover:text-[#3B82F6] leading-snug line-clamp-1">
                    {cleanTitle(article.title)}
                  </h3>
                  {article.source_name && (
                    <span className="font-mono text-[10px] text-[#555555]">{article.source_name}</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-[#555555] whitespace-nowrap mt-1 flex-shrink-0">
                  {article.published_at && !isNaN(new Date(article.published_at).getTime())
                    ? timeAgo(article.published_at) : "—"}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Scoreboard */}
      {topTools.length > 0 && (
        <section className="mb-8">
          <div className="border border-[#1E1E1E] rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">Trending Tools</h2>
              <span className="font-mono text-[10px] text-[#555555]">auto-discovered · 30d</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topTools.map(([tool, count], i) => (
                <div key={tool} className="flex items-center gap-2 py-1.5 px-2 border border-[#1E1E1E] rounded-sm">
                  <span className="font-mono text-[10px] text-[#555555] w-4 flex-shrink-0">#{i + 1}</span>
                  <span className="text-sm text-[#E8E8E8] flex-1 truncate">{tool}</span>
                  <span className="font-mono text-xs font-semibold text-[#00FF94] flex-shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a href="/ai-tools" className={`font-mono text-[10px] uppercase tracking-[1px] px-2.5 py-1 rounded-sm border transition-colors ${!activeCategory ? "bg-[#E8E8E8] text-[#0A0A0A] border-[#E8E8E8]" : "text-[#555555] border-[#1E1E1E] hover:border-[#555555] hover:text-[#888888]"}`}>
          All Tools
        </a>
        {AI_TOOL_CATEGORIES.map((cat) => (
          <a key={cat.key} href={`/ai-tools?category=${cat.key}`}
            className={`font-mono text-[10px] uppercase tracking-[1px] px-2.5 py-1 rounded-sm border transition-colors ${activeCategory === cat.key ? "bg-[#E8E8E8] text-[#0A0A0A] border-[#E8E8E8]" : "text-[#555555] border-[#1E1E1E] hover:border-[#555555] hover:text-[#888888]"}`}>
            {cat.label}
          </a>
        ))}
      </div>

      {/* Article Feed */}
      <div className="border border-[#1E1E1E] rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
          <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-[#555555]">Latest Signals</h2>
          <span className="font-mono text-[10px] text-[#555555]">{allToolsArticles.length} articles</span>
        </div>
        {allToolsArticles.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-[#555555]">No articles yet for this category. Check back after next ingest.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E1E1E]">
            {allToolsArticles.slice(0, 100).map((article) => (
              <a key={article.id} href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="block px-4 py-2.5 hover:bg-[#111111] transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm text-[#E8E8E8] group-hover:text-[#3B82F6] leading-snug line-clamp-1">
                      {cleanTitle(article.title)}
                    </h3>
                    {article.source_name && (
                      <span className="font-mono text-[10px] text-[#555555] mt-0.5 block">{article.source_name}</span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-[#555555] whitespace-nowrap mt-1 flex-shrink-0">
                    {article.published_at && !isNaN(new Date(article.published_at).getTime()) ? timeAgo(article.published_at) : "—"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
