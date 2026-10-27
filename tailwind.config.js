/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0F17',
        panel: '#151C28',
        panel2: '#1A2233',
        panel3: '#212B3F',
        edge: '#263149',
        gold: {
          DEFAULT: '#F59E0B',
          soft: '#FBBF24',
          deep: '#B45309',
        },
        heritage: '#D9A441',
        coral: '#FB7185',
        iris: '#A78BFA',
        aqua: '#22D3EE',
        mint: '#34D399',
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'Palatino', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'SFMono-Regular', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(245,158,11,0.18)',
        card: '0 10px 30px -12px rgba(0,0,0,0.6)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .35s ease-out both',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        scan: 'scan 7s linear infinite',
      },
    },
  },
  plugins: [],
};
