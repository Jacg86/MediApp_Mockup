// ================================================================
//  Controlador: Autenticación
//  Login, registro de personas y tiendas, obtener usuario actual
// ================================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UsuarioModel = require('../models/usuarioModel');
const TiendaModel = require('../models/tiendaModel');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const AuthController = {
    /**
     * POST /api/auth/login
     * Iniciar sesión con correo y contraseña
     */
    async login(req, res, next) {
        try {
            const { correo, contrasena } = req.body;

            // Buscar usuario por correo
            const usuario = await UsuarioModel.findByEmail(correo);
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos.',
                });
            }

            if (usuario.proveedor_login === 'google') {
                return res.status(400).json({
                    success: false,
                    message: 'Esta cuenta fue creada con Google. Usa "Continuar con Google".',
                });
            }

            // Verificar contraseña
            const passwordValid = await bcrypt.compare(contrasena, usuario.contrasena);
            if (!passwordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Correo o contraseña incorrectos.',
                });
            }

            // Generar JWT
            const payload = {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre: usuario.nombre,
                id_rol: usuario.id_rol,
                nombre_rol: usuario.nombre_rol,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            });

            res.json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                data: {
                    token,
                    usuario: {
                        id_usuario: usuario.id_usuario,
                        nombre: usuario.nombre,
                        correo: usuario.correo,
                        nombre_rol: usuario.nombre_rol,
                        ciudad: usuario.ciudad,
                    },
                },
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/registro
     * Registrar un nuevo usuario (persona o tienda)
     */
    async registro(req, res, next) {
        try {
            const { nombre, correo, contrasena, ciudad, telefono, tipo } = req.body;

            if (!contrasena) {
                return res.status(400).json({ success: false, message: 'La contraseña es obligatoria.' });
            }

            // Verificar que el correo no esté en uso
            const existente = await UsuarioModel.findByEmail(correo);
            if (existente) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe una cuenta con este correo electrónico.',
                });
            }

            // Hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasena, salt);

            // Determinar rol: 2 = Consumidor, 3 = Tienda
            const id_rol = tipo === 'tienda' ? 3 : 2;

            // Crear usuario
            const nuevoUsuario = await UsuarioModel.create({
                nombre,
                correo,
                contrasena: hashedPassword,
                id_rol,
                ciudad: ciudad || null,
                telefono: telefono || null,
            });

            // Si es tienda, crear registro de tienda
            let tienda = null;
            if (tipo === 'tienda') {
                const { tienda_nombre, nit, direccion, descripcion } = req.body;
                tienda = await TiendaModel.create(nuevoUsuario.id_usuario, {
                    nombre: tienda_nombre,
                    nit,
                    descripcion: descripcion || null,
                    direccion,
                    ciudad: ciudad || '',
                });
            }

            // Generar JWT
            const nombreRol = tipo === 'tienda' ? 'Tienda' : 'Consumidor';
            const payload = {
                id_usuario: nuevoUsuario.id_usuario,
                correo: nuevoUsuario.correo,
                nombre: nuevoUsuario.nombre,
                id_rol,
                nombre_rol: nombreRol,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            });

            res.status(201).json({
                success: true,
                message: 'Cuenta creada exitosamente.',
                data: {
                    token,
                    usuario: {
                        id_usuario: nuevoUsuario.id_usuario,
                        nombre: nuevoUsuario.nombre,
                        correo: nuevoUsuario.correo,
                        nombre_rol: nombreRol,
                    },
                    tienda: tienda || undefined,
                },
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/auth/me
     * Obtener datos del usuario autenticado
     */
    async me(req, res, next) {
        try {
            const usuario = await UsuarioModel.findById(req.usuario.id_usuario);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.',
                });
            }

            // Si es tienda, incluir datos de la tienda
            let tienda = null;
            if (usuario.nombre_rol === 'Tienda') {
                tienda = await TiendaModel.findByUsuario(usuario.id_usuario);
            }

            res.json({
                success: true,
                data: {
                    usuario,
                    tienda: tienda || undefined,
                },
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/auth/google
     * Login / Registro automático con Google
     */
    async googleAuth(req, res, next) {
        try {
            const { credential } = req.body;
            
            // Verificar token con Google
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payloadGoogle = ticket.getPayload();
            
            const { email, name, picture } = payloadGoogle;

            // Verificar si el correo ya existe
            let usuario = await UsuarioModel.findByEmail(email);

            if (!usuario) {
                // Registro automático como Consumidor
                usuario = await UsuarioModel.create({
                    nombre: name,
                    correo: email,
                    contrasena: null,
                    id_rol: 2, // 2 = Consumidor
                    ciudad: null,
                    telefono: null,
                    proveedor_login: 'google'
                });
                
                // Cargar datos de la BD para tener todos los campos (como nombre_rol)
                usuario = await UsuarioModel.findByEmail(email);
            } else if (usuario.proveedor_login !== 'google') {
                // Actualizar proveedor si era local pero ahora entra con Google
                // Dependiendo de las reglas, podrías bloquearlo o fusionar la cuenta.
                // Lo fusionaremos para mayor comodidad.
                await UsuarioModel.updateProvider(usuario.id_usuario, 'google');
                usuario.proveedor_login = 'google';
            }

            // Generar JWT
            const payload = {
                id_usuario: usuario.id_usuario,
                correo: usuario.correo,
                nombre: usuario.nombre,
                id_rol: usuario.id_rol,
                nombre_rol: usuario.nombre_rol,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            });

            res.json({
                success: true,
                message: 'Autenticado con Google exitosamente.',
                data: {
                    token,
                    usuario: {
                        id_usuario: usuario.id_usuario,
                        nombre: usuario.nombre,
                        correo: usuario.correo,
                        nombre_rol: usuario.nombre_rol,
                        ciudad: usuario.ciudad,
                    },
                },
            });

        } catch (error) {
            next(error);
        }
    },
};

module.exports = AuthController;
