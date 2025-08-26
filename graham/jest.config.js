const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.js'
  ],
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.tsx',
    '!src/components/**/*.tsx',
  ],
  
  testTimeout: 60000,
  verbose: true,
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
  restoreMocks: true
};

module.exports = config;