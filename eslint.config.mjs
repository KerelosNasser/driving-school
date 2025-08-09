import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable the img element warning - consider replacing with next/image later
      "@next/next/no-img-element": "off",
      // Disable the unescaped entities error
      "react/no-unescaped-entities": "off",
      // Disable the any type error
      "@typescript-eslint/no-explicit-any": "off",
      // Disable the unused vars warning
      "@typescript-eslint/no-unused-vars": "warn",
      // Disable the empty interface error
      "@typescript-eslint/no-empty-interface": "off"
    },
  },
];

export default eslintConfig;
