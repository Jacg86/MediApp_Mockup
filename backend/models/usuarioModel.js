// ================================================================
//  Modelo: Usuario
//  Consultas SQL para la tabla 'usuarios' y sus relaciones
// ================================================================
const { query } = require('../config/db');

const UsuarioModel = {
    /**
     * Buscar usuario por correo electrónico
     */
    async findByEmail(correo) {
        const result = await query(
            `SELECT u.*, r.nombre_rol 
             FROM usuarios u
             JOIN roles r ON r.id_rol = u.id_rol
             WHERE u.correo = $1 AND u.activo = TRUE`,
            [correo]
        );
        return result.rows[0] || null;
    },

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        const result = await query(
            `SELECT u.id_usuario, u.nombre, u.correo, u.ciudad, u.telefono, 
                    u.id_rol, r.nombre_rol, u.activo, u.created_at
             FROM usuarios u
             JOIN roles r ON r.id_rol = u.id_rol
             WHERE u.id_usuario = $1 AND u.activo = TRUE`,
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Crear un nuevo usuario
     */
    async create({ nombre, correo, contrasena, id_rol, ciudad, telefono, proveedor_login = 'local' }) {
        const result = await query(
            `INSERT INTO usuarios (nombre, correo, contrasena, id_rol, ciudad, telefono, proveedor_login)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id_usuario, nombre, correo, id_rol, ciudad, telefono, proveedor_login, created_at`,
            [nombre, correo, contrasena, id_rol, ciudad, telefono, proveedor_login]
        );
        return result.rows[0];
    },

    /**
     * Actualizar datos del perfil
     */
    async update(id, { nombre, ciudad, telefono }) {
        const result = await query(
            `UPDATE usuarios 
             SET nombre = COALESCE($2, nombre),
                 ciudad = COALESCE($3, ciudad),
                 telefono = COALESCE($4, telefono)
             WHERE id_usuario = $1 AND activo = TRUE
             RETURNING id_usuario, nombre, correo, ciudad, telefono`,
            [id, nombre, ciudad, telefono]
        );
        return result.rows[0] || null;
    },

    /**
     * Cambiar contraseña
     */
    async updatePassword(id, hashedPassword) {
        const result = await query(
            `UPDATE usuarios SET contrasena = $2 WHERE id_usuario = $1 AND activo = TRUE`,
            [id, hashedPassword]
        );
        return result.rowCount > 0;
    },

    /**
     * Actualizar proveedor de login
     */
    async updateProvider(id, proveedor) {
        const result = await query(
            `UPDATE usuarios SET proveedor_login = $2 WHERE id_usuario = $1`,
            [id, proveedor]
        );
        return result.rowCount > 0;
    },
};

module.exports = UsuarioModel;
