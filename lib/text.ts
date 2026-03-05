// ── Text cleaning utilities ──────────────────────────────────────────────────
// Used to sanitize RSS-ingested content for display

/**
 * Strip all HTML tags and decode common HTML entities.
 * Google News RSS descriptions often contain raw HTML
 * like <a href="...">Title</a>&nbsp;&nbsp;<font color="...">Source</font>
 */
export function stripHtml(text: string): string {
  let result = text

  // Run multiple passes to handle double/triple-encoded entities
  for (let i = 0; i < 3; i++) {
    const prev = result
    result = result
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#8217;/g, '\u2019')
      .replace(/&#8216;/g, '\u2018')
      .replace(/&#8220;/g, '\u201C')
      .replace(/&#8221;/g, '\u201D')
      .replace(/&#8211;/g, '\u2013')
      .replace(/&#8212;/g, '\u2014')
      .replace(/&nbsp;/g, ' ')
    // Strip complete HTML tags
    result = result.replace(/<[^>]+>/g, '')
    // Strip truncated/incomplete HTML tags (e.g., "<a href=..." with no closing >)
    result = result.replace(/<[^>]*$/g, '')
    // Stop if no changes were made
    if (result === prev) break
  }

  return result.replace(/\s+/g, ' ').trim()
}

/**
 * Clean an article title:
 * 1. Strip HTML tags and entities
 * 2. Remove trailing " - Source Name" suffix (since source_name is shown separately)
 */
export function cleanTitle(title: string): string {
  let clean = stripHtml(title)

  // Remove trailing " - Source Name" (common in Google News RSS)
  // Pattern: " - " followed by 1-40 chars at end of string
  clean = clean.replace(/\s+-\s+[A-Za-z0-9\s&'.]+$/, '')

  return clean
}

/**
 * Clean an article summary:
 * 1. Strip HTML tags and entities
 * 2. Return null if empty, too short, or just a repeat of the title
 */
export function cleanSummary(summary: string | null, title?: string): string | null {
  if (!summary) return null
  const clean = stripHtml(summary)
  // If after stripping the summary is empty or too short to be useful, return null
  if (clean.length < 20) return null

  // If the summary is just the title repeated (with maybe a source name appended),
  // suppress it. This happens with Google News RSS descriptions.
  if (title) {
    const cleanTitleLower = stripHtml(title).toLowerCase().replace(/[^a-z0-9]/g, '')
    const cleanSummaryLower = clean.toLowerCase().replace(/[^a-z0-9]/g, '')
    // If the summary starts with 80%+ of the title text, it's redundant
    if (cleanSummaryLower.startsWith(cleanTitleLower.slice(0, Math.floor(cleanTitleLower.length * 0.8)))) {
      return null
    }
  }

  return clean
}
