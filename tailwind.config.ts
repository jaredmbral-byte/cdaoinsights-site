import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-inconsolata)', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: '#0A0A0A',
        surface: '#111111',
        border: '#1E1E1E',
        accent: '#00FF94',
        link: '#3B82F6',
        danger: '#EF4444',
        text: {
          DEFAULT: '#E8E8E8',
          muted: '#888888',
          subtle: '#555555',
        },
      },
      maxWidth: {
        site: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
