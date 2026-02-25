'use client'

import { useEffect } from 'react'

const TALLY_FORM_ID = 'KY6qqA'

export default function TallyForm() {
  useEffect(() => {
    // Load Tally embed script
    const script = document.createElement('script')
    script.src = 'https://tally.so/widgets/embed.js'
    script.onload = () => {
      // @ts-expect-error — Tally loaded via external script
      if (typeof window.Tally !== 'undefined') {
        // @ts-expect-error
        window.Tally.loadEmbeds()
      }
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <iframe
      data-tally-src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`}
      loading="lazy"
      width="100%"
      height="80"
      frameBorder="0"
      title="Join CDAO Insights"
      className="min-h-[80px]"
    />
  )
}
