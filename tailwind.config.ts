import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
    './node_modules/primevue/**/*.{js,mjs}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
