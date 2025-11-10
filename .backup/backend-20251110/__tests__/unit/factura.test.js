import { describe, test, expect, afterAll } from '@jest/globals';
import Factura from '../../models/Factura.js';
import pool from '../../db.js';

describe('Modelo Factura', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('obtenerPorSocio', () => {
    test('debe obtener facturas de un socio', async () => {
      const facturas = await Factura.obtenerPorSocio(2, { limite: 5 });
      
      expect(Array.isArray(facturas)).toBe(true);
      if (facturas.length > 0) {
        expect(facturas[0]).toHaveProperty('factura_id');
        expect(facturas[0]).toHaveProperty('importe');
        expect(facturas[0]).toHaveProperty('estado');
      }
    });

    test('debe filtrar facturas por estado', async () => {
      const facturas = await Factura.obtenerPorSocio(2, { estado: 'PENDIENTE' });
      
      expect(Array.isArray(facturas)).toBe(true);
      facturas.forEach(factura => {
        expect(factura.estado).toBe('PENDIENTE');
      });
    });
  });

  describe('obtenerPorId', () => {
    test('debe obtener una factura específica', async () => {
      const factura = await Factura.obtenerPorId(2);
      
      if (factura) {
        expect(factura.factura_id).toBe(2);
        expect(factura).toHaveProperty('numero_cuenta');
        expect(factura).toHaveProperty('importe');
      }
    });
  });

  describe('obtenerResumen', () => {
    test('debe obtener resumen de facturas de un socio', async () => {
      const resumen = await Factura.obtenerResumen(2);
      
      expect(resumen).toBeDefined();
      expect(resumen).toHaveProperty('pendientes');
      expect(resumen).toHaveProperty('pagadas');
    });
  });
});
