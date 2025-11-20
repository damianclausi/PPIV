# 🚀 Guía de Deployment en Vercel - PPIV

## 📋 Tabla de Contenidos
1. [Resumen](#resumen)
2. [Arquitectura](#arquitectura)
3. [Cambios Realizados](#cambios-realizados)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Problemas Resueltos](#problemas-resueltos)
6. [Resultado Final](#resultado-final)

---

## Resumen

Este documento detalla todos los cambios necesarios para desplegar la aplicación **PPIV** (Plataforma de Planificación de Inversiones de la Cooperativa Eléctrica Gobernador Ugarte) en Vercel.

### Stack Tecnológico
- **Frontend:** React 18.3.1 + Vite 6.3.5
- **Backend:** Express 4.18.2 (Serverless Function)
- **Base de Datos:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Autenticación:** JWT + bcrypt

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                       Vercel Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌─────────────────────────┐   │
│  │   Static Files   │         │  Serverless Function    │   │
│  │   (Frontend)     │         │    /api/index.js        │   │
│  │                  │         │                         │   │
│  │  React + Vite    │◄────────┤  Express App            │   │
│  │  SPA Router      │  CORS   │  All routes bundled     │   │
│  └──────────────────┘         └─────────────────────────┘   │
│         │                              │                     │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │                              │
          │                              ▼
          │                     ┌──────────────────┐
          │                     │    Supabase      │
          └────────────────────►│   PostgreSQL     │
            (User browser)      │   (Connection    │
                                │    Pooling)      │
                                └──────────────────┘
```

---

## Cambios Realizados

### 1. Configuración del Proyecto (`package.json`)

**Cambio:** Agregar `"type": "module"` para soporte ES6 modules.

```json
{
  "name": "ppiv-el-quinto-elemento",
  "type": "module",
  "version": "0.0.0",
  ...
}
```

**Razón:** Express y el backend usan sintaxis ES6 (`import/export`).

---

### 2. Configuración de Build (`vite.config.ts`)

**Cambio:** Ajustar directorio de salida a `dist` (Vercel lo espera por defecto).

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@radix-ui/react-accordion': '@radix-ui/react-accordion',
      // ... otros aliases sin versión
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',  // ← Cambio importante
  },
});
```

**Antes:** `outDir: 'build'`
**Ahora:** `outDir: 'dist'`

---

### 3. Configuración de PostCSS y Tailwind

**Cambio:** Renombrar archivos de configuración a `.cjs` (CommonJS).

**Archivos afectados:**
- `postcss.config.js` → `postcss.config.cjs`
- `tailwind.config.js` → `tailwind.config.cjs`

**Contenido de `postcss.config.cjs`:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Razón:** Con `"type": "module"` en package.json, estos archivos necesitan ser CommonJS explícitamente.

---

### 4. Configuración de Vercel (`vercel.json`)

**Archivo:** Crear `vercel.json` en la raíz del proyecto.

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Explicación:**
- **Primera regla:** Todas las rutas `/api/*` van a la función serverless
- **Segunda regla:** Todas las demás rutas van a `index.html` (SPA routing)
- **Regex `/((?!api).*)`:** Captura todo EXCEPTO rutas que empiezan con `/api`

---

### 5. Estructura del Backend (Serverless)

#### 5.1. Problema: Límite de 12 funciones en Vercel Hobby

**Problema inicial:** Vercel detectaba cada archivo en `/api/` como una función separada. Teníamos ~45 archivos, pero el plan gratuito permite máximo 12 funciones.

**Solución:** Consolidar todo el backend en una sola función serverless.

#### 5.2. Nueva estructura de carpetas

```
api/
├── index.js           # ← Único punto de entrada (función serverless)
├── test.js            # ← Endpoint de diagnóstico simple
└── _lib/              # ← Todo el código interno (Vercel ignora carpetas con _)
    ├── controllers/
    │   ├── AuthController.js
    │   ├── ClienteController.js
    │   ├── OperarioController.js
    │   └── ...
    ├── models/
    │   ├── Usuario.js
    │   ├── Cliente.js
    │   └── ...
    ├── routes/
    │   ├── auth.js
    │   ├── clientes.js
    │   └── ...
    ├── middleware/
    │   ├── auth.js
    │   └── ...
    ├── utils/
    │   ├── jwt.js
    │   ├── crypto.js
    │   └── ...
    └── db.js
```

**Clave:** El prefijo `_` en `_lib` hace que Vercel ignore esa carpeta para la creación de funciones.

---

### 6. Punto de Entrada del Backend (`api/index.js`)

**Archivo completo con comentarios:**

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './_lib/db.js';

// Importar rutas desde _lib
import rutasAuth from './_lib/routes/auth.js';
import rutasClientes from './_lib/routes/clientes.js';
import rutasOperarios from './_lib/routes/operarios.js';
// ... todas las demás rutas

// Cargar variables de entorno solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const app = express();
const PUERTO = process.env.PORT || 3001;

// ⚠️ IMPORTANTE: Confiar en proxies (necesario para Vercel)
// Vercel actúa como proxy reverso y envía headers X-Forwarded-*
app.set('trust proxy', 1);

// Seguridad: Helmet - Headers HTTP seguros
app.use(helmet());

// Seguridad: CORS configurado correctamente
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3002',
    'https://ppiv.vercel.app',
    /^https:\/\/ppiv-.*\.vercel\.app$/ // Todos los preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    exito: false,
    mensaje: 'Demasiadas peticiones desde esta IP, intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de login. Por favor, intente nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones con información detallada
app.use((req, res, next) => {
  console.log(`📨 Express recibió: ${req.method} ${req.path} (URL completa: ${req.url})`);
  console.log('📋 Headers:', JSON.stringify({
    'content-type': req.headers['content-type'],
    'origin': req.headers['origin'],
    'authorization': req.headers['authorization'] ? 'presente' : 'ausente'
  }));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body keys:', Object.keys(req.body));
  }
  next();
});

// Aplicar rate limiting
app.use('/api/', limiterGeneral);
app.use('/api/auth/login', limiterLogin);

// Rutas - TODAS con prefijo /api/
app.use('/api/auth', rutasAuth);
app.use('/api/clientes', rutasClientes);
app.use('/api/operarios', rutasOperarios);
app.use('/api/administradores', rutasAdministradores);
app.use('/api/tipos-reclamo', rutasTiposReclamo);
app.use('/api/detalles-tipo-reclamo', rutasDetallesTipoReclamo);
app.use('/api/prioridades', rutasPrioridades);
app.use('/api/ot-tecnicas', rutasOTTecnicas);
app.use('/api/cuadrillas', rutasCuadrillas);
app.use('/api/itinerario', rutasItinerario);

// Ruta de verificación de salud
app.get('/api/salud', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({
      estado: 'ok',
      baseDatos: 'conectada',
      marcaDeTiempo: resultado.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      estado: 'error',
      baseDatos: 'desconectada',
      error: error.message
    });
  }
});

// Ruta raíz con documentación de la API
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Cooperativa Eléctrica Gobernador Ugarte',
    version: '1.0.0',
    arquitectura: 'REST con patrón MVC',
    endpoints: {
      salud: '/api/salud',
      auth: {
        login: 'POST /api/auth/login',
        perfil: 'GET /api/auth/perfil',
        verificar: 'POST /api/auth/verificar'
      },
      // ... resto de endpoints
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  console.log(`❌ 404: Ruta no encontrada - ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    ruta: req.url,
    metodo: req.method
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 Error global capturado:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: 'Error del servidor',
    mensaje: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

// Solo iniciar servidor en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
  });
}

// ⚠️ EXPORTACIÓN PARA VERCEL SERVERLESS
export default async function handler(req, res) {
  try {
    console.log('📝 Vercel Function invoked:', {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers)
    });
    console.log('🔑 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      hasDB: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET
    });
    
    // Express ya tiene las rutas definidas con /api/ prefix
    // No necesitamos transformar la URL
    return app(req, res);
  } catch (error) {
    console.error('❌ Error en Vercel handler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
}

// También exportar la app para testing
export { app };
```

**Puntos clave:**
1. `app.set('trust proxy', 1)` - Esencial para Vercel
2. CORS con regex para preview deployments
3. Todas las rutas tienen prefijo `/api/`
4. Export default del handler para Vercel
5. Logging exhaustivo para debugging

---

### 7. Configuración de Base de Datos (`api/_lib/db.js`)

**Cambios importantes:**

```javascript
import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const { Pool } = pg;

// ⚠️ Validar que DATABASE_URL esté presente
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR CRÍTICO: DATABASE_URL no está definida');
  throw new Error('DATABASE_URL no está configurada en las variables de entorno');
}

// Limpiar la URL (remover espacios, saltos de línea, etc)
const databaseUrl = process.env.DATABASE_URL.trim();

console.log('🔍 DATABASE_URL detectada:', {
  length: databaseUrl.length,
  starts: databaseUrl.substring(0, 20),
  protocol: databaseUrl.split(':')[0],
  hasSpaces: databaseUrl.includes(' '),
  hasNewlines: databaseUrl.includes('\n') || databaseUrl.includes('\r')
});

// Configuración para Supabase
let poolConfig;
try {
  if (databaseUrl.includes('supabase') || databaseUrl.includes('pooler')) {
    console.log('🔧 Detectada conexión Supabase, usando configuración específica');
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    };
  } else {
    poolConfig = {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  console.log('✅ Configuración del pool preparada');
} catch (error) {
  console.error('❌ Error al preparar configuración:', error);
  throw error;
}

// Crear pool de conexiones
let pool;
try {
  console.log('🔨 Creando pool de conexiones...');
  pool = new Pool(poolConfig);
  console.log('✅ Pool creado exitosamente');
} catch (error) {
  console.error('❌ ERROR al crear pool:', error);
  throw error;
}

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

export default pool;
```

**Importante:** 
- Validación de `DATABASE_URL`
- Sanitización con `.trim()`
- Detección automática de Supabase
- SSL configurado correctamente
- Logging para debugging

---

### 8. Componentes UI - Remover Versiones Específicas

**Problema:** Imports con versiones específicas causan errores de TypeScript.

**Ejemplo en `accordion.tsx`:**

**Antes:**
```typescript
import * as AccordionPrimitive from "@radix-ui/react-accordion@1.2.3"
```

**Después:**
```typescript
import * as AccordionPrimitive from "@radix-ui/react-accordion"
```

**Comando usado para fix masivo:**
```bash
find src/components/ui -name "*.tsx" -exec sed -i 's/@radix-ui\/\([^@]*\)@[0-9.]*/@radix-ui\/\1/g' {} \;
```

**Archivos afectados:** Todos los 38 componentes en `src/components/ui/`

---

### 9. Dependencias - Resolución de Conflictos

**Problema:** `date-fns` v4.1.0 incompatible con `react-day-picker` v8.10.1

**Solución:** Downgrade de `date-fns`

```bash
npm uninstall date-fns
npm install date-fns@3.6.0
```

**En `package.json`:**
```json
{
  "dependencies": {
    "date-fns": "3.6.0",
    "react-day-picker": "8.10.1"
  }
}
```

---

### 10. Favicon - Actualización

**Archivo:** `index.html`

**Cambio:** Emoji de 💧 (gota de agua) a ⚡ (rayo/electricidad)

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
```

**Razón:** Cooperativa **Eléctrica**, el rayo es más representativo.

---

## Configuración de Variables de Entorno

### En Vercel Dashboard

**Settings → Environment Variables**

#### Variables requeridas:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.xxxxx:PASSWORD@aws-x-xx-xxxx-x.pooler.supabase.com:6543/postgres` | Connection string de Supabase |
| `JWT_SECRET` | `tu-secreto-jwt-super-seguro-y-largo` | Secreto para firma de JWT |
| `NODE_ENV` | `production` | Ambiente de ejecución |
| `FRONTEND_URL` | `https://ppiv.vercel.app` | URL del frontend (opcional) |

#### ⚠️ IMPORTANTE: DATABASE_URL

**Formato correcto:**
```
postgresql://[usuario]:[password_url_encoded]@[host]:[puerto]/[database]
```

**Ejemplo con Supabase:**
```
postgresql://postgres.endlmrojsajxppkjezkm:MiPasswordSegura2024@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Si tu password tiene caracteres especiales (`{}[]<>?*;:` etc):**

1. URL-encode la password:
```bash
python3 -c "from urllib.parse import quote; print(quote('tu_password', safe=''))"
```

2. O mejor: Cambia la password en Supabase por una sin caracteres especiales.

**Ubicación en Supabase:**
- Settings → Database → Connection string → **Connection pooling** (Session mode)

---

## Problemas Resueltos

### 1. ❌ Error: "Module not found" en imports

**Síntoma:**
```
Error: Cannot find module '@radix-ui/react-accordion@1.2.3'
```

**Causa:** Versiones específicas en imports de TypeScript.

**Solución:** Remover versiones de todos los imports de componentes UI.

---

### 2. ❌ Error: "Peer dependency" con date-fns

**Síntoma:**
```
npm ERR! Could not resolve dependency:
npm ERR! peer date-fns@"^3.6.0" from react-day-picker@8.10.1
```

**Causa:** `date-fns` v4.x incompatible con `react-day-picker` v8.x

**Solución:** Downgrade a `date-fns@3.6.0`

---

### 3. ❌ Error: "Cannot use import statement outside a module"

**Síntoma:**
```
SyntaxError: Cannot use import statement outside a module
```

**Causa:** Archivos CommonJS (postcss.config.js, tailwind.config.js) con `"type": "module"` en package.json

**Solución:** Renombrar a `.cjs`

---

### 4. ❌ Error: "Too many functions" en Vercel

**Síntoma:**
```
Error: You have reached the function limit for the Hobby plan (12 functions).
Your build has 45 functions.
```

**Causa:** Vercel crea una función por cada archivo en `/api/`

**Solución:** 
- Consolidar todo en `/api/index.js`
- Mover código interno a `/api/_lib/` (Vercel ignora carpetas con `_`)

---

### 5. ❌ Error: "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR"

**Síntoma:**
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

**Causa:** Express no confía en headers de proxy de Vercel

**Solución:**
```javascript
app.set('trust proxy', 1);
```

---

### 6. ❌ Error: "Cannot read properties of undefined (reading 'searchParams')"

**Síntoma:**
```
TypeError: Cannot read properties of undefined (reading 'searchParams')
at parse (/var/task/node_modules/pg-connection-string/index.js:39:30)
```

**Causa:** Password con caracteres especiales rompe el parsing de la URL de PostgreSQL

**Solución:** 
1. URL-encode la password
2. O cambiar password en Supabase por una sin caracteres especiales

---

### 7. ❌ Error: "password authentication failed for user postgres"

**Síntoma:**
```
error: password authentication failed for user "postgres"
code: '28P01'
```

**Causa:** Password incorrecta o mal formateada en DATABASE_URL

**Solución:** Verificar/cambiar password en Supabase y actualizar DATABASE_URL en Vercel

---

### 8. ❌ Error: 404 NOT_FOUND en rutas SPA (/login, /dashboard)

**Síntoma:** 
- `https://ppiv.vercel.app/` funciona
- `https://ppiv.vercel.app/login` → 404

**Causa:** Vercel busca archivo `/login` que no existe. React Router necesita que todas las rutas devuelvan `index.html`

**Solución:** Agregar rewrite en `vercel.json`:
```json
{
  "source": "/((?!api).*)",
  "destination": "/index.html"
}
```

---

## Resultado Final

### ✅ Estado del Deployment

**URL de Producción:** https://ppiv.vercel.app

**Versión:** v1.0.0 (tag en GitHub)

### ✅ Funcionalidades Verificadas

- ✅ Frontend React desplegado y accesible
- ✅ SPA routing funcionando (navegación directa a cualquier ruta)
- ✅ Backend API serverless operativo
- ✅ Base de datos Supabase conectada
- ✅ Autenticación JWT funcionando
- ✅ Login de usuarios exitoso
- ✅ CORS configurado correctamente
- ✅ Rate limiting activo
- ✅ Headers de seguridad (Helmet)
- ✅ Manejo de errores global
- ✅ Logging para debugging

### ✅ Métricas de Deployment

- **Build time:** ~6 segundos
- **Deployment time:** ~30-60 segundos
- **Funciones serverless:** 2 (index + test)
- **Tamaño del frontend:** ~500 KB (gzipped)

### ✅ Endpoints Disponibles

**Frontend:**
- `https://ppiv.vercel.app/` - Página principal
- `https://ppiv.vercel.app/login` - Login
- `https://ppiv.vercel.app/dashboard` - Dashboard (según rol)
- Todas las rutas del SPA funcionan

**Backend API:**
- `https://ppiv.vercel.app/api/salud` - Health check
- `https://ppiv.vercel.app/api/test` - Diagnóstico
- `https://ppiv.vercel.app/api/auth/login` - Login
- `https://ppiv.vercel.app/api/auth/perfil` - Perfil usuario
- `https://ppiv.vercel.app/api/clientes/*` - Endpoints clientes
- `https://ppiv.vercel.app/api/operarios/*` - Endpoints operarios
- `https://ppiv.vercel.app/api/administradores/*` - Endpoints admin
- Y todos los demás endpoints del backend

---

## 🔧 Comandos Útiles

### Deploy manual desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy a preview
vercel

# Deploy a production
vercel --prod
```

### Ver logs en tiempo real
```bash
vercel logs [deployment-url] --follow
```

### Listar deployments
```bash
vercel ls
```

### Revertir a deployment anterior
```bash
vercel rollback [deployment-url]
```

---

## 📚 Referencias

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Supabase Documentation](https://supabase.com/docs)
- [Express Trust Proxy](https://expressjs.com/en/guide/behind-proxies.html)
- [React Router](https://reactrouter.com/)

---

## 👥 Créditos

**Proyecto:** PPIV - Plataforma de Planificación de Inversiones de la Cooperativa Eléctrica Gobernador Ugarte

**Desarrollado por:** Damian Clausi

**Fecha de deployment v1.0.0:** 12 de Octubre, 2025

**Repositorio:** https://github.com/damianclausi2/proyecto-integrador-devops

---

## 📝 Notas Finales

Este deployment utiliza el plan **Hobby** (gratuito) de Vercel con las siguientes limitaciones:

- Máximo 12 funciones serverless (solucionado con consolidación)
- 100 GB de ancho de banda mensual
- Builds ilimitados
- Preview deployments automáticos

Para producción en gran escala, considera:
- Plan Pro de Vercel para más funciones y recursos
- Supabase Pro para mejor performance de base de datos
- CDN para assets estáticos pesados
- Monitoring con Sentry o similar

---

**¿Preguntas o problemas?** Revisa los logs en Vercel Dashboard → Deployments → [tu deployment] → Functions → Ver logs de ejecución.
