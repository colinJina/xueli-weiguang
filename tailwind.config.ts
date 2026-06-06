import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-0)",
        surface: "var(--bg-1)",
        panel: "var(--bg-2)",
        panelHover: "var(--bg-3)",
        border: "var(--line-1)",
        borderStrong: "var(--line-2)",
        foreground: "var(--text-1)",
        muted: "var(--text-2)",
        subtle: "var(--text-3)",
        disabled: "var(--text-4)",
        reverse: "var(--white-soft)",
        "white-soft": "var(--white-soft)",
        "black-soft": "var(--black-soft)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Noto Sans SC", "sans-serif"],
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "18px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        panel: "0 6px 18px rgba(0, 0, 0, 0.22)",
        overlay: "0 10px 30px rgba(0, 0, 0, 0.28)",
        hero: "0 16px 48px rgba(0, 0, 0, 0.36)",
      },
      maxWidth: {
        content: "1440px",
        reading: "720px",
        media: "1200px",
      },
      backgroundImage: {
        "archive-glow":
          "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 38%), linear-gradient(180deg, rgba(15,15,16,0.98), rgba(0,0,0,1))",
      },
    },
  },
  plugins: [],
};

export default config;
