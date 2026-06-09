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
        'mhma-forest': '#388E5A',
        'mhma-forest-mid': '#4CAF7A',
        'mhma-forest-light': '#66C990',
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

