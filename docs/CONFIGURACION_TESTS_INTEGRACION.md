# Configuración de Tests de Integración

## Resumen

Los tests de integración verifican el funcionamiento completo del sistema, incluyendo la interacción con la base de datos real y el servidor Express.

## Requisitos Previos

### 1. Base de Datos PostgreSQL

Necesitas tener PostgreSQL corriendo. Opciones:

#### Opción A: Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up postgres -d

# Verificar que está corriendo
docker ps | grep postgres
```

#### Opción B: PostgreSQL Local

Asegúrate de tener PostgreSQL instalado y corriendo en el puerto 5432.

### 2. Variables de Entorno

Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
# Base de datos (puede ser la misma que desarrollo)
DATABASE_URL=postgresql://coop_user:cooperativa2024@localhost:5432/cooperativa_ugarte_db

# O usa una base de datos separada para tests (recomendado)
TEST_DATABASE_URL=postgresql://coop_user:cooperativa2024@localhost:5432/cooperativa_ugarte_test

# JWT
JWT_SECRET=tu_secret_key_para_tests
JWT_EXPIRES_IN=24h

# Entorno
NODE_ENV=test
```

**Nota Importante**: Si no defines `TEST_DATABASE_URL`, se usará `DATABASE_URL` por defecto. Se recomienda usar una base de datos separada para tests en producción.

## Estructura de Archivos

```
api/
├── __tests__/
│   ├── integration/
│   │   ├── setup/
│   │   │   ├── dbSetup.js              # Configuración de BD
│   │   │   ├── testHelpers.js          # Helpers para tests
│   │   │   └── integrationSetup.js     # Setup global
│   │   ├── auth.integration.test.js    # Tests de autenticación
│   │   └── README.md                   # Documentación
│   └── unit/                            # Tests unitarios
└── jest.config.js                       # Configuración Jest
```

## Ejecutar Tests

### Todos los tests de integración

```bash
cd api
npm run test:integration
```

### Solo tests unitarios

```bash
npm run test:unit
```

### Todos los tests (unitarios + integración)

```bash
npm test
```

### Un archivo específico

```bash
npm run test:integration -- auth.integration.test.js
```

### Con cobertura

```bash
npm run test:coverage
```

## Configuración de Jest

La configuración en `jest.config.js` usa **proyectos múltiples** para separar tests unitarios e integración:

- **Proyecto "unit"**: Tests rápidos sin base de datos
- **Proyecto "integration"**: Tests más lentos con base de datos real

Cada proyecto tiene su propio:
- `setupFilesAfterEnv`: Setup específico
- `testTimeout`: Timeout apropiado (10s para unit, 30s para integration)

## Helpers Disponibles

### `createRequest()`
Crea un request de Supertest.

```javascript
import { createRequest } from '../setup/testHelpers.js';

const response = await createRequest()
  .get('/api/auth/perfil')
  .set('Authorization', `Bearer ${token}`);
```

### `crearUsuarioPrueba(datos)`
Crea un usuario de prueba en la BD.

```javascript
const usuario = await crearUsuarioPrueba({
  email: 'test@test.com',
  activo: true
});
```

### `crearSocioPrueba(datos)`
Crea un socio de prueba.

```javascript
const socio = await crearSocioPrueba({
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@test.com'
});
```

### `loginYobtenerToken(email, password)`
Hace login y retorna el token JWT.

```javascript
const token = await loginYobtenerToken('test@test.com', 'password123');
```

### `limpiarTablas(tablas)`
Limpia las tablas especificadas.

```javascript
await limpiarTablas(['usuario', 'socio']);
```

## Buenas Prácticas

1. **Limpieza de Datos**: Siempre limpia los datos después de cada test.

2. **Datos Únicos**: Usa timestamps o UUIDs para evitar conflictos.

3. **Aislamiento**: Cada test debe ser independiente.

4. **Timeouts**: Los tests de integración pueden tardar más (30s por defecto).

5. **Base de Datos Separada**: Usa una BD separada para tests en producción.

## Troubleshooting

### Error: "DATABASE_URL no está configurada"

Verifica que el archivo `.env` exista y tenga `DATABASE_URL` o `TEST_DATABASE_URL`.

### Error: "No se pudo conectar a la base de datos"

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   docker ps  # Si usas Docker
   ```

2. Verifica las credenciales en `.env`.

3. Prueba la conexión manualmente:
   ```bash
   psql -U coop_user -d cooperativa_ugarte_db
   ```

### Tests muy lentos

- Los tests de integración son más lentos porque interactúan con la BD real.
- Considera usar transacciones que se revierten después de cada test.

### Error: "Cannot find module"

Asegúrate de estar ejecutando desde el directorio `api/`:
```bash
cd api
npm run test:integration
```

## Próximos Pasos

- [x] Configuración básica de tests de integración
- [x] Tests de autenticación
- [ ] Tests de ClienteController
- [ ] Tests de OperarioController
- [ ] Tests de AdministradorController
- [ ] Tests de endpoints complejos

## Referencias

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [README de Tests de Integración](../api/__tests__/integration/README.md)

