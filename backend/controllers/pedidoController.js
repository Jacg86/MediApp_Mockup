// ================================================================
//  Controlador: Pedidos
//  Crear pedidos desde el carrito y consultar historial
// ================================================================
const PedidoModel = require('../models/pedidoModel');
const CarritoModel = require('../models/carritoModel');

const PedidoController = {
    /**
     * POST /api/pedidos
     * Crear un nuevo pedido desde el carrito actual
     */
    async crear(req, res, next) {
        try {
            const { metodo_entrega, direccion_entrega, notas } = req.body;

            // Obtener carrito del usuario
            const carrito = await CarritoModel.getByUsuario(req.usuario.id_usuario);

            if (!carrito.items || carrito.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Tu carrito está vacío. Agrega productos antes de crear un pedido.',
                });
            }

            // Validar dirección para delivery
            if (metodo_entrega !== 'retiro_tienda' && !direccion_entrega) {
                return res.status(400).json({
                    success: false,
                    message: 'La dirección de entrega es obligatoria para envío a domicilio.',
                });
            }

            // Preparar items para el pedido
            const items = carrito.items.map(item => ({
                id_producto: item.id_producto,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precio_unitario),
                precio_original: parseFloat(item.precio_original),
            }));

            // Crear pedido
            const pedido = await PedidoModel.create({
                id_usuario: req.usuario.id_usuario,
                metodo_entrega: metodo_entrega || 'domicilio_express',
                direccion_entrega: direccion_entrega || null,
                notas: notas || null,
                items,
            });

            // Vaciar carrito después de crear el pedido
            await CarritoModel.clear(carrito.id_carrito);

            res.status(201).json({
                success: true,
                message: '¡Pedido creado exitosamente!',
                data: pedido,
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/pedidos
     * Listar pedidos del usuario autenticado
     */
    async listar(req, res, next) {
        try {
            const pedidos = await PedidoModel.getByUsuario(req.usuario.id_usuario);

            res.json({
                success: true,
                data: pedidos,
                total: pedidos.length,
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/pedidos/:id
     * Obtener detalle de un pedido
     */
    async detalle(req, res, next) {
        try {
            const pedido = await PedidoModel.findById(req.params.id);

            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado.',
                });
            }

            // Verificar que el pedido pertenece al usuario
            if (pedido.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este pedido.',
                });
            }

            res.json({
                success: true,
                data: pedido,
            });

        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/pedidos/tienda/ventas
     * Listar ventas (pedidos) de una tienda (simplificado para el mockup)
     */
    async listarPorTienda(req, res, next) {
        try {
            // Para el mockup, simulamos obtener todos los pedidos que tienen items de esta tienda.
            // Para no complicar la consulta SQL de "qué items pertenecen a qué tienda", 
            // y como es un demo, listaremos los que están 'pendiente_confirmacion_pago' en general.
            // En una app real cruzaríamos item_pedido con producto y tienda.
            
            const { query } = require('../config/db');
            
            // Obtener el ID de la tienda del usuario
            const tiendaRes = await query(`SELECT id_tienda FROM tiendas WHERE id_usuario = $1`, [req.usuario.id_usuario]);
            if (tiendaRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'No tienes una tienda registrada.' });
            }

            // Seleccionamos los pedidos pendientes de pago
            const result = await query(`
                SELECT p.id_pedido, p.estado, p.metodo_entrega, p.total, p.created_at, 
                       u.nombre as nombre_comprador, p.direccion_entrega
                FROM pedido p
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE p.estado = 'pendiente_confirmacion_pago'
                ORDER BY p.created_at DESC
            `);

            res.json({
                success: true,
                data: result.rows,
            });

        } catch (error) {
            next(error);
        }
    },
};

module.exports = PedidoController;
