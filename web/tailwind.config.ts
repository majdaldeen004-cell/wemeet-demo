import type { Config } from 'tailwindcss';
import path from 'path';

const config: Config = {
  content: [path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}')],
  theme: {
    extend: {
      colors: {
        brand: {
          green:   '#22c55e',
          'green-dark': '#16a34a',
          'green-light': '#dcfce7',
          blue:    '#3b82f6',
          'blue-dark':  '#2563eb',
          'blue-light': '#dbeafe',
        },
        sand:  '#f5f0e6',
        'sand-dark': '#ede5d5',
        wood:  '#d6b48a',
        'wood-dark': '#c49a6c',
        surface: '#ffffff',
        ink:   '#0f172a',
        'ink-soft': '#475569',
        'ink-muted': '#94a3b8',
        border: '#e2e8f0',
        'border-sand': '#d6c9b0',
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.10)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      screens: {
        xs: '390px',
      },
    },
  },
  plugins: [],
};

export default config;
