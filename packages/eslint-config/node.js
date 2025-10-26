module.exports = {
  extends: ['./index.js'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Allow console in Node.js backend
    'no-console': 'off',
  },
};
