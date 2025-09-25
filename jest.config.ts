import type { Config } from 'jest';

const baseProject: Config = {
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', { configFile: '.swcrc' }],
  },
  testEnvironment: 'node',
  cacheDirectory: '.tmp/jestCache',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '!<rootDir>/src/config/**/*.(t|j)s',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/database/**/*.(t|j)s',
    '!<rootDir>/src/**/index.(t|j)s',
  ],
  clearMocks: true,
  modulePaths: ['./'],
};

const config: Config = {
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/src/**/*.spec.ts'],
    },
    {
      ...baseProject,
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
    },
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
