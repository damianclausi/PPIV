#  Recomendaciones para el Sistema PPIV

##  Estado Actual
 API RESTful bien diseñada (85-90% compliance)
 Arquitectura clara y mantenible
 Autenticación JWT implementada
 Documentación existente

---

##  Mejoras Recomendadas por Prioridad

### **PRIORIDAD ALTA** 

#### 1. Seguridad - Configurar CORS correctamente

**Problema actual:**
```javascript
// backend/server.js
app.use(cors()); //  Permite requests desde cualquier origen
```

**Solución:**
```javascript
// backend/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**Agregar en .env:**
```
FRONTEND_URL=http://localhost:3002
```

#### 2. Rate Limiting (Prevenir ataques)

**Instalar:**
```bash
npm install express-rate-limit
```

**Implementar:**
```javascript
// backend/server.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas peticiones desde esta IP, intente más tarde'
});

// Aplicar a todas las rutas
app.use('/api/', limiter);

// Rate limit más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 intentos de login
  message: 'Demasiados intentos de login, intente en 15 minutos'
});

app.use('/api/auth/login', loginLimiter);
```

#### 3. Helmet (Headers de seguridad)

**Instalar:**
```bash
npm install helmet
```

**Implementar:**
```javascript
// backend/server.js
import helmet from 'helmet';

app.use(helmet());
```

#### 4. Variables de entorno para configuración sensible

**Verificar que NUNCA se suban:**
- `.env` debe estar en `.gitignore`  (ya lo tienes)
- Crear `.env.example` con valores de ejemplo  (ya lo tienes)

---

### **PRIORIDAD MEDIA** 

#### 5. Versionado de API

**Cambiar:**
```javascript
// backend/server.js
app.use('/api/auth', rutasAuth);
app.use('/api/clientes', rutasClientes);
app.use('/api/operarios', rutasOperarios);
app.use('/api/administradores', rutasAdministradores);
```

**Por:**
```javascript
// backend/server.js
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, rutasAuth);
app.use(`${API_VERSION}/clientes`, rutasClientes);
app.use(`${API_VERSION}/operarios`, rutasOperarios);
app.use(`${API_VERSION}/administradores`, rutasAdministradores);

// Mantener rutas legacy para compatibilidad (opcional)
app.use('/api/auth', rutasAuth);
```

**Actualizar frontend:**
```javascript
// src/services/api.js
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api/v1';
```

#### 6. Logging Estructurado

**Instalar:**
```bash
npm install winston
```

**Crear archivo:** `backend/utils/logger.js`
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

**Usar en lugar de console.log:**
```javascript
// En lugar de:
console.log('GET /api/salud');
console.error('Error al actualizar socio:', error);

// Usar:
logger.info('GET /api/salud');
logger.error('Error al actualizar socio', { error, socioId });
```

#### 7. Validación de Datos con Joi o Zod

**Instalar:**
```bash
npm install joi
```

**Ejemplo:**
```javascript
// backend/validators/socioValidator.js
import Joi from 'joi';

export const crearSocioSchema = Joi.object({
  nombre: Joi.string().min(2).max(50).required(),
  apellido: Joi.string().min(2).max(50).required(),
  dni: Joi.string().pattern(/^[0-9]{7,8}$/).required(),
  email: Joi.string().email().required(),
  telefono: Joi.string().optional(),
  direccion: Joi.string().optional(),
  fecha_nacimiento: Joi.date().optional(),
  activo: Joi.boolean().default(true)
});

export const actualizarSocioSchema = Joi.object({
  nombre: Joi.string().min(2).max(50),
  apellido: Joi.string().min(2).max(50),
  dni: Joi.string().pattern(/^[0-9]{7,8}$/),
  email: Joi.string().email(),
  telefono: Joi.string(),
  direccion: Joi.string(),
  fecha_nacimiento: Joi.date(),
  activo: Joi.boolean()
}).min(1); // Al menos un campo debe estar presente
```

**Middleware:**
```javascript
// backend/middleware/validar.js
export const validar = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errores = error.details.map(err => ({
        campo: err.path.join('.'),
        mensaje: err.message
      }));
      
      return res.status(422).json({
        exito: false,
        mensaje: 'Errores de validación',
        errores
      });
    }
    
    req.body = value; // Usar datos validados
    next();
  };
};
```

**Usar en rutas:**
```javascript
// backend/routes/administradores.js
import { crearSocioSchema, actualizarSocioSchema } from '../validators/socioValidator.js';
import { validar } from '../middleware/validar.js';

router.post('/socios', validar(crearSocioSchema), AdministradorController.crearSocio);
router.put('/socios/:id', validar(actualizarSocioSchema), AdministradorController.actualizarSocio);
```

#### 8. Paginación Estandarizada

**Crear middleware:**
```javascript
// backend/middleware/paginacion.js
export const paginacion = (req, res, next) => {
  const pagina = parseInt(req.query.pagina) || 1;
  const limite = Math.min(parseInt(req.query.limite) || 20, 100); // máximo 100
  const offset = (pagina - 1) * limite;
  
  req.paginacion = { pagina, limite, offset };
  next();
};

export const formatearRespuestaPaginada = (datos, total, req) => {
  const { pagina, limite } = req.paginacion;
  const totalPaginas = Math.ceil(total / limite);
  
  return {
    datos,
    paginacion: {
      pagina,
      limite,
      total,
      totalPaginas,
      tieneSiguiente: pagina < totalPaginas,
      tieneAnterior: pagina > 1
    }
  };
};
```

---

### **PRIORIDAD BAJA** 

#### 9. Testing (Muy recomendado para mantenibilidad)

Ya tienes Jest configurado. **Agregar más tests:**

```bash
# Tests de integración
npm test

# Coverage
npm test -- --coverage
```

**Meta:** Al menos 70% de cobertura en rutas críticas.

#### 10. Documentación Swagger/OpenAPI

**Instalar:**
```bash
npm install swagger-ui-express swagger-jsdoc
```

**Configurar:**
```javascript
// backend/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API PPIV - Cooperativa Ugarte',
      version: '1.0.0',
      description: 'API RESTful para gestión de cooperativa de servicios',
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Servidor de desarrollo'
      }
    ],
  },
  apis: ['./routes/*.js'], // Archivos con anotaciones JSDoc
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
```

**En server.js:**
```javascript
import { swaggerUi, specs } from './swagger.js';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**Acceder:** http://localhost:3001/api-docs

#### 11. Monitoreo y Métricas

**Para producción (futuro):**
- Sentry para error tracking
- New Relic o DataDog para APM
- Prometheus + Grafana para métricas

---

## 📝 Resumen de Prioridades

### Implementar AHORA:
1.  CORS configurado correctamente
2.  Rate limiting
3.  Helmet
4.  Validación de datos (Joi)

### Implementar en 2-4 semanas:
5.  Versionado de API (v1)
6.  Logger estructurado (Winston)
7.  Paginación estandarizada

### Implementar antes de producción:
8.  Tests completos (>70% coverage)
9.  Swagger/OpenAPI docs
10.  Monitoreo

---

##  Recursos Adicionales

- [REST API Best Practices](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

##  Decisiones de Diseño Actuales (¿Cambiar o Mantener?)

###  MANTENER:
- PATCH `/reclamos/:id/asignar` - Es claro y específico
- Estructura de respuestas con `{ exito, datos, mensaje }`
- Separación de rutas por rol (clientes, operarios, administradores)

###  CONSIDERAR CAMBIAR:
- `/api/auth/login` → `/api/v1/sesiones` (más RESTful)
  - **RECOMENDACIÓN:** Mantener `/login`, es más intuitivo

###  NO CAMBIAR (Está bien así):
- Uso de JWT para autenticación
- Estructura de carpetas (models, controllers, routes)
- Base de datos PostgreSQL

---

##  Plan de Acción Recomendado

1. **Esta semana:** Seguridad (CORS, Rate Limit, Helmet)
2. **Próxima semana:** Validación con Joi
3. **Mes 1:** Versionado + Logger
4. **Mes 2:** Tests + Documentación Swagger
5. **Antes de producción:** Todo lo anterior + Monitoreo

**¡Tu API ya es muy buena! Estas mejoras la harán excelente.** 
