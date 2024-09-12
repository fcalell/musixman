/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    colors: {
      border: 'hsl(240 3.7% 15.9%)',
      input: 'hsl(240 3.7% 15.9%)',
      ring: 'hsl(142.1 70.6% 45.3%)',
      background: 'hsl(240 10% 3.9%)',
      foreground: 'hsl(0 0% 98%)',
      primary: {
        DEFAULT: 'hsl(142.1 70.6% 45.3%)',
        foreground: 'hsl(144.9 80.4% 10%)',
      },
      secondary: {
        DEFAULT: 'hsl(270 100% 60%)',
        foreground: 'hsl(0 0% 98%)',
      },
      destructive: {
        DEFAULT: 'hsl(0 62.8% 30.6%)',
        foreground: 'hsl(0 85.7% 97.3%)',
      },
      muted: {
        DEFAULT: 'hsl(240 3.7% 15.9%)',
        foreground: 'hsl(240 5% 64.9%)',
      },
      accent: {
        DEFAULT: 'hsl(12 60% 50%)',
        foreground: 'hsl(0 0% 98%)',
      },
      popover: {
        DEFAULT: 'hsl(240 10% 3.9%)',
        foreground: 'hsl(0 0% 98%)',
      },
      card: {
        DEFAULT: 'hsl(240 10% 3.9%)',
        foreground: 'hsl(0 0% 98%)',
      },
      warning: {
        DEFAULT: 'hsl(var(--warning))',
        foreground: 'hsl(var(--warning-foreground))',
      },
      error: {
        DEFAULT: 'hsl(var(--error))',
        foreground: 'hsl(var(--error-foreground))',
      },
      success: {
        DEFAULT: 'hsl(var(--success))',
        foreground: 'hsl(var(--success-foreground))',
      },
      black: 'hsl(var(--black))',
      white: 'hsl(var(--white))',
      transparent: 'transparent',
    },
    extend: {
      colors: {
        border: 'hsl(240 3.7% 15.9%)',
        input: 'hsl(240 3.7% 15.9%)',
        ring: 'hsl(142.1 70.6% 45.3%)',
        background: 'hsl(240 10% 3.9%)',
        foreground: 'hsl(0 0% 98%)',
        primary: {
          DEFAULT: 'hsl(142.1 70.6% 45.3%)',
          foreground: 'hsl(144.9 80.4% 10%)',
        },
        secondary: {
          DEFAULT: 'hsl(270 100% 60%)',
          foreground: 'hsl(0 0% 98%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 62.8% 30.6%)',
          foreground: 'hsl(0 85.7% 97.3%)',
        },
        muted: {
          DEFAULT: 'hsl(240 3.7% 15.9%)',
          foreground: 'hsl(240 5% 64.9%)',
        },
        accent: {
          DEFAULT: 'hsl(12 60% 50%)',
          foreground: 'hsl(0 0% 98%)',
        },
        popover: {
          DEFAULT: 'hsl(240 10% 3.9%)',
          foreground: 'hsl(0 0% 98%)',
        },
        card: {
          DEFAULT: 'hsl(240 10% 3.9%)',
          foreground: 'hsl(0 0% 98%)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        black: 'hsl(var(--black))',
        white: 'hsl(var(--white))',
        transparent: 'transparent',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
