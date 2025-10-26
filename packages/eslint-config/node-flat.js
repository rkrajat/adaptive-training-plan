import baseConfig from './base.js';

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // Allow console in Node.js backend
      'no-console': 'off',
    },
  },
];
