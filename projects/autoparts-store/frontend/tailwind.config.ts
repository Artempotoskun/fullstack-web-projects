import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10202b',
        steel: '#5e6b73',
        fog: '#f2f5f4',
        lime: '#d9f227',
        orange: '#f26a2e',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-space)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(16,32,43,.09)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
