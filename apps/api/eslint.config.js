import nodeConfig from '@adaptive-training-plan/eslint-config/node-flat.js';

export default [
  ...nodeConfig,
  {
    files: ['src/**/*.ts'],
  },
];
