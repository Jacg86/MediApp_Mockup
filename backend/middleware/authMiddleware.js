// ================================================================
//  Middleware: Autenticación JWT
//  Verifica tokens y controla acceso por roles
// ================================================================
const jwt = require('jsonwebtoken');

/**
 * Verificar que el request tiene un JWT válido
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. No se proporcionó un token de autenticación.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { id_usuario, correo, id_rol, nombre_rol }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.',
        });
    }
};

/**
 * Verificar que el usuario tiene un rol específico
 * @param  {...string} roles - Roles permitidos ('Usuario', 'Consumidor', 'Tienda')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado.',
            });
        }

        if (!roles.includes(req.usuario.nombre_rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`,
            });
        }

        next();
    };
};

module.exports = { verifyToken, requireRole };
