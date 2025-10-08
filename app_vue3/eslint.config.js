// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vuetify from 'eslint-plugin-vuetify';

import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue', '**/*.ts', '**/*.js'],
    ignores: [
      'dist/**',
      'node_modules/**',
      '.github/**',
      'coverage/**',
      'public/**',
      '.eslintrc.js',
      '.eslintrc-auto-import.json',
    ],
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
    },
  },
);
