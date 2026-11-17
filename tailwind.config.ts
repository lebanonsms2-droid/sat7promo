import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        'text-dim': 'rgb(var(--text-dim) / <alpha-value>)',
        'text-faint': 'rgb(var(--text-faint) / <alpha-value>)',
        red: 'rgb(var(--red) / <alpha-value>)',
        amber: 'rgb(var(--amber) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        blue: 'rgb(var(--blue) / <alpha-value>)',
        violet: 'rgb(var(--violet) / <alpha-value>)',
        'red-soft': 'rgb(var(--red-soft) / <alpha-value>)',
        'amber-soft': 'rgb(var(--amber-soft) / <alpha-value>)',
        'teal-soft': 'rgb(var(--teal-soft) / <alpha-value>)',
        'blue-soft': 'rgb(var(--blue-soft) / <alpha-value>)',
        'violet-soft': 'rgb(var(--violet-soft) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar-bg) / <alpha-value>)',
        'sidebar-text': 'rgb(var(--sidebar-text) / <alpha-value>)',
        'sidebar-active': 'rgb(var(--sidebar-active) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '16px',
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,32,.06), 0 8px 24px -12px rgba(15,23,32,.12)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
};

export default config;