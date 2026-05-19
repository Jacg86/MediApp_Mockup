// ================================================================
//  Controlador: PDF (Generación de Comprobantes)
// ================================================================
const PDFDocument = require('pdfkit');
const PedidoModel = require('../models/pedidoModel');
const { query } = require('../config/db');

const PdfController = {
    /**
     * GET /api/pagos/comprobante/:id_pedido
     * Genera y descarga el PDF del comprobante
     */
    async descargarComprobante(req, res, next) {
        try {
            const { id_pedido } = req.params;

            // Obtener el pedido y sus items
            const pedido = await PedidoModel.findById(id_pedido);
            if (!pedido || pedido.id_usuario !== req.usuario.id_usuario) {
                return res.status(403).json({ success: false, message: 'No autorizado o pedido no encontrado.' });
            }

            if (pedido.estado !== 'pagado') {
                return res.status(400).json({ success: false, message: 'El pedido aún no ha sido pagado completamente.' });
            }

            // Obtener el pago asociado
            const pagoResult = await query(
                `SELECT * FROM pagos WHERE id_pedido = $1 AND estado_pago = 'exitoso' LIMIT 1`,
                [id_pedido]
            );
            const pago = pagoResult.rows[0];

            if (!pago) {
                return res.status(404).json({ success: false, message: 'No se encontró un pago exitoso para este pedido.' });
            }

            // Crear documento PDF
            const doc = new PDFDocument({ margin: 50 });

            // Configurar Headers para la descarga
            res.setHeader('Content-disposition', `attachment; filename=comprobante_mediapp_${id_pedido}.pdf`);
            res.setHeader('Content-type', 'application/pdf');

            // Conectar el PDF a la respuesta HTTP
            doc.pipe(res);

            // Cabecera del PDF
            doc.fontSize(20).text('MediApp', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text('Comprobante de Pago', { align: 'center' });
            doc.moveDown(2);

            // Información de la transacción
            doc.fontSize(12).text(`Pedido #: ${pedido.id_pedido}`);
            doc.text(`Fecha del Pago: ${new Date(pago.fecha_pago).toLocaleString('es-CO')}`);
            doc.text(`Método de Pago: ${pago.metodo_pago.toUpperCase()}`);
            if (pago.referencia_transaccion) {
                doc.text(`Referencia de Transacción: ${pago.referencia_transaccion}`);
            }
            doc.moveDown();

            // Detalles del cliente
            doc.text(`Cliente: ${req.usuario.nombre}`);
            doc.text(`Dirección de entrega: ${pedido.direccion_entrega}`);
            doc.moveDown();

            // Productos
            doc.text('Detalles del Pedido:');
            doc.moveDown(0.5);
            
            const formatMoney = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

            pedido.items.forEach(item => {
                doc.text(`- ${item.nombre_producto} (x${item.cantidad})  .....  ${formatMoney(item.precio_unitario * item.cantidad)}`);
            });

            doc.moveDown(2);
            doc.fontSize(14).text(`Total Pagado: ${formatMoney(pago.monto)}`, { align: 'right' });

            doc.moveDown(3);
            doc.fontSize(10).text('Gracias por comprar en MediApp. ¡Juntos reducimos el desperdicio médico!', { align: 'center', color: 'grey' });

            // Finalizar PDF (esto cierra el stream y envía el archivo al cliente)
            doc.end();

        } catch (error) {
            next(error);
        }
    }
};

module.exports = PdfController;
