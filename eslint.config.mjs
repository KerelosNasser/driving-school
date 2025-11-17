import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    ignores: [
      '**/__tests__/**',
      'scripts/**',
      'lib/theme/**',
      'public/**',
      'node/**'
    ],
  },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    rules: {
      // Image optimization - warn instead of error for gradual migration
      '@next/next/no-img-element': 'warn',
      
      // React rules
      'react/no-unescaped-entities': 'off',
      
      // TypeScript rules with proper configuration
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: true,
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      
      // React Hooks rules
      'react-hooks/exhaustive-deps': 'warn',
    },
  }),
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['lib/logger.ts'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];

export default eslintConfig;
