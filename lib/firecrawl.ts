import Firecrawl from '@mendable/firecrawl-js'

// Lazy-instantiated singleton so the module can be imported
// (during Next.js page-data collection) without the env var being set.
// The client is only constructed the first time a method is accessed.
let _client: Firecrawl | null = null

function getClient(): Firecrawl {
  if (_client) return _client
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY env var is required to call Firecrawl')
  }
  _client = new Firecrawl({ apiKey })
  return _client
}

// Proxy so existing `firecrawl.method()` callers keep working unchanged.
export const firecrawl = new Proxy({} as Firecrawl, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})
