module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tarojs/taro$': '<rootDir>/tests/__mocks__/taro.ts',
    '^@tarojs/components$': '<rootDir>/tests/__mocks__/taro-components.ts',
  },
  globals: {
    'ts-jest': { tsconfig: { module: 'commonjs' } },
  },
}
