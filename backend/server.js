import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './db.js';

// Importar rutas
import rutasAuth from './routes/auth.js';
import rutasClientes from './routes/clientes.js';
import rutasOperarios from './routes/operarios.js';
import rutasAdministradores from './routes/administradores.js';
import rutasTiposReclamo from './routes/tiposReclamo.js';
import rutasDetallesTipoReclamo from './routes/detallesTipoReclamo.js';
import rutasPrioridades from './routes/prioridades.js';

dotenv.config();

const app = express();
const PUERTO = process.env.PORT || 3001;

// Seguridad: Helmet - Headers HTTP seguros
app.use(helmet());

// Seguridad: CORS configurado correctamente
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Seguridad: Rate limiting general
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    exito: false,
    mensaje: 'Demasiadas peticiones desde esta IP, intente más tarde'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Seguridad: Rate limiting estricto para login
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
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
  console.log(`${req.method} ${req.path}`);
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
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error del servidor',
    mensaje: err.message
  });
});

// Iniciar servidor solo si no estamos en testing
if (process.env.NODE_ENV !== 'test') {
  app.listen(PUERTO, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
    console.log(`📊 Verificación de salud: http://localhost:${PUERTO}/api/salud`);
  });
}

export default app;
