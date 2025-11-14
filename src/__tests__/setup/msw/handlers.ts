import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3001';

// Handlers para mockear las respuestas de la API
export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'test@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        exito: true,
        mensaje: 'Login exitoso',
        datos: {
          token: 'mock-jwt-token-123',
          usuario: {
            usuario_id: 1,
            email: 'test@test.com',
            roles: ['SOCIO'],
          },
        },
      });
    }
    
    return HttpResponse.json(
      {
        exito: false,
        mensaje: 'Credenciales inválidas',
      },
      { status: 401 }
    );
  }),

  http.get(`${API_URL}/api/auth/perfil`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        usuario_id: 1,
        email: 'test@test.com',
        roles: ['SOCIO'],
        socio: {
          socio_id: 1,
          nombre: 'Test',
          apellido: 'Usuario',
        },
      },
    });
  }),

  http.post(`${API_URL}/api/auth/verificar`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        valido: true,
      },
    });
  }),

  // Cliente endpoints
  http.get(`${API_URL}/api/clientes/perfil`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        socio_id: 1,
        nombre: 'Test',
        apellido: 'Usuario',
        email: 'test@test.com',
        dni: '12345678',
        telefono: '1234567890',
        activo: true,
      },
    });
  }),

  http.get(`${API_URL}/api/clientes/cuentas`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          cuenta_id: 1,
          numero_cuenta: 'CUENTA-001',
          direccion: 'Calle Test 123',
          servicio: 'Electricidad',
        },
      ],
    });
  }),

  http.get(`${API_URL}/api/clientes/dashboard`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        facturas_pendientes: 2,
        facturas_vencidas: 0,
        monto_pendiente: 5000,
        reclamos_abiertos: 1,
        reclamos_resueltos: 5,
      },
    });
  }),

  http.get(`${API_URL}/api/clientes/facturas`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          factura_id: 1,
          numero_externo: 'F-000001',
          periodo: '2024-11',
          importe: 5000,
          vencimiento: '2024-12-15',
          estado: 'PENDIENTE',
        },
      ],
    });
  }),

  http.get(`${API_URL}/api/clientes/reclamos`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          reclamo_id: 1,
          descripcion: 'Reclamo de prueba',
          estado: 'PENDIENTE',
          fecha_alta: '2024-11-14',
          tipo_reclamo: 'Técnico',
        },
      ],
    });
  }),

  http.post(`${API_URL}/api/clientes/reclamos`, () => {
    return HttpResponse.json({
      exito: true,
      mensaje: 'Reclamo creado exitosamente',
      datos: {
        reclamo_id: 2,
        descripcion: 'Nuevo reclamo',
        estado: 'PENDIENTE',
      },
    });
  }),

  // Operario endpoints
  http.get(`${API_URL}/api/operarios/perfil`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        empleado_id: 1,
        nombre: 'Operario',
        apellido: 'Test',
        legajo: 'OP-001',
        email: 'operario@test.com',
      },
    });
  }),

  http.get(`${API_URL}/api/operarios/dashboard`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        reclamos: {
          pendientes: 5,
          en_proceso: 3,
          resueltos_hoy: 2,
          total: 10,
        },
        ultimos_reclamos: [],
      },
    });
  }),

  http.get(`${API_URL}/api/operarios/reclamos`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        reclamos: [
          {
            reclamo_id: 1,
            descripcion: 'Reclamo asignado',
            estado: 'EN_PROCESO',
          },
        ],
        total: 1,
        pagina: 1,
        totalPaginas: 1,
      },
    });
  }),

  // Administrador endpoints
  http.get(`${API_URL}/api/administradores/perfil`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        empleado_id: 1,
        nombre: 'Admin',
        apellido: 'Test',
        email: 'admin@test.com',
      },
    });
  }),

  http.get(`${API_URL}/api/administradores/dashboard`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        socios: {
          total: 100,
          activos: 95,
          inactivos: 5,
        },
        reclamos: {
          total: 50,
          pendientes: 10,
          en_proceso: 20,
          resueltos: 20,
        },
        facturacion: {
          total: 1000,
          pendientes: 500,
          pagadas: 500,
        },
      },
    });
  }),

  http.get(`${API_URL}/api/administradores/socios`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          socio_id: 1,
          nombre: 'Socio',
          apellido: 'Test',
          email: 'socio@test.com',
          activo: true,
        },
      ],
    });
  }),

  http.get(`${API_URL}/api/administradores/reclamos`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        reclamos: [
          {
            reclamo_id: 1,
            descripcion: 'Reclamo de prueba',
            estado: 'PENDIENTE',
          },
        ],
        total: 1,
        pagina: 1,
        totalPaginas: 1,
      },
    });
  }),

  http.get(`${API_URL}/api/administradores/empleados`, () => {
    return HttpResponse.json({
      exito: true,
      datos: {
        empleados: [
          {
            empleado_id: 1,
            nombre: 'Empleado',
            apellido: 'Test',
            email: 'empleado@test.com',
            activo: true,
          },
        ],
        total: 1,
        pagina: 1,
        totalPaginas: 1,
      },
    });
  }),

  // Tipos de reclamo
  http.get(`${API_URL}/api/tipos-reclamo`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          tipo_id: 1,
          nombre: 'Técnico',
          descripcion: 'Reclamos técnicos',
        },
      ],
    });
  }),

  // Prioridades
  http.get(`${API_URL}/api/prioridades`, () => {
    return HttpResponse.json({
      exito: true,
      datos: [
        {
          prioridad_id: 1,
          nombre: 'ALTA',
          orden: 3,
          color: 'red',
        },
      ],
    });
  }),
];

