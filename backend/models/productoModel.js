// ================================================================
//  Modelo: Producto
//  Consultas SQL para productos y el catálogo activo
// ================================================================
const { query } = require('../config/db');

const ProductoModel = {
    /**
     * Obtener catálogo activo con filtros opcionales
     * Usa la vista 'catalogo_activo' definida en el script SQL
     */
    async getCatalogo({ categoria, ciudad, precioMin, precioMax, diasMax, limit = 20, offset = 0 }) {
        let sql = `SELECT * FROM catalogo_activo WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        if (categoria) {
            sql += ` AND categoria = $${paramIndex++}`;
            params.push(categoria);
        }
        if (ciudad) {
            sql += ` AND ciudad = $${paramIndex++}`;
            params.push(ciudad);
        }
        if (precioMin !== undefined) {
            sql += ` AND precio_oferta >= $${paramIndex++}`;
            params.push(precioMin);
        }
        if (precioMax !== undefined) {
            sql += ` AND precio_oferta <= $${paramIndex++}`;
            params.push(precioMax);
        }
        if (diasMax !== undefined) {
            sql += ` AND dias_para_vencer <= $${paramIndex++}`;
            params.push(diasMax);
        }

        sql += ` ORDER BY dias_para_vencer ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    },

    /**
     * Buscar producto por ID con todos sus datos relacionados
     */
    async findById(id) {
        const result = await query(
            `SELECT p.*, 
                    c.nombre AS categoria,
                    t.nombre AS tienda_nombre,
                    t.ciudad AS tienda_ciudad,
                    t.direccion AS tienda_direccion,
                    pub.titulo AS publicacion_titulo,
                    pub.descripcion_extra,
                    pub.destacada,
                    pub.activa AS publicacion_activa,
                    (p.fecha_vencimiento - CURRENT_DATE) AS dias_para_vencer,
                    ROUND((1 - p.precio_oferta / NULLIF(p.precio_original, 0)) * 100, 0) AS descuento_pct
             FROM producto p
             JOIN categoria c ON c.id_categoria = p.id_categoria
             JOIN tienda t ON t.id_tienda = p.id_tienda
             LEFT JOIN publicacion pub ON pub.id_producto = p.id_producto
             WHERE p.id_producto = $1 AND p.activo = TRUE`,
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Crear un nuevo producto
     */
    async create({ id_tienda, id_categoria, nombre, descripcion, precio_original, precio_oferta, stock, fecha_vencimiento, imagen_url }) {
        const result = await query(
            `INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion, precio_original, precio_oferta, stock, fecha_vencimiento, imagen_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [id_tienda, id_categoria, nombre, descripcion, precio_original, precio_oferta, stock, fecha_vencimiento, imagen_url]
        );
        return result.rows[0];
    },

    /**
     * Crear publicación para un producto
     */
    async createPublicacion(id_producto, titulo, descripcion_extra = null, destacada = false) {
        const result = await query(
            `INSERT INTO publicacion (id_producto, titulo, descripcion_extra, destacada)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id_producto, titulo, descripcion_extra, destacada]
        );
        return result.rows[0];
    },

    /**
     * Actualizar producto
     */
    async update(id, { nombre, descripcion, precio_original, precio_oferta, stock, fecha_vencimiento, imagen_url }) {
        const result = await query(
            `UPDATE producto SET
                nombre = COALESCE($2, nombre),
                descripcion = COALESCE($3, descripcion),
                precio_original = COALESCE($4, precio_original),
                precio_oferta = COALESCE($5, precio_oferta),
                stock = COALESCE($6, stock),
                fecha_vencimiento = COALESCE($7, fecha_vencimiento),
                imagen_url = COALESCE($8, imagen_url)
             WHERE id_producto = $1 AND activo = TRUE
             RETURNING *`,
            [id, nombre, descripcion, precio_original, precio_oferta, stock, fecha_vencimiento, imagen_url]
        );
        return result.rows[0] || null;
    },

    /**
     * Eliminar producto de la base de datos
     */
    async delete(id) {
        const result = await query(
            `DELETE FROM producto WHERE id_producto = $1 RETURNING id_producto`,
            [id]
        );
        return result.rowCount > 0;
    },

    /**
     * Obtener productos de una tienda específica
     */
    async getByTienda(idTienda) {
        const result = await query(
            `SELECT p.*, c.nombre AS categoria,
                    pub.activa AS publicado,
                    (p.fecha_vencimiento - CURRENT_DATE) AS dias_para_vencer
             FROM producto p
             JOIN categoria c ON c.id_categoria = p.id_categoria
             LEFT JOIN publicacion pub ON pub.id_producto = p.id_producto
             WHERE p.id_tienda = $1 AND p.activo = TRUE
             ORDER BY p.fecha_vencimiento ASC`,
            [idTienda]
        );
        return result.rows;
    },

    /**
     * Buscar productos por texto
     */
    async search(texto, limit = 20) {
        const result = await query(
            `SELECT * FROM catalogo_activo
             WHERE LOWER(nombre_producto) LIKE LOWER($1)
                OR LOWER(tienda) LIKE LOWER($1)
                OR LOWER(categoria) LIKE LOWER($1)
             ORDER BY dias_para_vencer ASC
             LIMIT $2`,
            [`%${texto}%`, limit]
        );
        return result.rows;
    },
};

module.exports = ProductoModel;
