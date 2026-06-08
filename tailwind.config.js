module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mhma-teal': '#0D4F4F',
        'mhma-gold': '#C9A84C',
        'mhma-gold-light': '#E0C070',
        'mhma-dark': '#00332D',
        'mhma-forest': '#1B5E38',
        'mhma-forest-mid': '#2E7D4F',
        'mhma-forest-light': '#4CAF7A',
        'mhma-cream': '#F8F4EC',
        'mhma-sage': '#8AB89A',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-dmsans)', 'DM Sans', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'serif'],
      },
    },
  },
  plugins: [],
}

