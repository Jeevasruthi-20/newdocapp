/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc2fd',
          400: '#36a5f8',
          500: '#0c87eb',
          600: '#0069c0',
          700: '#0155a0',
          800: '#064884',
          900: '#0b3d6e',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        'medical': '12px',
        'medical-lg': '18px',
      },
      boxShadow: {
        'medical': '0 4px 16px rgba(0, 105, 192, 0.10)',
        'medical-lg': '0 10px 30px rgba(0, 105, 192, 0.14)',
        'medical-glow': '0 0 0 3px rgba(0, 105, 192, 0.15)',
      },
      backgroundImage: {
        'medical-gradient': 'linear-gradient(135deg, #0069c0 0%, #00aaff 100%)',
      },
    },
  },
  plugins: [],
};
