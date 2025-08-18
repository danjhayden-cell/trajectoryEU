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
        // Modern data visualization palette
        'chart': {
          'eu': '#3B82F6', // Blue for EU
          'us': '#EF4444', // Red for US  
          'china': '#F59E0B', // Amber for China
          'brics': '#10B981', // Emerald for BRICS
          'projection': '#6B7280', // Gray for projections
        },
        'background': {
          'primary': '#FFFFFF',
          'secondary': '#F8FAFC',
          'tertiary': '#F1F5F9',
        },
        'text': {
          'primary': '#0F172A',
          'secondary': '#475569',
          'tertiary': '#64748B',
        },
        'border': {
          'light': '#E2E8F0',
          'medium': '#CBD5E1',
          'dark': '#94A3B8',
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config