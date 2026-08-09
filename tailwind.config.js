/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,html}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--bg)",
        surface: "var(--surface)",
        mist: "var(--text)",
        mute: "var(--mute)",
        build: "var(--build)",
        "build-ink": "var(--build-ink)",
        maintain: "var(--maintain)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "sans-serif"],
        body: ['"Barlow"', "sans-serif"],
      },
      maxWidth: {
        phone: "440px",
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};
