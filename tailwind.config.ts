import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#08080d',
          1: '#0e0e16',
          2: '#14141e',
          3: '#1a1a26',
          hover: '#1e1e2c',
        },
        'portal-border': '#252535',
        txt: {
          1: '#f0f0f5',
          2: '#9090a8',
          3: '#606078',
        },
        brand: {
          red: '#E53935',
          'red-s': 'rgba(229,57,53,0.10)',
          green: '#00C853',
          'green-s': 'rgba(0,200,83,0.10)',
          gold: '#D4AF37',
          'gold-s': 'rgba(212,175,55,0.10)',
          blue: '#42A5F5',
          'blue-s': 'rgba(66,165,245,0.08)',
          purple: '#AB47BC',
          'purple-s': 'rgba(171,71,188,0.08)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
