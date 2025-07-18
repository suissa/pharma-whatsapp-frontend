/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'whatsapp-bg': '#f0f2f5',
        'whatsapp-border': '#e9edef',
        'whatsapp-green': '#25d366',
        'whatsapp-dark': '#1eab56',
        'whatsapp-light': '#dcf8c6',
        'whatsapp-dark-bg': '#111b21',
        'whatsapp-panel': '#202c33',
      }
    },
  },
  plugins: [],
} 