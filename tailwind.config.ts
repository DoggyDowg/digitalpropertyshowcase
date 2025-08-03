import type { Config } from "tailwindcss";
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindScrollbar from "tailwind-scrollbar";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-paragraph)',
                    ...fontFamily.sans
                ],
  			heading: [
  				'var(--font-heading)',
                    ...fontFamily.sans
                ]
  		},
  				animation: {
			'slide-in': 'slideIn 1s ease-out forwards',
			fadeIn: 'fadeIn 0.5s ease-out',
			loadingScreen: 'loadingScreen 2.5s ease-in-out forwards',
			'scale-up': 'scaleUp 0.15s ease-out forwards',
			'scale-down': 'scaleDown 0.15s ease-out forwards',
			marquee: 'marquee var(--duration) linear infinite',
			'marquee-vertical': 'marquee-vertical var(--duration) linear infinite'
		},
  		keyframes: {
  			slideIn: {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			loadingScreen: {
  				'0%, 80%': {
  					opacity: '1'
  				},
  				'100%': {
  					opacity: '0'
  				}
  			},
  			scaleUp: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'100%': {
  					transform: 'scale(1.05)'
  				}
  			},
  			scaleDown: {
  				'0%': {
  					transform: 'scale(1.05)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			marquee: {
  				from: { transform: 'translateX(0%)' },
  				to: { transform: 'translateX(-100%)' }
  			},
  			'marquee-vertical': {
  				from: { transform: 'translateY(0%)' },
  				to: { transform: 'translateY(-100%)' }
  			}
  		},
  		colors: {
  			brand: {
  				dark: 'var(--brand-dark)',
  				light: 'var(--brand-light)',
  				highlight: 'var(--brand-highlight)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		screens: {
  			'nav': '960px',
  		}
  	}
  },
  safelist: [
    'text-brand-light',
    'text-brand-dark',
    'bg-brand-light',
    'bg-brand-dark',
  ],
  plugins: [
    tailwindcssAnimate,
    tailwindScrollbar({ nocompatible: true })
  ]
} satisfies Config;

export default config;
