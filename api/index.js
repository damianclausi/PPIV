import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './_lib/db.js';

// Importar rutas
import rutasAuth from './_lib/routes/auth.js';
import rutasClientes from './_lib/routes/clientes.js';
import rutasOperarios from './_lib/routes/operarios.js';
import rutasAdministradores from './_lib/routes/administradores.js';
import rutasTiposReclamo from './_lib/routes/tiposReclamo.js';
import rutasDetallesTipoReclamo from './_lib/routes/detallesTipoReclamo.js';
import rutasPrioridades from './_lib/routes/prioridades.js';
import rutasOTTecnicas from './_lib/routes/otTecnicas.js';
import rutasCuadrillas from './_lib/routes/cuadrillas.js';
import rutasItinerario from './_lib/routes/itinerario.js';

// Cargar variables de entorno solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '../.env' });
}

const app = express();
const PUERTO = process.env.PORT || 3001;

// Seguridad: Helmet - Headers HTTP seguros
app.use(helmet());

// Seguridad: CORS configurado correctamente
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3002',
    'https://ppiv.vercel.app',
    /^https:\/\/ppiv-.*\.vercel\.app$/ // Todos los preview deployments de Vercel
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Seguridad: Rate limiting general
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por IP (aumentado para desarrollo)
  message: {
    exito: false,
    mensaje: 'Demasiadas peticiones desde esta IP, intente más tarde'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Seguridad: Rate limiting MUY permisivo para login (desarrollo/proyecto académico)
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 intentos de login (muy permisivo para desarrollo)
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

// Log de peticiones
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

// Aplicar rate limiting general a todas las rutas API
app.use('/api/', limiterGeneral);

// Aplicar rate limiting específico para login (antes de las rutas)
app.use('/api/auth/login', limiterLogin);

// Rutas
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

// Ruta raíz
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
      clientes: {
        perfil: 'GET /api/clientes/perfil',
        cuentas: 'GET /api/clientes/cuentas',
        dashboard: 'GET /api/clientes/dashboard',
        facturas: 'GET /api/clientes/facturas',
        reclamos: 'GET /api/clientes/reclamos',
        crearReclamo: 'POST /api/clientes/reclamos'
      },
      operarios: {
        perfil: 'GET /api/operarios/perfil',
        dashboard: 'GET /api/operarios/dashboard',
        reclamos: 'GET /api/operarios/reclamos',
        actualizarReclamo: 'PATCH /api/operarios/reclamos/:id/estado'
      },
      administradores: {
        perfil: 'GET /api/administradores/perfil',
        dashboard: 'GET /api/administradores/dashboard',
        socios: 'GET /api/administradores/socios',
        reclamos: 'GET /api/administradores/reclamos',
        empleados: 'GET /api/administradores/empleados',
        asignarReclamo: 'PATCH /api/administradores/reclamos/:id/asignar'
      }
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

// Iniciar servidor solo si no estamos en testing o producción (Vercel)
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
    console.log(`📊 Verificación de salud: http://localhost:${PUERTO}/api/salud`);
  });
}

// Exportar para Vercel serverless functions
// Vercel necesita un handler que procese req/res
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
