module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['./jest.setup.js'],
  transform: { '^.+\\.(js|jsx)$': 'babel-jest' },
  testMatch: ['**/__tests__/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  clearMocks: true,
};
