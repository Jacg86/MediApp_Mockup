// ================================================================
//  MediApp — Servidor Principal
//  Node.js + Express | Patrón MVC | PostgreSQL
// ================================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware Global ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Archivos estáticos del Frontend ──────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── Rutas de la API REST ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tiendas', tiendaRoutes);
app.use('/api/categorias', categoriaRoutes);

// ── Ruta de salud ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'MediApp API funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});

// ── SPA Fallback: servir index.html para rutas no-API ────────────
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'Ruta de API no encontrada.' });
    }
});

// ── Manejo global de errores ─────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔═══════════════════════════════════════╗');
    console.log('  ║          MediApp Server               ║');
    console.log(`  ║   http://localhost:${PORT}                 ║`);
    console.log('  ║   API: /api/...                       ║');
    console.log('  ╚═══════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
