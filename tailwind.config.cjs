/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Colores estilo Edenor
        cooperativa: {
          dark: '#1e3a5f',      // Azul oscuro sidebar
          blue: '#2563a8',       // Azul medio
          light: '#4a90d9',      // Azul claro
          cyan: '#3db3c6',       // Cyan/turquesa
          teal: '#40c9a2',       // Verde azulado
          gradient: {
            start: '#1e3a5f',
            mid: '#2563a8',
            end: '#40c9a2',
          }
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'cooperativa-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #2563a8 50%, #40c9a2 100%)',
        'cooperativa-gradient-horizontal': 'linear-gradient(90deg, #1e3a5f 0%, #2563a8 50%, #40c9a2 100%)',
      },
    },
  },
  plugins: [],
}

