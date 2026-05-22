// ================================================================
//  Configuración de conexión a PostgreSQL
//  Usa un Pool de conexiones para mejor rendimiento
// ================================================================
const { Pool } = require('pg');

const poolConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,                    // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,   // Tiempo de inactividad antes de cerrar
    connectionTimeoutMillis: 2000,
};

// Render y otros servicios en la nube requieren SSL para conexiones externas
if (process.env.DB_HOST && process.env.DB_HOST.includes('render.com')) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Verificar conexión al iniciar
pool.on('connect', () => {
    console.log(' Conectado a PostgreSQL');
});

pool.on('error', (err) => {
    console.error(' Error inesperado en PostgreSQL:', err);
    process.exit(-1);
});

/**
 * Ejecutar una consulta SQL
 * @param {string} text - Consulta SQL con placeholders $1, $2, ...
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
