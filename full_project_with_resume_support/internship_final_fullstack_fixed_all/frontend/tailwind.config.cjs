module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f9ff',
          100: '#eaf2ff',
          500: '#5b8cff',
          700: '#3b63d9'
        }
      },
      borderRadius: { xl: '14px' },
      boxShadow: { 'card': '0 10px 30px rgba(8,12,40,0.55)' }
    }
  },
  plugins: []
}
