import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './msw/server';

// Extender expect con matchers de jest-dom
expect.extend(matchers);

// Iniciar el servidor MSW antes de todos los tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Limpiar después de cada test
afterEach(() => {
  cleanup();
  // Reset handlers después de cada test para evitar que los tests se afecten entre sí
  server.resetHandlers();
});

// Cerrar el servidor MSW después de todos los tests
afterAll(() => {
  server.close();
});

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock de window.location
delete (window as any).location;
window.location = {
  ...window.location,
  href: 'http://localhost:3002',
  origin: 'http://localhost:3002',
  pathname: '/',
  search: '',
  hash: '',
} as any;

