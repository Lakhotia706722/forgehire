import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system tokens
        'bg-base':     '#080B14',
        'bg-surface':  '#0E1220',
        'bg-elevated': '#141828',
        'accent-cyan':   '#00D4FF',
        'accent-violet': '#7B5EA7',
        'accent-amber':  '#F59E0B',
        'accent-green':  '#10B981',
        'accent-red':    '#EF4444',
        'text-primary':   '#F0F4FF',
        'text-secondary': '#8892A4',
        'text-muted':     '#4A5568',
        // Legacy compat
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionTimingFunction: {
        'out-expo':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        fast:   '150ms',
        normal: '300ms',
        slow:   '600ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to:   { opacity: '0', transform: 'translateX(-24px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px)' },
          '40%':      { transform: 'translateX(6px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'text-reveal': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up':        'fade-up 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-out-left': 'slide-out-left 300ms cubic-bezier(0.76, 0, 0.24, 1) both',
        shake:            'shake 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring':     'pulse-ring 4s ease-in-out infinite',
        shimmer:          'shimmer 1.5s ease infinite',
        'skeleton':       'skeleton-shimmer 1.4s ease-in-out infinite',
        'text-reveal':    'text-reveal 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'page-in':        'fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      boxShadow: {
        'glow-cyan':   '0 0 40px rgba(0, 212, 255, 0.08)',
        'glow-violet': '0 0 40px rgba(123, 94, 167, 0.12)',
        'glow-amber':  '0 0 40px rgba(245, 158, 11, 0.12)',
        'focus-cyan':  '0 0 0 3px rgba(0, 212, 255, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
