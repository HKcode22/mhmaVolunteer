module.exports = {
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
        'mhma-forest': '#0A1F14',
        'mhma-forest-mid': '#112B1A',
        'mhma-forest-light': '#1A3A26',
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

