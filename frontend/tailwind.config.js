/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          light: '#1E88E5',
          dark: '#0A3460',
        },
        accent: '#00C9A7',
        bg: '#F8FBFF',
        card: '#FFFFFF',
        dark: '#0F172A',
        muted: '#64748B',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: '#E2E8F0',
        hover: '#EFF6FF',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,76,129,0.06), 0 4px 16px rgba(15,76,129,0.08)',
        'card-hover': '0 4px 12px rgba(15,76,129,0.1), 0 16px 40px rgba(15,76,129,0.12)',
        modal: '0 20px 60px rgba(15,76,129,0.2), 0 0 0 1px rgba(15,76,129,0.05)',
        glow: '0 0 40px rgba(0,201,167,0.25)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0F4C81 0%, #1E88E5 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00C9A7 0%, #1E88E5 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0A3460 0%, #0F4C81 50%, #1565C0 100%)',
        'mesh': "radial-gradient(at 40% 20%, rgba(0,201,167,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(30,136,229,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(15,76,129,0.08) 0px, transparent 50%)",
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
      },
    },
  },
  plugins: [],
};