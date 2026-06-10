export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['./tests/helpers/env.cjs'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
};
