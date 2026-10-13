import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [{
  ignores: ['**/lib/'],
}, ...compat.extends('eslint:recommended'), ...[].concat(tseslint.configs.base).map((config) => ({
  ...config,
  files: ['**/*.ts'],
})), {
  files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts'],

  languageOptions: {
    globals: {
      ...globals.node,
    },

    ecmaVersion: 2021,
    sourceType: 'module',
  },

  rules: {
    indent: ['error', 2, {
      SwitchCase: 1,
    }],

    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 0,
  },
}];