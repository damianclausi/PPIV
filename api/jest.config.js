export default {
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Extensiones de archivos a procesar
  moduleFileExtensions: ['js', 'json'],
  
  // Transformar archivos ES modules
  transform: {},
  
  // Patrones para encontrar tests
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.backup/'
  ],
  
  // Cobertura
  collectCoverageFrom: [
    '_lib/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Directorios de módulos
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/testSetup.js'],
  
  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Verbose output
  verbose: true,
  
  // Timeout para tests
  testTimeout: 10000
};

