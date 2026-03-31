/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        sakura: {
          pink: '#f5c6d6',
          soft: '#f9d9e5',
        },
        ink: {
          deep: '#050509',
          red: '#8b2f3c',
        },
        parchment: '#f5f1e8',
      },
      fontFamily: {
        /** Rounded JP + Latin — soft sakura UI */
        sans: [
          '"Zen Maru Gothic"',
          'Hiragino Sans',
          '"Hiragino Kaku Gothic ProN"',
          '"Yu Gothic"',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
        body: [
          '"Zen Maru Gothic"',
          'Hiragino Sans',
          '"Hiragino Kaku Gothic ProN"',
          '"Yu Gothic"',
          'Meiryo',
          'system-ui',
          'sans-serif',
        ],
        /** Editorial mincho for titles — matches sakura / shoji aesthetic */
        heading: [
          '"Shippori Mincho"',
          '"Noto Serif JP"',
          '"Hiragino Mincho ProN"',
          'serif',
        ],
      },
      boxShadow: {
        'soft-glow': '0 0 40px rgba(245, 198, 214, 0.28)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

