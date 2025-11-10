# 🔄 Refactorización: Backend Unificado

## Cambios realizados

### ❌ Antes (Backend duplicado)
```
proyecto/
├── backend/          ← Código de desarrollo
│   ├── models/
│   ├── controllers/
│   └── routes/
└── api/              ← Copia para Vercel (DUPLICADO)
    └── _lib/
        ├── models/
        ├── controllers/
        └── routes/
```

**Problemas:**
- 🔴 Código duplicado
- 🔴 Sincronización manual necesaria
- 🔴 Propenso a desincronización
- 🔴 Confuso para nuevos desarrolladores

### ✅ Después (Backend unificado)
```
proyecto/
├── src/              ← Frontend (React + Vite)
│   └── components/
└── api/              ← Backend único (Express + PostgreSQL)
    ├── index.js      ← Servidor principal
    └── _lib/
        ├── models/       ← Model (MVC)
        ├── controllers/  ← Controller (MVC)
        ├── routes/       ← Router
        ├── middleware/
        └── utils/
```

**Ventajas:**
- ✅ Un solo código backend
- ✅ Funciona en local Y en Vercel
- ✅ Sin duplicación
- ✅ Más fácil de mantener

## 📁 Arquitectura MVC

La arquitectura **MVC (Model-View-Controller)** se mantiene intacta:

- **Model** (`api/_lib/models/`): Lógica de datos y DB
  - `Usuario.js`, `Reclamo.js`, `OrdenTrabajo.js`, etc.
  
- **View** (`src/components/`): Interfaz React
  - `DashboardCliente.jsx`, `Login.jsx`, etc.
  
- **Controller** (`api/_lib/controllers/`): Lógica de negocio
  - `AuthController.js`, `ClienteController.js`, etc.

- **Router** (`api/_lib/routes/`): Definición de endpoints
  - `auth.js`, `clientes.js`, `operarios.js`, etc.

## 🚀 Cómo ejecutar en local

### Opción 1: Script automático (Recomendado)
```bash
./start.sh
```

### Opción 2: Manual
```bash
# Terminal 1 - Backend
cd api
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

## 📝 Variables de entorno

### Desarrollo local (`.env` en raíz del proyecto)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cooperativa_ugarte_db
DB_USER=coop_user
DB_PASSWORD=cooperativa2024
JWT_SECRET=tu_secret_key
NODE_ENV=development
```

### Producción (Vercel)
Configurar en **Vercel Dashboard → Settings → Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret para tokens
- `NODE_ENV=production`

## 🌐 Deploy

### Vercel (Automático)
```bash
git push origin main
```

Vercel detecta automáticamente:
- **Frontend**: Vite build → `/dist`
- **Backend**: Serverless Functions → `/api`

### Configuración Vercel (`vercel.json`)
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

## 🔧 Estructura de archivos

```
proyecto/
├── api/                        ← Backend (Express)
│   ├── index.js                ← Entry point
│   ├── package.json            ← Dependencias backend
│   ├── test.js                 ← Health check endpoint
│   └── _lib/
│       ├── controllers/        ← Lógica de negocio
│       │   ├── AuthController.js
│       │   ├── ClienteController.js
│       │   ├── AdministradorController.js
│       │   └── OperarioController.js
│       ├── models/             ← Modelos de datos
│       │   ├── Usuario.js
│       │   ├── Reclamo.js
│       │   ├── OrdenTrabajo.js
│       │   ├── Material.js
│       │   └── Cuenta.js
│       ├── routes/             ← Definición de rutas
│       │   ├── auth.js
│       │   ├── clientes.js
│       │   ├── administradores.js
│       │   └── operarios.js
│       ├── middleware/         ← Middleware (auth, etc.)
│       │   └── auth.js
│       ├── utils/              ← Utilidades
│       │   ├── jwt.js
│       │   ├── crypto.js
│       │   └── respuestas.js
│       └── db.js               ← Conexión PostgreSQL
│
├── src/                        ← Frontend (React + Vite)
│   ├── components/
│   ├── services/
│   ├── contexts/
│   └── hooks/
│
├── public/                     ← Assets estáticos
├── dist/                       ← Build de producción (generado)
│
├── .env                        ← Variables de entorno local
├── vercel.json                 ← Config de Vercel
├── package.json                ← Dependencias frontend
├── vite.config.ts              ← Config de Vite
└── start.sh                    ← Script de inicio
```

## 🧪 Testing

```bash
# Backend tests
cd api
npm test

# Con coverage
npm run test:coverage
```

## 📚 Guías adicionales

- [Arquitectura del Sistema](../docs/ARQUITECTURA.md)
- [API Endpoints](../docs/API.md)
- [Guía de Desarrollo](../docs/DESARROLLO.md)

## ⚠️ Notas importantes

1. **Backup del backend antiguo**: Se guardó en `.backup/backend-YYYYMMDD/`
2. **Scripts actualizados**: `start.sh`, `stop.sh`, `status.sh` ahora usan `/api`
3. **Local y Vercel comparten el mismo código**: No hay más duplicación

## 🔄 Migración completada

- ✅ Eliminado `/backend` duplicado
- ✅ Unificado todo en `/api`
- ✅ Scripts actualizados
- ✅ Documentación actualizada
- ✅ Arquitectura MVC mantenida
- ✅ Compatible con Vercel Serverless Functions
