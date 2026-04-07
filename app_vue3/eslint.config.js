// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vuetify from 'eslint-plugin-vuetify';

import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.github/**',
      'coverage/**',
      'public/**',
      '.eslintrc-auto-import.json',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.vue', 'src/**/*.ts', 'src/**/*.js'],
    plugins: {
      vuetify,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...vuetify.configs.base.rules,
      ...vuetify.configs.recommended.rules,
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
