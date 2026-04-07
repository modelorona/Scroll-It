const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");

module.exports = [
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "quotes": ["error", "double"],
      "@typescript-eslint/no-explicit-any": 0,
      "require-jsdoc": 0,
      "valid-jsdoc": 0,
    },
  },
  {
    ignores: [
      "lib/**/*",
      "generated/**/*",
      "node_modules/**/*",
      "scripts/**/*",
      "eslint.config.js",
      "*.config.js",
    ],
  },
];
