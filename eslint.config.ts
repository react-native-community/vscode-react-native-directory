import eslint from '@eslint/js';
import type { Linter } from 'eslint';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import pluginTS from 'typescript-eslint';

const config: Linter.Config[] = [
  {
    ignores: ['**/build', '**/node_modules']
  },
  eslint.configs.recommended,
  ...(pluginTS.configs.recommended as Linter.Config[]),
  pluginPrettierRecommended,
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
