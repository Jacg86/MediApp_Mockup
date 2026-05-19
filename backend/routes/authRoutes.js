// ================================================================
//  Rutas: Autenticación
// ================================================================
const { Router } = require('express');
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { loginRules, registroPersonaRules, handleValidation } = require('../middleware/validators');

const router = Router();

// POST /api/auth/login
router.post('/login', loginRules, handleValidation, AuthController.login);

// POST /api/auth/google
router.post('/google', AuthController.googleAuth);

// POST /api/auth/registro
router.post('/registro', AuthController.registro);

// GET /api/auth/me  (requiere token)
router.get('/me', verifyToken, AuthController.me);

module.exports = router;
