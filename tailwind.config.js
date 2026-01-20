/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode manually
    theme: {
        extend: {
            colors: {
                navy: {
                    900: '#283a8c', // Custom navy color from project
                    800: '#3042a0',
                },
                daretPink: '#E91E63', // Custom pink
            }
        },
    },
    plugins: [],
}
