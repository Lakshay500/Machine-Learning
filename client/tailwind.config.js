/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F4ECE6',
        linen: '#E8D8C8',
        ink: '#2C2A29',
        sepia: '#5C554F',
        oxblood: '#8B3A3A',
        gold: '#D4AF37',
        radio: '#1A1A1A'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Lora', 'serif'],
        mono: ['"Courier Prime"', 'monospace']
      }
    }
  },
  plugins: []
};
