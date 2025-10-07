# Mejoras Pendientes - Sistema PPIV

**Fecha de análisis:** 4 de octubre de 2025  
**Branch:** integracion-base-datos  
**Estado actual:** Sistema operativo con seguridad básica implementada

---

## YA IMPLEMENTADO (Completado)

- [x] Helmet (Headers HTTP seguros)
- [x] CORS configurado con whitelist
- [x] Rate Limiting (general y login)
- [x] Autenticación JWT
- [x] Middleware de autorización por roles
- [x] Tests unitarios básicos (Socio, Usuario, Factura)
- [x] Tests de integración básicos (Auth, Clientes)
- [x] Separación de concerns (MVC)
- [x] Variables de entorno (.env)
- [x] Documentación de API (docs/API.md)
- [x] Documentación de Base de Datos (docs/DATABASE.md)

---

## PRIORIDAD CRITICA (Implementar ANTES de producción)

### 1. Validación de Datos con Joi o Zod
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 2-3 horas  
**Riesgo sin implementar:** ALTO

**Problema actual:**
```javascript
// backend/controllers/AdministradorController.js
static async crearSocio(req, res) {
  const datosSocio = req.body;
  
  // Validación básica manual (insuficiente)
  if (!datosSocio.nombre || !datosSocio.apellido || !datosSocio.dni || !datosSocio.email) {
    return respuestaError(res, 'Faltan datos obligatorios: nombre, apellido, DNI, email', 400);
  }
  // No valida formato de email, longitud de strings, tipo de datos, etc.
}
```

**Qué falta:**
- Validación de formatos (email, DNI, teléfono)
- Validación de tipos de datos
- Validación de longitudes (min/max)
- Sanitización de inputs
- Mensajes de error descriptivos

**Endpoints sin validación adecuada:**
- POST /api/administradores/socios
- PUT /api/administradores/socios/:id
- POST /api/clientes/reclamos
- PATCH /api/administradores/reclamos/:id/asignar

---

### 2. Manejo de Errores Centralizado
**Estado:** PARCIALMENTE IMPLEMENTADO  
**Tiempo estimado:** 1 hora  
**Riesgo sin implementar:** MEDIO

**Problema actual:**
```javascript
// Cada controller maneja errores de forma inconsistente
catch (error) {
  console.error('Error al actualizar socio:', error);
  return respuestaError(res, 'Error al actualizar socio');
}
```

**Qué falta:**
- Middleware global de manejo de errores
- Clases de error personalizadas
- Stack traces en desarrollo, mensajes genéricos en producción
- Logging estructurado de errores

---

### 3. Logging Estructurado (Winston)
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 1-2 horas  
**Riesgo sin implementar:** MEDIO

**Problema actual:**
```javascript
// backend/server.js
console.log(`${req.method} ${req.path}`);  // Logging básico
console.error('Error al actualizar socio:', error);  // Sin contexto
```

**Qué falta:**
- Winston o similar para logging profesional
- Niveles de log (error, warn, info, debug)
- Rotación de logs
- Logs estructurados (JSON)
- Contexto en cada log (usuario, IP, timestamp)

---

### 4. Variables de Entorno Faltantes
**Estado:** INCOMPLETO  
**Tiempo estimado:** 30 minutos  
**Riesgo sin implementar:** BAJO

**Variables que faltan:**
```bash
# backend/.env
LOG_LEVEL=info
MAX_REQUEST_SIZE=10mb
UPLOAD_MAX_SIZE=5mb
SESSION_TIMEOUT=24h
BCRYPT_ROUNDS=10
```

---

### 5. Sanitización de SQL (Verificación)
**Estado:** REVISAR  
**Tiempo estimado:** 1 hora  
**Riesgo sin implementar:** ALTO

**Ya implementado parcialmente:**
```javascript
// backend/models/Socio.js
const camposPermitidos = ['socio_id', 'nombre', 'apellido', 'dni', 'email', 'fecha_alta', 'activo'];
const campoOrden = camposPermitidos.includes(orden) ? orden : 'socio_id';
```

**Revisar en:**
- Todos los modelos que construyen queries dinámicas
- Búsquedas con LIKE/ILIKE
- Parámetros de ordenamiento

---

## PRIORIDAD ALTA (Implementar en 2-4 semanas)

### 6. Tests de Integración Completos
**Estado:** PARCIAL (solo auth y clientes)  
**Tiempo estimado:** 4-6 horas  
**Cobertura actual:** ~30%

**Tests faltantes:**
- Administradores (CRUD socios, gestión reclamos)
- Operarios (actualizar reclamos, cargar insumos)
- Autenticación (refresh tokens, logout)
- Rate limiting
- CORS
- Validaciones

**Comando:**
```bash
npm test -- --coverage
```

---

### 7. Versionado de API
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 1 hora  
**Impacto:** BAJO ahora, ALTO en el futuro

**Cambiar:**
```javascript
// De:
app.use('/api/auth', rutasAuth);

// A:
const API_VERSION = '/api/v1';
app.use(`${API_VERSION}/auth`, rutasAuth);
```

**Beneficio:** Permite cambios sin romper clientes existentes

---

### 8. Paginación Estandarizada
**Estado:** INCONSISTENTE  
**Tiempo estimado:** 2 horas  
**Riesgo sin implementar:** BAJO

**Problema actual:**
```javascript
// Algunos endpoints usan pagina/limite
// Otros usan offset/limite
// Las respuestas no son consistentes
```

**Solución:**
- Middleware de paginación
- Formato estándar de respuesta
- Metadata de paginación (siguiente, anterior, total)

---

### 9. Documentación Swagger/OpenAPI
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 3-4 horas  
**Impacto:** Mejora colaboración y testing

**Implementar:**
```bash
npm install swagger-ui-express swagger-jsdoc
```

**Resultado:** UI interactiva en /api-docs

---

### 10. HTTPS en Desarrollo
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 30 minutos  
**Necesario para:** Testing de PWA, cookies seguras

---

## PRIORIDAD MEDIA (Implementar en 1-2 meses)

### 11. Refresh Tokens
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 2-3 horas

**Problema actual:**
- JWT expira en 24h
- Usuario debe hacer login nuevamente
- No hay forma de revocar tokens

**Solución:**
- Access token (15 min)
- Refresh token (7 días)
- Tabla refresh_tokens en DB

---

### 12. Soft Delete
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 2 horas

**Problema actual:**
```javascript
// DELETE elimina permanentemente
static async eliminar(socioId) {
  await pool.query('DELETE FROM socio WHERE socio_id = $1', [socioId]);
}
```

**Solución:**
- Campo deleted_at
- Filtrar registros eliminados
- Posibilidad de recuperar datos

---

### 13. Auditoría de Cambios
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 3-4 horas

**Qué registrar:**
- Quién modificó qué
- Cuándo se hizo el cambio
- Valores anteriores

**Tabla sugerida:**
```sql
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  tabla VARCHAR(50),
  registro_id INTEGER,
  accion VARCHAR(20), -- INSERT, UPDATE, DELETE
  usuario_id INTEGER,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha_hora TIMESTAMP DEFAULT NOW()
);
```

---

### 14. Caché con Redis
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 2-3 horas

**Endpoints a cachear:**
- GET /api/administradores/dashboard (estadísticas)
- GET /api/clientes/facturas
- GET /api/administradores/socios (con TTL 5 min)

---

### 15. Upload de Archivos
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 3 horas

**Casos de uso:**
- Comprobantes de pago (facturas)
- Fotos de reclamos
- Documentos de socios

**Instalar:**
```bash
npm install multer
```

---

## PRIORIDAD BAJA (Nice to have)

### 16. Notificaciones por Email
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 4 horas

**Casos:**
- Confirmación de registro
- Reclamo creado/actualizado
- Factura vencida
- Password recovery

---

### 17. WebSockets para Tiempo Real
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 3-4 horas

**Casos:**
- Notificaciones en tiempo real
- Dashboard con updates automáticos
- Chat de soporte

---

### 18. Compresión de Respuestas
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 15 minutos

```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

---

### 19. Backup Automatizado
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 2 horas

**Script de backup diario:**
```bash
pg_dump cooperativa_ugarte_db > backup_$(date +%Y%m%d).sql
```

---

### 20. CI/CD Pipeline
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 4-6 horas

**GitHub Actions:**
- Run tests on push
- Deploy to staging on merge to develop
- Deploy to production on merge to main

---

## CALIDAD DE CÓDIGO

### 21. ESLint Configurado
**Estado:** VERIFICAR  
**Tiempo estimado:** 30 minutos

```bash
npm install eslint --save-dev
npx eslint --init
```

---

### 22. Prettier Configurado
**Estado:** VERIFICAR  
**Tiempo estimado:** 15 minutos

```bash
npm install prettier --save-dev
```

---

### 23. Husky Pre-commit Hooks
**Estado:** NO IMPLEMENTADO  
**Tiempo estimado:** 30 minutos

```bash
npm install husky lint-staged --save-dev
```

**Ejecutar antes de commit:**
- Linter
- Format
- Tests

---

### 24. Remover console.logs de Producción
**Estado:** PENDIENTE  
**Ubicaciones:**
- src/components/admin/GestionSocios.jsx (línea 230)
- src/components/admin/SocioEditar.jsx (línea 35)
- src/components/operario/CargarInsumos.jsx (línea 45)
- src/components/operario/ReclamoDetalle.jsx (líneas 58, 65)
- src/components/cliente/ReclamosListado.jsx (línea 103)
- src/components/DashboardOperario.jsx (línea 76)
- src/components/admin/SocioNuevo.jsx (línea 67)

**Solución:**
- Usar logger en frontend también
- Remover console.logs de producción con build step

---

## RESUMEN POR TIEMPO

### Esta Semana (8-12 horas)
1. Validación de datos (Joi) - 3h
2. Logging estructurado (Winston) - 2h
3. Manejo de errores centralizado - 1h
4. Versionado API - 1h
5. Variables de entorno faltantes - 30min
6. Remover console.logs - 1h

### Próximo Mes (20-30 horas)
7. Tests completos + cobertura - 6h
8. Paginación estandarizada - 2h
9. Swagger/OpenAPI - 4h
10. Refresh tokens - 3h
11. Soft delete - 2h
12. Auditoría - 4h
13. Sanitización SQL (revisión) - 2h

### Antes de Producción
14. HTTPS - 30min
15. Caché Redis - 3h
16. Upload archivos - 3h
17. CI/CD - 6h
18. ESLint + Prettier + Husky - 2h

### Futuro (Opcional)
19. Notificaciones email - 4h
20. WebSockets - 4h
21. Compresión - 15min
22. Backup automatizado - 2h

---

## IMPACTO vs ESFUERZO

### Quick Wins (Alto impacto, Bajo esfuerzo)
- Variables de entorno faltantes (30min)
- Compresión (15min)
- Remover console.logs (1h)
- Versionado API (1h)

### High Priority (Alto impacto, Alto esfuerzo)
- Validación de datos (3h)
- Logging estructurado (2h)
- Tests completos (6h)
- Refresh tokens (3h)

### Low Priority (Bajo impacto)
- WebSockets
- Notificaciones email
- Caché Redis (dependiendo del tráfico)

---

## RECOMENDACIÓN FINAL

**Orden sugerido de implementación:**

**Sprint 1 (Esta semana):**
1. Validación de datos con Joi
2. Logging estructurado con Winston
3. Manejo de errores centralizado
4. Remover console.logs

**Sprint 2 (Próxima semana):**
5. Versionado de API
6. Variables de entorno completas
7. Paginación estandarizada
8. Tests de integración completos

**Sprint 3 (Semanas 3-4):**
9. Swagger/OpenAPI
10. Refresh tokens
11. Soft delete
12. Sanitización SQL (revisión)

**Antes de producción:**
13. HTTPS
14. CI/CD
15. ESLint + Prettier + Husky
16. Auditoría de seguridad completa

**Post-lanzamiento:**
17. Caché si hay problemas de performance
18. Upload de archivos según demanda
19. Notificaciones email
20. Backup automatizado

---

**Última actualización:** 4 de octubre de 2025
