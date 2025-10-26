module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
  ],
  rules: {
    // Allow default exports for Next.js pages, layouts, and route handlers
    'import/no-default-export': 'off',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    browser: true,
    node: true,
  },
};
