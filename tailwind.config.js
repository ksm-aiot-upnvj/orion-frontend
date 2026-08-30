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
        brand: {
          primary: '#301057',     // Primary Dark (Navbar & Section Canvas)
          accent: '#9B5CE8',      // Primary Light Accent (Buttons, Highlights)
          light: '#C9A4F6',       // Secondary Light (Hover, Secondary Badges)
          deep: '#561F99',        // Deep Accent (Borders, Dividers)
          canvas: '#150626',      // Dark Mode Background Canvas
          surface: '#240d42',     // Dark Card/Surface
          card: '#2d1052'         // Inner Card
        },
        aiot: {
          dark: '#301057',
          canvas: '#150626',
          card: '#240d42',
          surface: '#240d42',
          hover: '#3a1566',
          border: '#561F99',
          primary: '#301057',
          accent: '#9B5CE8',
          lavender: '#C9A4F6',
          deep: '#561F99'
        }
      },
      fontFamily: {
        sans: ['"Poppins"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px'
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'card': '0 4px 20px -2px rgba(48, 16, 87, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'ambient': '0 4px 20px rgba(155, 92, 232, 0.4)',
        'ambient-cta': '0 6px 25px rgba(201, 164, 246, 0.45)'
      }
    },
  },
  plugins: [],
}
