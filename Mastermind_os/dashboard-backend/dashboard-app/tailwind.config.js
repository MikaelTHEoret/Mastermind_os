/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon colors for synthwave aesthetic
        'neon-pink': '#ff71ce',
        'neon-blue': '#01cdfe',
        'neon-green': '#05ffa1',
        'neon-purple': '#b967ff',
        'neon-yellow': '#fffb96',
      },
      boxShadow: {
        'neon-pink': '0 0 5px theme("colors.pink.500"), 0 0 20px theme("colors.pink.500")',
        'neon-blue': '0 0 5px theme("colors.cyan.400"), 0 0 20px theme("colors.cyan.400")',
        'neon-green': '0 0 5px theme("colors.green.400"), 0 0 20px theme("colors.green.400")',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(45, 55, 72, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 55, 72, 0.2) 1px, transparent 1px)',
      },
      animation: {
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 5px theme("colors.pink.500"), 0 0 10px theme("colors.pink.500")' },
          '100%': { 'box-shadow': '0 0 10px theme("colors.pink.500"), 0 0 20px theme("colors.pink.500")' },
        },
      },
    },
  },
  plugins: [],
}
