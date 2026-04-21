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
        // Brand Guide palette (warm monochrome)
        paper: '#F5F3EE',
        'paper-2': '#EDEAE2',
        ink: '#0A0A0A',
        graphite: '#3A3A3A',
        mid: '#6B6864',
        rule: '#C9C4BB',
        chalk: '#FFFFFF',
        // Legacy aliases so existing code keeps working
        bg: '#F5F3EE',
        surface: '#EDEAE2',
        border: '#C9C4BB',
        accent: '#0A0A0A',
        link: '#0A0A0A',
        danger: '#DC2626',
        text: {
          DEFAULT: '#0A0A0A',
          muted: '#6B6864',
          subtle: '#6B6864',
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
