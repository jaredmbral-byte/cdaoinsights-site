'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

interface FaqAccordionProps {
  items: FaqItem[]
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openStates, setOpenStates] = useState<boolean[]>(
    items.map((_, i) => i === 0) // First item open by default
  )

  const toggleItem = (index: number) => {
    setOpenStates(prev => prev.map((state, i) => i === index ? !state : state))
  }

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          className="border-b border-[#1E1E1E] last:border-0"
        >
          <button
            onClick={() => toggleItem(i)}
            className="w-full flex items-start justify-between gap-4 py-4 text-left hover:bg-[#111111] transition-colors px-2 -mx-2"
          >
            <span className="text-sm font-medium text-[#E8E8E8]">
              {item.q}
            </span>
            <span
              className={`text-[#555555] text-sm flex-shrink-0 transition-transform ${
                openStates[i] ? 'rotate-90' : ''
              }`}
            >
              ▶
            </span>
          </button>
          {openStates[i] && (
            <div className="pb-4 px-2">
              <p className="text-sm text-[#888888] leading-relaxed max-w-2xl">
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
