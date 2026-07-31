/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16241F',
        paper: '#F4F5EF',
        panel: '#FFFFFF',
        moss: {
          DEFAULT: '#1F6F5C',
          dark: '#154D40',
          light: '#E3EEE9',
        },
        line: '#DEDCD0',
        muted: '#6B7268',
        risk: {
          high: '#C1443C',
          highBg: '#FBEAE8',
          medium: '#E8A33D',
          mediumBg: '#FBF2E1',
          low: '#4C8B63',
          lowBg: '#E9F3EC',
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
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 36, 31, 0.06), 0 1px 8px rgba(22, 36, 31, 0.04)',
        groq: '0 0 20px rgba(124, 58, 237, 0.15)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        gradientShift: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        gradient: 'gradientShift 6s ease infinite',
      },
    },
  },
  plugins: [],
}
