import express from 'express';
import TipoReclamoController from '../controllers/TipoReclamoController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/tipos-reclamo
 * @desc    Obtener todos los tipos de reclamo disponibles
 * @access  Privado (requiere autenticación)
 */
router.get('/', autenticar, TipoReclamoController.obtenerTodos);

/**
 * @route   GET /api/tipos-reclamo/:id
 * @desc    Obtener un tipo de reclamo por ID
 * @access  Privado (requiere autenticación)
 */
router.get('/:id', autenticar, TipoReclamoController.obtenerPorId);

export default router;
