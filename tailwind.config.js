/** @type {import('tailwindcss').Config} */
/* ---------------------------------------------------------------------------
 * "Editorial daylight" theme — modelled on the CenterStage reference:
 *   #FBFBFC dot-grid canvas · white cards · zinc-900 ink · amber gradient CTAs
 *   Inter body · Plus Jakarta Sans headings.
 * The class tokens keep their original names, so every component picks up the
 * daylight values without markup changes.
 * ------------------------------------------------------------------------- */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* canvas: reference #FBFBFC */
        obsidian: '#FBFBFC',
        panel: '#FFFFFF',
        panel2: '#F7F7F8',
        panel3: '#F1F1F3',
        edge: '#E7E7EA',
        /* amber family — the reference's star accent */
        gold: {
          DEFAULT: '#D97706',
          soft: '#F59E0B',
          deep: '#B45309',
        },
        heritage: '#A16207',
        coral: '#E11D48',
        iris: '#7C3AED',
        aqua: '#0891B2',
        mint: '#059669',
        /* warm ink used for soft overlays (bg-white/5 → subtle zinc tint) */
        white: '#18181B',
        /* zinc-flavoured inverted slate ramp */
        slate: {
          50: '#FAFAFA',
          100: '#18181B',
          200: '#27272A',
          300: '#3F3F46',
          400: '#52525B',
          500: '#71717A',
          600: '#A1A1AA',
          700: '#BFC1C6',
          800: '#D9DADD',
          900: '#EFEFF1',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        brand: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'SFMono-Regular', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 22px rgba(245,158,11,0.30)',
        /* reference shadow-diffused */
        card: '0 1px 3px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.035)',
        xs: '0 1px 2px rgba(0,0,0,0.05)',
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
