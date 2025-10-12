import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/perfil', autenticar, AuthController.obtenerPerfil);
router.post('/verificar', autenticar, AuthController.verificarToken);

export default router;
