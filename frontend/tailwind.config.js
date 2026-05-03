/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5',
          dark: '#3730A3',
          light: '#EEF2FF',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
          dark: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          dark: '#92400E',
        },
        slate: {
          950: '#0F172A',
          900: '#1E293B',
          800: '#334155',
          700: '#475569',
          600: '#64748B',
          500: '#94a3b8',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}