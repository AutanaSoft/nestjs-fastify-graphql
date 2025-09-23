import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', { configFile: '.swcrc' }],
  },
  testEnvironment: 'node',
  cacheDirectory: '.tmp/jestCache',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/config/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/index.(t|j)s',
  ],
  clearMocks: true,
  modulePaths: ['./'],
  testRegex: '.(spec|e2e-spec).ts$',
};

export default config;
