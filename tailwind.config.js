/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
       
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#2E2B8A',
          900: '#1E1B4B',
          DEFAULT: '#4F46E5',
          pale: '#EEF2FF',
        },
   
        success: {
          50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0',
          300: '#6EE7B7', 400: '#34D399', 500: '#10B981',
          600: '#059669', 700: '#047857', DEFAULT: '#10B981',
        },
      
        warning: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A',
          300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B',
          600: '#D97706', 700: '#B45309', DEFAULT: '#F59E0B',
        },
      
        danger: {
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA',
          300: '#FCA5A5', 400: '#F87171', 500: '#EF4444',
          600: '#DC2626', 700: '#B91C1C', DEFAULT: '#EF4444',
        },

        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#4A4A4A',
          800: '#3A3A3A',
          900: '#2A2A2A',
          950: '#1E1E1E',
        },
        darkBg: '#0F172A',
        lightBg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: { 'xl': '12px', '2xl': '16px', '3xl': '24px' },
      boxShadow: {
        'card': '0 10px 40px rgba(79,70,229,0.08)',
        'card-hover': '0 15px 50px rgba(79,70,229,0.15)',
        'premium': '0 20px 50px -12px rgba(79,70,229,0.25)',
        'soft': '0 4px 20px rgba(238,242,255,0.3)',
        'dark': '0 25px 50px -12px rgba(0,0,0,0.6)',
        'stat': '0 2px 12px rgba(79,70,229,0.2)',
        'stat-hover': '0 6px 24px rgba(79,70,229,0.3)',
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.4s ease-out forwards',
        pulseBrand: 'pulseBrand 2s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.5s infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseBrand: { '0%,100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(79,70,229,0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        glow: { '0%': { boxShadow: '0 0 10px rgba(79,70,229,0.2)' }, '100%': { boxShadow: '0 0 30px rgba(79,70,229,0.4)' } },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(160deg, #E0E7FF, #4F46E5)',
        'gradient-dark': 'linear-gradient(145deg, #0F172A, #1E293B)',
        'gradient-sidebar': 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)',
      },
      backdropBlur: { xs: '2px' },
      zIndex: { '60': '60', '70': '70', '80': '80', '90': '90', '100': '100' },
    },
  },
  plugins: [],
};