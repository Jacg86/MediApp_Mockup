const { Router } = require('express');
const PagosController = require('../controllers/pagosController');
const PdfController = require('../controllers/pdfController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = Router();

router.post('/crear-intencion', verifyToken, PagosController.crearIntencion);
router.post('/confirmar-tarjeta', verifyToken, PagosController.confirmarTarjeta);
router.post('/confirmar-efectivo', verifyToken, PagosController.confirmarEfectivo);

// Descargar comprobante PDF
router.get('/comprobante/:id_pedido', verifyToken, PdfController.descargarComprobante);

// La Tienda (rol 3) aprueba el pago en efectivo
router.put('/:id_pedido/aprobar-efectivo', verifyToken, requireRole(3), PagosController.aprobarEfectivoTienda);

module.exports = router;
