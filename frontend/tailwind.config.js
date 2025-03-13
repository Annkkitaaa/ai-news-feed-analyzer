module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: 'class', // Enable dark mode
    theme: {
      extend: {
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
          },
          secondary: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
          dark: {
            100: '#222222',
            200: '#1c1c1c',
            300: '#171717',
            400: '#121212',
            500: '#0d0d0d',
            600: '#080808',
            700: '#050505',
            800: '#030303',
            900: '#000000',
          },
          light: {
            100: '#FFFFFF',
            200: '#FAFAFA',
            300: '#F5F5F5',
            400: '#F0F0F0',
            500: '#E5E5E5',
            600: '#D4D4D4',
            700: '#A3A3A3',
            800: '#737373',
            900: '#525252',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
          display: ['Clash Display', 'Inter', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        boxShadow: {
          'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          'neon': '0 0 5px rgba(99, 102, 241, 0.7), 0 0 20px rgba(99, 102, 241, 0.3)',
          'card': '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'mesh-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 20.83l2.83-2.83 1.41 1.41L1.41 22.24H0v-1.41zM0 3.07l2.83-2.83 1.41 1.41L1.41 4.48H0V3.07zm20.76 35.52l2.83-2.83 1.41 1.41L22.17 40h-1.41v-1.41zm0-17.76l2.83-2.83 1.41 1.41-2.83 2.83h-1.41v-1.41zm0-17.76l2.83-2.83 1.41 1.41-2.83 2.83h-1.41V3.07zm22.17 35.52l-1.41-1.41 1.41-1.41 1.41 1.41v1.41h-1.41zM22.17 20.83l-1.41-1.41 1.41-1.41 1.41 1.41v1.41h-1.41zM22.17 3.07l-1.41-1.41 1.41-1.41 1.41 1.41v1.41h-1.41zm17.76 0l1.41 1.41-2.83 2.83H37.1V4.48l2.83-2.83zM37.1 20.83l1.41 1.41-2.83 2.83H34.27v-1.41l2.83-2.83zM37.1 38.59l1.41 1.41-2.83 2.83H34.27V39.17l2.83-2.83z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'fade-in': 'fadeIn 0.5s ease-in',
          'slide-up': 'slideUp 0.5s ease-out',
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
        backdropFilter: {
          'none': 'none',
          'blur': 'blur(20px)',
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/line-clamp'),
      require('@tailwindcss/typography'),
    ],
  }