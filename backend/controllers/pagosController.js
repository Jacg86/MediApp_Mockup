// ================================================================
//  Controlador: Pagos
// ================================================================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');
const PedidoModel = require('../models/pedidoModel');

const PagosController = {
    /**
     * POST /api/pagos/crear-intencion
     * Crea un PaymentIntent para Stripe
     */
    async crearIntencion(req, res, next) {
        try {
            const { id_pedido } = req.body;
            
            // Obtener el pedido
            const pedido = await PedidoModel.findById(id_pedido);
            if (!pedido) {
                return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
            }

            if (pedido.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({ success: false, message: 'No tienes acceso a este pedido' });
            }

            // Stripe requiere el monto en centavos (ej. 10000 COP = 1000000 centavos)
            const montoCentavos = Math.round(parseFloat(pedido.total) * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: montoCentavos,
                currency: 'cop',
                metadata: { id_pedido: pedido.id_pedido.toString() },
            });

            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/pagos/confirmar-tarjeta
     * Actualizar pedido a 'pagado' tras el éxito de Stripe
     */
    async confirmarTarjeta(req, res, next) {
        try {
            const { id_pedido, paymentIntentId } = req.body;
            
            const pedido = await PedidoModel.findById(id_pedido);
            if (!pedido || pedido.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({ success: false, message: 'Pedido no válido' });
            }

            // Guardar el registro del pago
            await query(
                `INSERT INTO pagos (id_pedido, metodo_pago, estado_pago, referencia_transaccion, monto)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id_pedido, 'tarjeta', 'exitoso', paymentIntentId, pedido.total]
            );

            // Actualizar estado del pedido a 'pagado'
            await query(`UPDATE pedido SET estado = 'pagado' WHERE id_pedido = $1`, [id_pedido]);

            res.json({ success: true, message: 'Pago con tarjeta confirmado.' });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/pagos/confirmar-efectivo
     * Pasar el pedido a 'pendiente_confirmacion_pago'
     */
    async confirmarEfectivo(req, res, next) {
        try {
            const { id_pedido } = req.body;
            
            const pedido = await PedidoModel.findById(id_pedido);
            if (!pedido || pedido.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({ success: false, message: 'Pedido no válido' });
            }

            // Guardar registro de pago pendiente
            await query(
                `INSERT INTO pagos (id_pedido, metodo_pago, estado_pago, monto)
                 VALUES ($1, $2, $3, $4)`,
                [id_pedido, 'efectivo', 'pendiente', pedido.total]
            );

            // Actualizar estado del pedido a 'pendiente_confirmacion_pago'
            await query(`UPDATE pedido SET estado = 'pendiente_confirmacion_pago' WHERE id_pedido = $1`, [id_pedido]);

            res.json({ success: true, message: 'Pago en efectivo registrado. Esperando confirmación.' });
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * PUT /api/pagos/:id_pedido/aprobar-efectivo
     * La Tienda confirma que recibió el efectivo
     */
    async aprobarEfectivoTienda(req, res, next) {
        try {
            const { id_pedido } = req.params;
            
            // En un caso real más complejo verificaríamos que la tienda sea la dueña de los productos de este pedido.
            // Por simplicidad para este mockup:
            await query(`UPDATE pedido SET estado = 'pagado' WHERE id_pedido = $1`, [id_pedido]);
            await query(`UPDATE pagos SET estado_pago = 'exitoso' WHERE id_pedido = $1 AND metodo_pago = 'efectivo'`, [id_pedido]);

            res.json({ success: true, message: 'Pago en efectivo confirmado por la tienda.' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = PagosController;
