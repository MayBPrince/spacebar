/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                drawer: {
                    bg: 'var(--drawer-bg)',
                    surface: 'var(--drawer-surface)',
                    'surface-hover': 'var(--drawer-surface-hover)',
                    border: 'var(--drawer-border)',
                    text: 'var(--drawer-text)',
                    'text-muted': 'var(--drawer-text-muted)',
                    accent: 'var(--drawer-accent)',
                    'accent-hover': 'var(--drawer-accent-hover)',
                },
                priority: {
                    p1: '#FF3B30', // Red
                    p2: '#FFCC00', // Yellow/Orange
                    p3: '#007AFF', // Blue
                }
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'slide-out': 'slideOut 0.3s ease-in',
                'fade-in': 'fadeIn 0.2s ease-out',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' }
                },
                slideOut: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                }
            }
        },
    },
    plugins: [],
}
