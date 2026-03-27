/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(220, 20%, 10%)',
        card: 'hsl(220, 18%, 14%)',
        border: 'hsl(220, 15%, 22%)',
        primary: 'hsl(210, 100%, 56%)',
        accent: 'hsl(38, 92%, 60%)',
        destructive: 'hsl(0, 72%, 55%)',
        muted: 'hsl(215, 15%, 55%)',
      },
    },
  },
  plugins: [],
}
