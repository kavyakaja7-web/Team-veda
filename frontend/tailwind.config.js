/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          dark: '#080C14',
          sidebar: '#0B0F19',
          cardDark: '#111726',
          borderDark: '#1E293B',
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          hover: '#F1F5F9',
        },
        risk: {
          high: '#EF4444',
          highDark: '#DC2626',
          highBg: '#FEF2F2',
          highBorder: '#FCA5A5',
          medium: '#F59E0B',
          mediumDark: '#D97706',
          mediumBg: '#FFFBEB',
          mediumBorder: '#FDE68A',
          low: '#10B981',
          lowDark: '#059669',
          lowBg: '#ECFDF5',
          lowBorder: '#A7F3D0',
        },
        groq: {
          DEFAULT: '#7C3AED',
          light: '#F3E8FF',
          dark: '#5B21B6',
          border: '#DDD6FE',
          glow: 'rgba(124, 58, 237, 0.15)',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        glow: '0 0 20px -5px rgba(16, 185, 129, 0.3)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.08)' },
        },
        radarScan: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        radarScan: 'radarScan 8s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

