# MediApp — Aplicación Web Full-Stack

Plataforma web para la venta de productos farmacéuticos cercanos a su fecha de vencimiento a precios reducidos. Construida con el patrón **MVC** usando **Node.js**, **Express**, **PostgreSQL** y **HTML/CSS/JS Vanilla**.

---

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API REST](#api-rest)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Funcionalidades](#funcionalidades)

---

## Arquitectura

```
┌──────────────┐     HTTP/JSON     ┌──────────────────┐     SQL     ┌──────────────┐
│   Frontend   │ ◄──────────────►  │  Backend (API)   │ ◄────────►  │  PostgreSQL  │
│  HTML/CSS/JS │                   │  Express + MVC   │             │   mediapp    │
└──────────────┘                   └──────────────────┘             └──────────────┘
```

- **Frontend**: HTML5, CSS3, JavaScript Vanilla, Stripe Elements — consume la API REST
- **Backend**: Node.js + Express + Google Auth Library + Stripe SDK + PDFKit — patrón MVC (Models, Controllers, Routes)
- **Base de datos**: PostgreSQL 14+ — 10 tablas, vistas, triggers, índices
- **Autenticación**: JWT (JSON Web Tokens)

---

## Requisitos Previos

1. **Node.js** v18+ — [Descargar](https://nodejs.org/)
2. **PostgreSQL** v14+ — [Descargar](https://www.postgresql.org/download/)
3. **npm** (incluido con Node.js)

---

## Instalación y Ejecución

### 1. Clonar o descargar el proyecto

```bash
cd MediApp
```

### 2. Crear la base de datos en PostgreSQL

Abrir **pgAdmin** o **psql** y ejecutar:

```sql
CREATE DATABASE mediapp;
```

Luego conectarse a la base de datos `mediapp` y ejecutar el contenido del archivo:

```
database/script.sql
```

Esto creará todas las tablas, tipos ENUM, vistas, triggers e índices (sin datos aún).

### 3. Configurar variables de entorno

Editar el archivo `backend/.env` con tus credenciales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=mediapp

# ── Google OAuth ──
GOOGLE_CLIENT_ID=Tu_ID

# ── Pasarela de Pagos (Stripe) ──
STRIPE_PUBLISHABLE_KEY=pk
STRIPE_SECRET_KEY=sk

```

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 5. Poblar la base de datos con datos de prueba

```bash
npm run seed
```

Esto inserta roles, usuarios (con contraseñas bcrypt válidas), tiendas, categorías, productos y datos de ejemplo.

### 6. Iniciar el servidor

```bash
npm run dev
npx -y http-server ./frontend -p 8080 -c-1
```

### 7. Abrir la aplicación

Navegar a: **http://localhost:3000**

> **Usuario de prueba:** `ana@correo.com` / `mediapp123`

---

## Estructura del Proyecto

```
MediApp/
├── backend/
│   ├── config/
│   │   └── db.js                 # Pool de conexiones PostgreSQL
│   ├── controllers/
│   │   ├── authController.js     # Login y registro (Google Auth)
│   │   ├── productoController.js # CRUD productos
│   │   ├── carritoController.js  # Gestión del carrito
│   │   ├── pedidoController.js   # Gestión de pedidos
│   │   ├── pagosController.js    # Pagos (Stripe y Efectivo)
│   │   ├── pdfController.js      # Generación de comprobantes
│   │   ├── usuarioController.js  # Perfil de usuario
│   │   ├── tiendaController.js   # Perfil de tienda
│   │   └── categoriaController.js # Listado de categorías
│   ├── models/
│   │   ├── usuarioModel.js       # Queries de usuarios
│   │   ├── productoModel.js      # Queries de productos
│   │   ├── carritoModel.js       # Queries del carrito
│   │   ├── pedidoModel.js        # Queries de pedidos
│   │   ├── tiendaModel.js        # Queries de tiendas
│   │   └── categoriaModel.js     # Queries de categorías
│   ├── routes/                   # Definición de rutas HTTP
│   │   ├── authRoutes.js         # Rutas de autenticación
│   │   ├── pagosRoutes.js        # Rutas de pagos y facturas
│   │   └── ...                   # Otras rutas
│   ├── middleware/
│   │   ├── authMiddleware.js     # Verificación JWT
│   │   ├── errorHandler.js       # Manejo global de errores
│   │   └── validators.js         # Validaciones con express-validator
│   ├── .env                      # Variables de entorno
│   ├── package.json
│   └── server.js                 # Punto de entrada
├── frontend/
│   ├── css/styles.css            # Estilos completos
│   ├── js/
│   │   ├── api.js                # Cliente HTTP con JWT
│   │   ├── utils.js              # Funciones de utilidad
│   │   ├── auth.js               # Lógica de login
│   │   ├── registro.js           # Lógica de registro
│   │   ├── home.js               # Catálogo dinámico
│   │   ├── producto.js           # Detalle de producto
│   │   ├── carrito.js            # Gestión del carrito
│   │   ├── pedido.js             # Crear/ver pedidos
│   │   ├── perfil.js             # Perfil de usuario
│   │   └── perfilTienda.js       # Perfil de tienda
│   ├── img/                      # Imágenes de productos
│   └── *.html                    # Páginas HTML
├── database/
│   └── script.sql                # Script completo de la BD
├── .gitignore                    # Archivos ignorados por Git
└── README.md
```

---

## API REST

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/auth/registro` | Registrar usuario/tienda | ❌ |
| GET | `/api/auth/me` | Usuario actual | ✅ |
| GET | `/api/productos` | Catálogo (con filtros) | ❌ |
| GET | `/api/productos/:id` | Detalle de producto | ❌ |
| POST | `/api/productos` | Crear producto | ✅ Tienda |
| PUT | `/api/productos/:id` | Actualizar producto | ✅ Tienda |
| DELETE | `/api/productos/:id` | Eliminar producto | ✅ Tienda |
| GET | `/api/carrito` | Mi carrito | ✅ |
| POST | `/api/carrito/items` | Agregar al carrito | ✅ |
| PUT | `/api/carrito/items/:id` | Actualizar cantidad | ✅ |
| DELETE | `/api/carrito/items/:id` | Quitar del carrito | ✅ |
| POST | `/api/pedidos` | Crear pedido | ✅ |
| GET | `/api/pedidos` | Mis pedidos | ✅ |
| GET | `/api/usuarios/perfil` | Mi perfil | ✅ |
| PUT | `/api/usuarios/perfil` | Actualizar perfil | ✅ |
| PUT | `/api/usuarios/password` | Cambiar contraseña | ✅ |
| GET | `/api/categorias` | Listar categorías | ❌ |
| POST | `/api/auth/google` | Login/Registro con Google | ❌ |
| POST | `/api/pagos/crear-intencion` | Crear PaymentIntent de Stripe | ✅ |
| POST | `/api/pagos/confirmar-tarjeta` | Confirmar pago con Stripe | ✅ |
| POST | `/api/pagos/confirmar-efectivo` | Confirmar pedido en efectivo | ✅ |
| GET | `/api/pagos/comprobante/:id` | Descargar PDF del comprobante | ✅ |
| PUT | `/api/pagos/:id/aprobar-efectivo` | Aprobar efectivo (Tienda) | ✅ Tienda |
| GET | `/api/pedidos/tienda/ventas` | Ver ventas pendientes | ✅ Tienda |

---

## Usuarios de Prueba

Todos usan la contraseña: **`mediapp123`**

| Correo | Rol | Descripción |
|--------|-----|-------------|
| `admin@mediapp.co` | Admin | Administrador general (Aprobaciones/Stats) |
| `ana@correo.com` | Consumidor | Usuario consumidor de ejemplo |
| `carlos@correo.com` | Consumidor | Otro consumidor |
| `saludtotal@tienda.com` | Tienda | Droguería Salud Total |
| `farmcentral@tienda.com` | Tienda | Farmacia Central |

---

## Funcionalidades

### Para Consumidores
- Registro e inicio de sesión
- Explorar catálogo con filtros (categoría, ciudad, búsqueda)
- Ver detalle de productos
- Agregar/quitar productos del carrito
- Crear pedidos con dirección de entrega y selección de método de pago (Tarjeta o Efectivo)
- Pago seguro en línea con **Stripe Elements**
- Ver historial de pedidos y descargar **Comprobantes en PDF**
- Editar perfil y cambiar contraseña

### Para Tiendas
- Registro como tienda (con NIT)
- Gestionar perfil del negocio
- Crear, editar y eliminar publicaciones de productos (CRUD)
- **Ventas**: Aprobar o rechazar ventas con pago contra entrega en efectivo.
- **Seguridad**: Bloqueo estricto para no permitir publicar medicamentos con vencimiento menor a 20 días
- Subir **imágenes reales** para los productos
- Cambiar contraseña

### Para Administradores
- Acceso exclusivo al Panel de Control (`admin.html`)
- Ver estadísticas globales (usuarios y tiendas registradas)
- Verificar nuevas tiendas pendientes

### Técnicas
- Validaciones frontend y backend
- Subida de archivos e imágenes con **Multer** (multipart/form-data)
- NavBars e interfaces dinámicas basadas en Roles (Admin, Tienda, Consumidor)
- Manejo de errores con respuestas JSON
- JWT para autenticación stateless
- Transacciones SQL para consistencia
- Triggers para actualizar timestamps
- Vista SQL para el catálogo activo
- Diseño UI moderno (Botones de Acción Flotantes (FAB), Cards estructuradas y animaciones)
- Diseño responsive

---

## Licencia

Proyecto académico — Programación Web.
