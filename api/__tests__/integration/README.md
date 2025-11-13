# Tests de Integración

Este directorio contiene los tests de integración que verifican el funcionamiento completo del sistema, incluyendo la interacción con la base de datos real.

## Configuración Requerida

### 1. Base de Datos

Los tests de integración requieren una base de datos PostgreSQL en ejecución. Tienes dos opciones:

#### Opción A: Usar Docker Compose (Recomendado)

```bash
# Iniciar la base de datos
docker-compose up postgres -d

# Verificar que está corriendo
docker ps
```

#### Opción B: Base de Datos Local

Asegúrate de tener PostgreSQL corriendo localmente en el puerto 5432.

### 2. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Base de datos de prueba (puede ser la misma que desarrollo)
DATABASE_URL=postgresql://coop_user:cooperativa2024@localhost:5432/cooperativa_ugarte_db

# O usa una base de datos separada para tests
TEST_DATABASE_URL=postgresql://coop_user:cooperativa2024@localhost:5432/cooperativa_ugarte_test

# JWT Secret
JWT_SECRET=tu_secret_key_para_tests
JWT_EXPIRES_IN=24h
```

**Nota**: Si no defines `TEST_DATABASE_URL`, se usará `DATABASE_URL` por defecto.

## Ejecutar Tests de Integración

### Todos los tests de integración

```bash
cd api
npm run test:integration
```

### Un archivo específico

```bash
npm run test:integration -- auth.integration.test.js
```

### Con cobertura

```bash
npm run test:coverage -- --selectProjects integration
```

## Estructura

```
integration/
├── setup/
│   ├── dbSetup.js              # Configuración de base de datos
│   ├── testHelpers.js          # Helpers para tests
│   └── integrationSetup.js     # Setup global
├── auth.integration.test.js    # Tests de autenticación
└── README.md                    # Este archivo
```

## Helpers Disponibles

### `createRequest()`
Crea un request de Supertest con la app configurada.

```javascript
import { createRequest } from '../setup/testHelpers.js';

const response = await createRequest()
  .get('/api/auth/perfil')
  .set('Authorization', `Bearer ${token}`);
```

### `crearUsuarioPrueba(datos)`
Crea un usuario de prueba en la base de datos.

```javascript
const usuario = await crearUsuarioPrueba({
  email: 'test@test.com',
  activo: true
});
```

### `crearSocioPrueba(datos)`
Crea un socio de prueba en la base de datos.

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
Limpia las tablas especificadas (útil para resetear datos entre tests).

```javascript
await limpiarTablas(['usuario', 'socio']);
```

## Buenas Prácticas

1. **Limpieza de Datos**: Siempre limpia los datos de prueba después de cada test usando `afterAll` o `afterEach`.

2. **Datos Únicos**: Usa timestamps o UUIDs para crear datos únicos y evitar conflictos.

3. **Aislamiento**: Cada test debe ser independiente y no depender de otros tests.

4. **Timeouts**: Los tests de integración pueden tardar más, usa timeouts apropiados (30s por defecto).

5. **Base de Datos Separada**: Considera usar una base de datos separada para tests en producción.

## Troubleshooting

### Error: "DATABASE_URL no está configurada"

Asegúrate de tener el archivo `.env` configurado o las variables de entorno establecidas.

### Error: "No se pudo conectar a la base de datos"

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   docker ps  # Si usas Docker
   # o
   psql -U coop_user -d cooperativa_ugarte_db  # Si es local
   ```

2. Verifica las credenciales en `.env`.

### Tests muy lentos

- Los tests de integración son más lentos que los unitarios porque interactúan con la base de datos real.
- Considera usar transacciones que se revierten después de cada test para acelerar la limpieza.

## Próximos Tests

- [ ] Tests de integración para ClienteController
- [ ] Tests de integración para OperarioController
- [ ] Tests de integración para AdministradorController
- [ ] Tests de integración para endpoints complejos (reclamos, facturas, etc.)

