ALTER TABLE usuarios ALTER COLUMN contrasena DROP NOT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS proveedor_login VARCHAR(20) DEFAULT 'local';

ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'pendiente_confirmacion_pago';
ALTER TYPE estado_pedido ADD VALUE IF NOT EXISTS 'pagado';

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
