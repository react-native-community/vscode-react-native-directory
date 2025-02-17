import js from '@eslint/js';
import type { Linter } from 'eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import ts from 'typescript-eslint';

const config: Linter.Config[] = [
  {
    ignores: ['**/build', '**/node_modules']
  },
  js.configs.recommended,
  ...(ts.configs.recommended as Linter.Config[]),
  prettierRecommended,
  {
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          printWidth: 120,
          singleQuote: true,
          trailingComma: 'none',
          endOfLine: 'auto'
        }
      ]
    }
  }
];

export default config;
