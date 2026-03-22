/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // FUTURISTIC HMS DESIGN SYSTEM
        // Modern Healthcare SaaS Color Palette
        // ============================================
        
        // Primary Blue - Main brand color
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Blue - Main
          700: '#1d4ed8', // Primary Hover
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Teal Accent - Healthcare accent color
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Teal Accent - Main
          600: '#0d9488', // Teal Hover
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        
        // Navy - Dark backgrounds, sidebar
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0', // Border Color
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Sidebar Hover
          900: '#0f172a', // Deep Navy - Background/Sidebar
          950: '#020617',
        },
        
        // Soft Background colors
        background: {
          soft: '#F8FAFC',
          card: '#FFFFFF',
          input: '#F8FAFC',
        },
        
        // Status Colors - Consistent system
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        
        // Semantic Colors for Healthcare
        medical: {
          emergency: '#dc2626',
          urgent: '#f97316',
          normal: '#22c55e',
          low: '#6b7280',
        },
        
        // Legacy aliases for backward compatibility
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        
        // Healthcare Teal - Legacy alias
        healthcare: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      
      // Typography Scale
      fontSize: {
        'page-title': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'section-title': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'metadata': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'button': ['0.875rem', { lineHeight: '1', fontWeight: '500' }],
      },
      
      // Spacing System
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      
      // Shadow System - Futuristic soft shadows
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 40px rgba(37, 99, 235, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-active': '0 2px 6px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 10px 40px rgba(15, 23, 42, 0.15)',
        'modal': '0 25px 50px rgba(15, 23, 42, 0.25)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.05)',
        'sidebar-dark': '4px 0 20px rgba(15, 23, 42, 0.3)',
        'input-focus': '0 0 0 3px rgba(37, 99, 235, 0.15)',
        'stat': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'stat-hover': '0 8px 24px rgba(37, 99, 235, 0.15)',
        'futuristic': '0 4px 20px rgba(37, 99, 235, 0.1), 0 0 40px rgba(20, 184, 166, 0.05)',
        'futuristic-lg': '0 8px 40px rgba(37, 99, 235, 0.15), 0 0 60px rgba(20, 184, 166, 0.08)',
        'glow-primary': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
      },
      
      // Border Radius
      borderRadius: {
        'none': '0',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      
      // Animation Duration
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      
      // Animation Timing
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // Font Family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Z-Index Scale
      zIndex: {
        'dropdown': '50',
        'sticky': '30',
        'fixed': '40',
        'modal-backdrop': '50',
        'modal': '60',
        'popover': '70',
        'tooltip': '80',
        'toast': '90',
      },
      
      // Max Width
      maxWidth: {
        'sidebar': '16rem',
        'form': '32rem',
        'card': '24rem',
        'modal-sm': '24rem',
        'modal-md': '32rem',
        'modal-lg': '48rem',
        'modal-xl': '64rem',
      },
      
      // Min Height
      minHeight: {
        'card': '120px',
        'button': '40px',
        'input': '40px',
      },
      
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
      },
      
      // Keyframe Animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'pulse': 'pulse 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce': 'bounce 1s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
