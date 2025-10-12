import express from 'express';
import PrioridadController from '../controllers/PrioridadController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/prioridades
 * @desc    Obtener todas las prioridades disponibles
 * @access  Privado (requiere autenticación)
 */
router.get('/', autenticar, PrioridadController.obtenerTodas);

/**
 * @route   GET /api/prioridades/:id
 * @desc    Obtener una prioridad por ID
 * @access  Privado (requiere autenticación)
 */
router.get('/:id', autenticar, PrioridadController.obtenerPorId);

/**
 * @route   GET /api/prioridades/nombre/:nombre
 * @desc    Obtener una prioridad por nombre (Alta, Media, Baja)
 * @access  Privado (requiere autenticación)
 */
router.get('/nombre/:nombre', autenticar, PrioridadController.obtenerPorNombre);

export default router;
