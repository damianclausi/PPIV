# Guía de Testing - PPIV

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración](#configuración)
3. [Ejecutar Tests](#ejecutar-tests)
4. [Estructura de Tests](#estructura-de-tests)
5. [Cobertura](#cobertura)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 📊 Resumen Ejecutivo

**Estado**: ✅ **Completado**  
**Fecha de actualización**: 14/11/2025

### Estadísticas Totales

- **Backend**: 37 tests de integración + ~320 tests unitarios
- **Frontend**: 62 tests (servicios, hooks, componentes)
- **Total**: ~419 tests pasando ✅

---

## ⚙️ Configuración

### Backend (Jest)

**Ubicación**: `api/`

**Dependencias**:
- `jest`
- `@jest/globals`
- `supertest` (para tests de integración)

**Configuración**: `api/jest.config.js`

### Frontend (Vitest)

**Ubicación**: `src/`

**Dependencias**:
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `msw` (Mock Service Worker)
- `jsdom`

**Configuración**: `vite.config.ts`

---

## 🚀 Ejecutar Tests

### Backend

```bash
# Desde la raíz del proyecto
cd api

# Todos los tests (unitarios + integración)
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Modo watch (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage

# Tests específicos
npm test -- __tests__/unit/utils/jwt.test.js
npm test -- __tests__/integration/auth.integration.test.js
```

### Frontend

```bash
# Desde la raíz del proyecto
npm test              # Modo watch
npm run test:run      # Ejecutar una vez
npm run test:ui       # Interfaz visual
npm run test:coverage # Con cobertura

# Tests específicos
npm test -- src/__tests__/services/api.test.js
```

### Todos los Tests (Backend + Frontend)

```bash
# Desde la raíz del proyecto
./scripts/test-all.sh    # Script personalizado (ver abajo)
```

---

## 📁 Estructura de Tests

### Backend

```
api/
├── jest.config.js
├── __tests__/
│   ├── setup/
│   │   ├── testSetup.js          # Setup global unitarios
│   │   └── testHelpers.js        # Helpers para unitarios
│   ├── unit/
│   │   ├── utils/                 # Tests de utilidades
│   │   ├── middleware/            # Tests de middleware
│   │   ├── models/                # Tests de modelos
│   │   └── controllers/           # Tests de controladores
│   └── integration/
│       ├── setup/
│       │   ├── dbSetup.js         # Setup de BD para integración
│       │   ├── testHelpers.js    # Helpers para integración
│       │   └── integrationSetup.js
│       └── *.integration.test.js # Tests de integración
```

### Frontend

```
src/
├── __tests__/
│   ├── setup/
│   │   ├── testSetup.ts           # Setup global
│   │   └── msw/
│   │       ├── server.ts          # Servidor MSW
│   │       └── handlers.ts        # Handlers de mocks
│   ├── utils/
│   │   ├── testUtils.tsx          # Utilidades de testing
│   │   └── mockData.ts            # Datos mock
│   ├── services/                  # Tests de servicios
│   ├── hooks/                     # Tests de hooks
│   └── components/                # Tests de componentes
```

---

## 📈 Cobertura

### Backend

**Cobertura estimada**: ~85%

- ✅ Utilidades: 100% (JWT, Crypto)
- ✅ Middleware: 100% (Auth)
- ✅ Modelos: ~90% (todos los modelos principales)
- ✅ Controladores: ~85% (Auth, Cliente, Operario, Admin)
- ✅ Integración: ~70% (endpoints principales)

### Frontend

**Cobertura estimada**: ~60%

- ✅ Servicios: ~80% (ApiClient, AuthService, ClienteService)
- ✅ Hooks: ~70% (useCliente completo)
- ✅ Componentes: ~40% (ErrorBoundary, Login, DashboardCliente)

---

## 🎯 Mejores Prácticas

### Backend

1. **Tests Unitarios**
   - Mockear todas las dependencias externas (BD, servicios)
   - Aislar la lógica de negocio
   - Tests rápidos y determinísticos

2. **Tests de Integración**
   - Usar base de datos de prueba (`DATABASE_URL_TEST`)
   - Limpiar datos entre tests
   - Probar flujos completos end-to-end

3. **Nomenclatura**
   - Archivos: `*.test.js`
   - Describe: nombre del módulo/clase
   - Tests: "debería [acción esperada]"

### Frontend

1. **Testing de Componentes**
   - Renderizar con todos los providers necesarios
   - Usar `userEvent` para interacciones
   - Verificar accesibilidad básica

2. **Testing de Hooks**
   - Usar `renderHook` de React Testing Library
   - Mockear servicios y APIs
   - Verificar estados de carga y error

3. **Mocking**
   - MSW para mockear APIs
   - Mockear módulos con `vi.mock()`
   - Usar datos mock consistentes

---

## 🔧 Troubleshooting

### Backend

**Error: "Cannot find module"**
```bash
# Asegúrate de estar en el directorio api/
cd api && npm test
```

**Error: "Database connection failed"**
- Verifica que `DATABASE_URL_TEST` esté configurada en `.env`
- Asegúrate de que la BD de prueba esté corriendo

### Frontend

**Error: "MSW not working"**
- Verifica que los handlers estén correctamente configurados
- Revisa que el servidor MSW se inicie en `testSetup.ts`

**Error: "Component not rendering"**
- Verifica que todos los providers estén incluidos
- Revisa mocks de hooks y contextos

---

## 📚 Referencias

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)

---

**Última actualización**: 14/11/2025

