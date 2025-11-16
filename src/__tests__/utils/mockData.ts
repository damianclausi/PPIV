/**
 * Datos mock para usar en los tests
 */

export const mockUsuario = {
  usuario_id: 1,
  email: 'test@test.com',
  roles: ['SOCIO'],
  socio: {
    socio_id: 1,
    nombre: 'Test',
    apellido: 'Usuario',
  },
};

export const mockSocio = {
  socio_id: 1,
  nombre: 'Test',
  apellido: 'Usuario',
  email: 'test@test.com',
  dni: '12345678',
  telefono: '1234567890',
  activo: true,
};

export const mockCuenta = {
  cuenta_id: 1,
  numero_cuenta: 'CUENTA-001',
  direccion: 'Calle Test 123',
  localidad: 'Ugarte',
  servicio: 'Electricidad',
  servicio_id: 1,
};

export const mockFactura = {
  factura_id: 1,
  numero_externo: 'F-000001',
  periodo: '2024-11',
  importe: 5000,
  vencimiento: '2024-12-15',
  estado: 'PENDIENTE',
  cuenta_id: 1,
};

export const mockReclamo = {
  reclamo_id: 1,
  descripcion: 'Reclamo de prueba',
  estado: 'PENDIENTE',
  fecha_alta: '2024-11-14',
  tipo_reclamo: 'Técnico',
  detalle_reclamo: 'Corte de suministro',
  prioridad: 'ALTA',
  cuenta_id: 1,
};

export const mockEmpleado = {
  empleado_id: 1,
  nombre: 'Empleado',
  apellido: 'Test',
  legajo: 'EMP-001',
  email: 'empleado@test.com',
  activo: true,
};

export const mockTipoReclamo = {
  tipo_id: 1,
  nombre: 'Técnico',
  descripcion: 'Reclamos técnicos',
};

export const mockPrioridad = {
  prioridad_id: 1,
  nombre: 'ALTA',
  orden: 3,
  color: 'red',
  activo: true,
};

