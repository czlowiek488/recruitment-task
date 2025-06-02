import { configs, config } from 'typescript-eslint'
import js from '@eslint/js'
import { importX } from 'eslint-plugin-import-x'
import * as tsParser from '@typescript-eslint/parser'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import unusedImports from 'eslint-plugin-unused-imports'

export default config(
  {
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
    },
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      configs.recommendedTypeChecked,
      {
        languageOptions: {
          parser: tsParser,
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: {
            projectService: true,
            tsconfigRootDir: './',
          },
        },
      },
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      eslintPluginPrettierRecommended,
    ],
    settings: {
      'import/extensions': ['.ts', '.js'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'no-process-env': 'error',
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      'dot-notation': 'error',
      'import/no-cycle': 'off',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-void': 'off',
      'prettier/prettier': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'jest/no-disabled-tests': 'off',
      'no-restricted-globals': ['error', '__dirname', 'process', 'Error'],
      'no-restricted-imports': ['error', 'node:test'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'import-x/extensions': ['error', 'never'],
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
    },
  },
  {
    files: ['**/migrations/**'],
    rules: {
      'no-console': 'off',
    },
  },
)
