import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Admin surfaces must use semantic design tokens, never raw hsl() literals
    // baked into Tailwind arbitrary-value classNames (e.g. text-[hsl(0_0%_95%)]).
    files: ["src/pages/admin/**/*.{ts,tsx}", "src/components/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\[hsl\\(/]",
          message:
            "Use a semantic design token, not a raw hsl() literal, in admin className",
        },
      ],
    },
  },
);
