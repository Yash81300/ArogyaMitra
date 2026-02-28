/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        saffron: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          50:  '#1f1f23',   // lightest surface (hover states, nested cards)
          100: '#18181b',   // secondary surfaces
          200: '#111113',   // primary card / sidebar bg
          300: '#0d0d0f',   // deep backgrounds
          400: '#080808',   // page bg
        },
        zinc: {
          400: '#a1a1aa',   // primary secondary text — WCAG AA ✓
          500: '#71717a',   // secondary text minimum — WCAG AA ✓
          600: '#52525b',   // disabled / placeholder
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
      fontFamily: {
        sans:    ['DM Sans',  'system-ui', 'sans-serif'],
        display: ['Outfit',   'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'glow-green': '0 0 24px rgba(34,197,94,0.22)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      fontSize: {
        // Enforce readable minimum — nothing smaller than 11px in the system
        '2xs': ['11px', { lineHeight: '1.5' }],
        'xs':  ['12px', { lineHeight: '1.5' }],
        'sm':  ['13px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}