/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#0D1F0F',
        'forest-2': '#152918',
        'forest-3': '#1E3420',
        vitality: '#A8E063',
        'vitality-d': '#7AB83E',
        'warm-white': '#F5F0E8',
        suya: '#E8651A',
        'body-text': '#2C3A2A',
        muted: '#6B7E67',
        border: 'rgba(168,224,99,0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
