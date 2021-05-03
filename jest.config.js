const baseConfig = require('./jest-base');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...baseConfig,
  rootDir: '.',
  testMatch: [ '<rootDir>/src/**/*.spec.ts', '!<rootDir>/node_modules/**' ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/__*__/*',
    '!<rootDir>/src/utils/testing.ts',
  ],
  cacheDirectory: '<rootDir>/.cache/unit',
  collectCoverage: true,
};
