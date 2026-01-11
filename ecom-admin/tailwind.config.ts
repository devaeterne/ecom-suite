import type { Config } from "tailwindcss";
import medusaPreset from "@medusajs/ui-preset";

const config: Config = {
  presets: [medusaPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@medusajs/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
