/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        planner: {
          day: '#f8fafc',
          dayBorder: '#e2e8f0',
          dayHeader: '#1e293b',
          sidebar: '#ffffff',
          sidebarBorder: '#f1f5f9',
          overlay: 'rgba(15, 23, 42, 0.4)',
          dragActive: '#eef2ff',
          dragOver: '#c7d2fe',
        },
      },
      boxShadow: {
        'day-column': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'place-card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'drag-overlay': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px rgba(99,102,241,0.08), 0 0 0 1px rgba(255,255,255,0.5)',
        'glass-dark': '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(129,140,248,0.1)',
      },
    },
  },
  plugins: [],
}
