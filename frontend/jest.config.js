module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@testing-library/react$': require.resolve('@testing-library/react'),
    '^vitest$': require.resolve('vitest')
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.jest.json'
    }],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', {
      presets: ['next/babel']
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(wagmi|@wagmi|viem|permissionless|@tanstack|@radix-ui|@vitest)/)'
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/__tests__/**/*.spec.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [1343]
      },
      astTransformers: {
        before: [
          {
            path: 'node_modules/ts-jest-mock-import-meta',
            options: { metaObjectReplacement: { env: { VITE_NODE_ENV: 'test' } } }
          }
        ]
      }
    }
  }
}