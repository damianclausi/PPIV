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
  // Para tests unitarios usa testSetup.js
  // Para tests de integración usa integrationSetup.js (se configura en el test)
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/testSetup.js'],
  
  // Configuración para proyectos múltiples (opcional)
  // Permite diferentes configuraciones para unit e integration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup/testSetup.js'],
      testTimeout: 10000
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup/integrationSetup.js'],
      testTimeout: 30000 // Tests de integración necesitan más tiempo
    }
  ],
  
  // Variables de entorno para tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Verbose output
  verbose: true,
  
  // Timeout para tests (por defecto, se puede sobrescribir en proyectos)
  testTimeout: 10000
};

// Nota: Si usas projects, las configuraciones globales se aplican a todos los proyectos
// pero cada proyecto puede tener su propia configuración específica

