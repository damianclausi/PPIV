import { describe, it, expect } from 'vitest';

/**
 * Test de ejemplo para verificar que Vitest está configurado correctamente
 */
describe('Configuración de Vitest', () => {
  it('debería ejecutar tests correctamente', () => {
    expect(true).toBe(true);
  });

  it('debería tener acceso a matchers de jest-dom', () => {
    const element = document.createElement('div');
    element.textContent = 'Test';
    document.body.appendChild(element);
    expect(element).toBeInTheDocument();
    document.body.removeChild(element);
  });
});

