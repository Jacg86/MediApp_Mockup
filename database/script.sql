-- ================================================================
--  MediApp — Base de Datos
--  Asignatura : Programacion Web — Patrón MVC
--  Motor: PostgreSQL 14+
-- ================================================================

-- ── Crear y conectar la base de datos ──────────────────────────
-- NOTA: Ejecutar estas líneas desde psql o pgAdmin manualmente:
--   DROP DATABASE IF EXISTS mediapp;
--   CREATE DATABASE mediapp ENCODING = 'UTF8';
-- Luego conectarse a la base de datos mediapp y ejecutar el resto.

-- ── Tipos enumerados ────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_pedido') THEN
        CREATE TYPE estado_pedido AS ENUM (
            'pendiente',
            'confirmado',
            'en_camino',
            'entregado',
            'cancelado',
            'pendiente_confirmacion_pago',
            'pagado'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_entrega') THEN
        CREATE TYPE metodo_entrega AS ENUM (
            'domicilio_express',
            'programado',
            'retiro_tienda'
        );
    END IF;
END $$;

-- ================================================================
--  1. ROLES
-- ================================================================
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre_rol)
);
COMMENT ON TABLE roles IS 'Roles del sistema para control de acceso (RBAC)';

-- ================================================================
--  2. USUARIOS
-- ================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    contrasena VARCHAR(255),
    proveedor_login VARCHAR(20) DEFAULT 'local',
    id_rol INT NOT NULL,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
);
COMMENT ON TABLE usuarios IS 'Usuarios del sistema — general, consumidor y tienda';
COMMENT ON COLUMN usuarios.contrasena IS 'Hash bcrypt — nunca texto plano';

-- ================================================================
--  3. TIENDA
-- ================================================================
CREATE TABLE IF NOT EXISTS tienda (
    id_tienda SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(30) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    verificada BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tienda_usuario UNIQUE (id_usuario),
    CONSTRAINT uq_tienda_nit UNIQUE (nit),
    CONSTRAINT fk_tienda_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);
COMMENT ON TABLE tienda IS 'Perfil público de cada negocio registrado en MediApp';

-- ================================================================
--  4. CATEGORIA
-- ================================================================
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
);
COMMENT ON TABLE categoria IS 'Categorías de productos: Medicamentos, Vitaminas, Cremas, etc.';

-- ================================================================
--  5. PRODUCTO
-- ================================================================
CREATE TABLE IF NOT EXISTS producto (
    id_producto SERIAL PRIMARY KEY,
    id_tienda INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_original NUMERIC(12, 2) NOT NULL,
    precio_oferta NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    fecha_vencimiento DATE NOT NULL,
    imagen_url VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_producto_tienda FOREIGN KEY (id_tienda) REFERENCES tienda(id_tienda) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_producto_cat FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_precio_oferta CHECK (
        precio_oferta >= 0
        AND precio_oferta <= precio_original
    ),
    CONSTRAINT ck_stock CHECK (stock >= 0)
);
COMMENT ON TABLE producto IS 'Inventario de productos registrados por cada tienda';

-- ================================================================
--  6. PUBLICACION
-- ================================================================
CREATE TABLE IF NOT EXISTS publicacion (
    id_publicacion SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    titulo VARCHAR(250) NOT NULL,
    descripcion_extra TEXT,
    destacada BOOLEAN NOT NULL DEFAULT FALSE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    publicado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pub_producto UNIQUE (id_producto),
    CONSTRAINT fk_pub_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================================================
--  7. CARRITO
-- ================================================================
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_carrito_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================================================
--  8. ITEM_CARRITO
-- ================================================================
CREATE TABLE IF NOT EXISTS item_carrito (
    id_item SERIAL PRIMARY KEY,
    id_carrito INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    agregado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_carrito_prod UNIQUE (id_carrito, id_producto),
    CONSTRAINT fk_item_carrito FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_carrito_prod FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_item_cantidad CHECK (cantidad > 0)
);

-- ================================================================
--  9. PEDIDO
-- ================================================================
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    estado estado_pedido NOT NULL DEFAULT 'pendiente',
    metodo_entrega metodo_entrega NOT NULL DEFAULT 'domicilio_express',
    subtotal NUMERIC(12, 2) NOT NULL,
    costo_domicilio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    ahorro_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    direccion_entrega VARCHAR(350),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ================================================================
--  10. PAGOS
-- ================================================================
CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    estado_pago VARCHAR(50) NOT NULL,
    referencia_transaccion VARCHAR(255),
    monto NUMERIC(12,2) NOT NULL,
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pagos_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================================================
--  11. ITEM_PEDIDO
-- ================================================================
CREATE TABLE IF NOT EXISTS item_pedido (
    id_item SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    nombre_producto VARCHAR(200) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    precio_original_ref NUMERIC(12, 2) NOT NULL,
    subtotal_linea NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_item_pedido_prod FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_item_ped_cantidad CHECK (cantidad > 0)
);

-- ================================================================
--  FUNCIÓN Y TRIGGER: actualizar updated_at automáticamente
-- ================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (usar DROP IF EXISTS para re-ejecución segura)
DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_producto_updated_at ON producto;
CREATE TRIGGER trg_producto_updated_at BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_publicacion_updated_at ON publicacion;
CREATE TRIGGER trg_publicacion_updated_at BEFORE UPDATE ON publicacion FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_carrito_updated_at ON carrito;
CREATE TRIGGER trg_carrito_updated_at BEFORE UPDATE ON carrito FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_pedido_updated_at ON pedido;
CREATE TRIGGER trg_pedido_updated_at BEFORE UPDATE ON pedido FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ================================================================
--  ÍNDICES DE RENDIMIENTO
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_producto_vence ON producto(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON producto(activo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_pub_activa ON publicacion(activa) WHERE activa = TRUE;
CREATE INDEX IF NOT EXISTS idx_pub_destacada ON publicacion(destacada) WHERE destacada = TRUE;
CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado);
CREATE INDEX IF NOT EXISTS idx_tienda_ciudad ON tienda(ciudad);

-- ================================================================
--  VISTA: catalogo_activo
-- ================================================================
CREATE OR REPLACE VIEW catalogo_activo AS
SELECT p.id_producto,
    pub.id_publicacion,
    p.nombre AS nombre_producto,
    c.nombre AS categoria,
    t.nombre AS tienda,
    t.ciudad,
    p.precio_original,
    p.precio_oferta,
    ROUND(
        (
            1 - p.precio_oferta / NULLIF(p.precio_original, 0)
        ) * 100,
        0
    ) AS descuento_pct,
    p.stock,
    p.fecha_vencimiento,
    (p.fecha_vencimiento - CURRENT_DATE) AS dias_para_vencer,
    pub.destacada
FROM publicacion pub
    JOIN producto p ON p.id_producto = pub.id_producto
    JOIN tienda t ON t.id_tienda = p.id_tienda
    JOIN categoria c ON c.id_categoria = p.id_categoria
WHERE pub.activa = TRUE
    AND p.activo = TRUE
    AND p.stock > 0
    AND p.fecha_vencimiento >= CURRENT_DATE
ORDER BY dias_para_vencer ASC;

-- ================================================================
--  DATOS DE PRUEBA
-- ================================================================
-- Los datos de prueba se insertan con el script de Node.js que
-- genera hashes bcrypt reales para las contraseñas.
--
-- Después de ejecutar este script SQL, ejecutar:
--   cd backend
--   npm install
--   npm run seed
--
-- Esto insertará roles, usuarios, tiendas, categorías, productos
-- y datos de ejemplo con contraseñas válidas.
--
-- Usuario de prueba: ana@correo.com / mediapp123
-- ================================================================
--  FIN DEL SCRIPT
-- ================================================================
