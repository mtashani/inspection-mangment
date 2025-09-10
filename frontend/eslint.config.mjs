import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import designSystemRules from "./eslint-rules/design-system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "design-system": {
        rules: designSystemRules
      }
    },
    rules: {
      // Design System Rules
      "design-system/no-hardcoded-colors": "error",
      "design-system/no-arbitrary-values": "warn",
      "design-system/enforce-component-imports": "error",
      "design-system/no-inline-styles": "error",
      "design-system/enforce-typography-scale": "warn",
      "design-system/enforce-design-tokens": "warn",
      "design-system/enforce-component-specific-tokens": "error",
      "design-system/enforce-semantic-color-pairs": "warn",
      
      // TypeScript Rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      
      // React Rules
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/no-unescaped-entities": "warn",
      
      // Accessibility Rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error"
    }
  },
  {
    files: ["**/*.stories.{js,jsx,ts,tsx}"],
    rules: {
      // Relax some rules for Storybook files
      "design-system/no-arbitrary-values": "off",
      "design-system/enforce-typography-scale": "off"
    }
  }
];

export default eslintConfig;
