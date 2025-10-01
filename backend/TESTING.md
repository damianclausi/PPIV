# Testing - Cooperativa Eléctrica Gobernador Ugarte Backend

Este documento describe la estrategia de testing implementada para el backend de la API.

## 📋 Estructura de Tests

```
backend/
├── __tests__/
│   ├── unit/              # Tests unitarios de modelos
│   │   ├── usuario.test.js
│   │   ├── socio.test.js
│   │   └── factura.test.js
│   └── integration/       # Tests de integración de API
│       ├── auth.test.js
│       └── clientes.test.js
├── jest.config.js         # Configuración de Jest
└── scripts/
    └── hashPassword.js    # Script para hashear passwords
```

## 🛠️ Tecnologías

- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **@jest/globals**: Utilidades de Jest para ES Modules

## 🚀 Comandos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests específicos
npm test -- __tests__/unit/usuario.test.js
npm test -- __tests__/integration/auth.test.js
```

## 📊 Cobertura de Tests

### Tests Unitarios (Modelos)

#### Usuario Model
- ✅ buscarPorEmail - Buscar usuario por email
- ✅ buscarPorId - Buscar usuario por ID con información completa
- ✅ obtenerRoles - Obtener roles del usuario
- ✅ tieneRol - Verificar si usuario tiene un rol específico
- ✅ actualizarUltimoLogin - Actualizar timestamp de último login

#### Socio Model
- ✅ obtenerPerfil - Obtener perfil del socio
- ✅ obtenerCuentas - Obtener cuentas del socio
- ✅ listar - Listar socios con paginación
- ✅ filtrar por estado - Filtrar socios activos/inactivos

#### Factura Model
- ✅ obtenerPorSocio - Obtener facturas de un socio
- ✅ obtenerPorId - Obtener factura específica
- ✅ obtenerResumen - Obtener resumen de facturas
- ✅ filtrar por estado - Filtrar facturas por estado de pago

### Tests de Integración (API Endpoints)

#### Auth API
- ✅ POST /api/auth/login - Login con credenciales válidas
- ✅ POST /api/auth/login - Rechazar credenciales inválidas
- ✅ POST /api/auth/login - Validar campos requeridos
- ✅ GET /api/auth/perfil - Obtener perfil con token válido
- ✅ GET /api/auth/perfil - Rechazar sin token
- ✅ GET /api/auth/perfil - Rechazar con token inválido
- ✅ POST /api/auth/verificar - Verificar token válido

#### Clientes API
- ✅ GET /api/clientes/perfil - Obtener perfil del cliente
- ✅ GET /api/clientes/perfil - Rechazar sin autenticación
- ✅ GET /api/clientes/cuentas - Obtener cuentas
- ✅ GET /api/clientes/dashboard - Obtener dashboard con resumen
- ✅ GET /api/clientes/facturas - Obtener facturas
- ✅ GET /api/clientes/facturas?estado=X - Filtrar por estado
- ✅ GET /api/clientes/facturas?limite=X - Paginación
- ✅ GET /api/clientes/reclamos - Obtener reclamos
- ✅ POST /api/clientes/reclamos - Crear nuevo reclamo
- ✅ POST /api/clientes/reclamos - Validar campos requeridos

## 📝 Convenciones de Testing

### Estructura de un Test

```javascript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import Model from '../../models/Model.js';
import pool from '../../db.js';

describe('Nombre del Modelo/API', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('Función/Endpoint específico', () => {
    test('debe hacer algo específico', async () => {
      // Arrange
      const input = ...;
      
      // Act
      const resultado = await Model.metodo(input);
      
      // Assert
      expect(resultado).toBeDefined();
      expect(resultado.campo).toBe(valorEsperado);
    });
  });
});
```

### Buenas Prácticas

1. **Nombres descriptivos**: Los nombres de los tests deben describir claramente qué se está probando
2. **Independencia**: Cada test debe ser independiente y no depender de otros
3. **Cleanup**: Usar `afterAll` para limpiar recursos (cerrar conexiones DB)
4. **Arrange-Act-Assert**: Seguir el patrón AAA para estructura clara
5. **Tests de borde**: Incluir tests para casos límite y errores

## 🔐 Datos de Prueba

### Usuario de Prueba
- Email: `mariaelena.gonzalez@hotmail.com`
- Password: `password123`
- Socio ID: 2
- Roles: CLIENTE

### Actualizar Password de Prueba

Si necesitas actualizar el password hasheado:

```bash
node scripts/hashPassword.js
```

## 🎯 Resultados Actuales

**Total: 32 tests pasando ✅**
- 14 tests unitarios
- 18 tests de integración

```
Test Suites: 5 passed, 5 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        ~1.2s
```

## 🔄 CI/CD

Los tests se ejecutan automáticamente en:
- Pre-commit hooks (futuro)
- GitHub Actions (futuro)
- Antes de deploy a producción

## 📚 Próximos Tests a Implementar

- [ ] Tests de Reclamo Model
- [ ] Tests de paginación avanzada
- [ ] Tests de permisos y roles
- [ ] Tests de operarios
- [ ] Tests de administrativos
- [ ] Tests de validación de datos
- [ ] Tests de manejo de errores
- [ ] Tests de rate limiting (futuro)
- [ ] Tests de seguridad

## 🐛 Debugging Tests

### Ver logs detallados
```bash
npm test -- --verbose
```

### Ejecutar un solo test
```bash
npm test -- -t "nombre del test"
```

### Modo watch para desarrollo
```bash
npm run test:watch
```

## 📞 Contacto

Para preguntas o issues relacionados con testing, contactar al equipo de desarrollo.
