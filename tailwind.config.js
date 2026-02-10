/** @type {import('tailwindcss').Config} */

const withOpacity = (varName) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${varName}), ${opacityValue})`;
    }
    return `rgb(var(${varName}))`;
  };
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        water: {
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bee3fe',
          300: '#91d2fd',
          400: '#5db9fa',
          500: '#389df6',
          600: '#2280eb',
          700: '#1a69d8',
          800: '#1b55af',
          900: '#1c498a',
          950: '#162d54',
        },
        hydro: {
          bg: withOpacity('--hydro-bg'),
          card: withOpacity('--hydro-card'),
          'card-hover': withOpacity('--hydro-card-hover'),
          border: withOpacity('--hydro-border'),
          text: withOpacity('--hydro-text'),
          'text-muted': withOpacity('--hydro-text-muted'),
          accent: withOpacity('--hydro-accent'),
          success: withOpacity('--hydro-success'),
          warning: withOpacity('--hydro-warning'),
          danger: withOpacity('--hydro-danger'),
        },
      },
    },
  },
  plugins: [],
};
