import { globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

const tailwindRules = {
  "better-tailwindcss/no-concatenated-classes": "warn",
  "better-tailwindcss/no-conflicting-classes": "warn",
  "better-tailwindcss/no-deprecated-classes": "warn",
  "better-tailwindcss/no-duplicate-classes": "warn",
};

/**
 * Creates a standalone Tailwind CSS audit config for one workspace.
 *
 * @param {{ entryPoint: string, knownClasses?: string[] }} options
 * @returns {import("eslint").Linter.Config[]}
 */
export function createTailwindAuditConfig({ entryPoint, knownClasses = [] }) {
  return [
    globalIgnores([".next/**", "dist/**", "node_modules/**", "next-env.d.ts"]),
    {
      files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
      linterOptions: {
        reportUnusedDisableDirectives: false,
      },
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          ecmaFeatures: { jsx: true },
          sourceType: "module",
        },
      },
      plugins: {
        "@next/next": nextPlugin,
        "@typescript-eslint": tseslint.plugin,
        "better-tailwindcss": betterTailwindcss,
        "react-hooks": reactHooksPlugin,
        turbo: turboPlugin,
      },
      rules: {
        ...tailwindRules,
        "better-tailwindcss/no-unknown-classes": [
          "warn",
          {
            ignore: knownClasses.map((className) => `^${className}$`),
          },
        ],
      },
      settings: {
        "better-tailwindcss": {
          cwd: ".",
          detectComponentClasses: true,
          entryPoint,
          messageStyle: "compact",
        },
      },
    },
  ];
}
