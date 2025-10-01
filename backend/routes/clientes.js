import express from 'express';
import ClienteController from '../controllers/ClienteController.js';
import { autenticar, esSocio } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y ser socio
router.use(autenticar);
router.use(esSocio);

// Rutas de cliente
router.get('/perfil', ClienteController.obtenerPerfil);
router.get('/cuentas', ClienteController.obtenerCuentas);
router.get('/dashboard', ClienteController.obtenerDashboard);

// Rutas de facturas
router.get('/facturas', ClienteController.obtenerFacturas);
router.get('/facturas/:id', ClienteController.obtenerFactura);

// Rutas de reclamos
router.get('/reclamos', ClienteController.obtenerReclamos);
router.get('/reclamos/:id', ClienteController.obtenerReclamo);
router.post('/reclamos', ClienteController.crearReclamo);

export default router;
