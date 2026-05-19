// ================================================================
//  Rutas: Pedidos
// ================================================================
const { Router } = require('express');
const PedidoController = require('../controllers/pedidoController');
const { verifyToken } = require('../middleware/authMiddleware');
const { pedidoRules, handleValidation } = require('../middleware/validators');

const router = Router();

// Todas las rutas de pedidos requieren autenticación
router.use(verifyToken);

// POST /api/pedidos — crear pedido desde el carrito
router.post('/', pedidoRules, handleValidation, PedidoController.crear);

// GET /api/pedidos — listar mis pedidos
router.get('/', PedidoController.listar);

// GET /api/pedidos/tienda/ventas - listar ventas de la tienda
router.get('/tienda/ventas', PedidoController.listarPorTienda);

// GET /api/pedidos/:id — detalle de un pedido
router.get('/:id', PedidoController.detalle);

module.exports = router;
