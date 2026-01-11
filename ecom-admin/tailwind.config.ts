import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // <- önemli: theme toggle için
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
