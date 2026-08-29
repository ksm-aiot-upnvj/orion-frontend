/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./*.html",
    "./pages/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aiot: {
          dark: '#080b11',
          card: '#0f1420',
          hover: '#161d2e',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#8a2be2',
          pink: '#f000ff',
          neon: '#00ffcc',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(138, 43, 226, 0.4)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}
