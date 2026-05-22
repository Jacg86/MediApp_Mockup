// ================================================================
//  Utilidades — Helpers para formateo y UI
// ================================================================

/**
 * Formatear precio en pesos colombianos
 */
function formatPrice(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    if (num === 0) return 'Gratis';
    return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Calcular días hasta una fecha
 */
function daysUntil(dateStr) {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
}

/**
 * Obtener clase CSS y texto según días de vencimiento
 */
function getExpireInfo(dias) {
    if (dias === undefined || dias === null) {
        return { clase: 'dates-warning', texto: 'Sin fecha' };
    }
    if (dias <= 7) {
        return { clase: 'dates-danger', texto: `Caduca en ${dias} día${dias !== 1 ? 's' : ''}` };
    } else if (dias <= 21) {
        return { clase: 'dates-warning', texto: `Caduca en ${dias} días` };
    } else {
        return { clase: 'dates-safe', texto: `Caduca en ${dias} días` };
    }
}

/**
 * Formatear fecha a formato legible
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

/**
 * Formatear estado del pedido
 */
function formatEstado(estado) {
    const mapeo = {
        'pendiente': '🟡 Pendiente',
        'confirmado': '🔵 Confirmado',
        'en_camino': '🚚 En camino',
        'entregado': '✅ Entregado',
        'cancelado': '❌ Cancelado',
    };
    return mapeo[estado] || estado;
}

/**
 * Mostrar notificación toast
 */
function showToast(message, type = 'success') {
    // Remover toast existente
    const existente = document.getElementById('toast-notification');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    // Auto-cerrar
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/**
 * Obtener imagen del producto o placeholder
 */
function getProductImage(producto) {
    if (producto.imagen_url) return producto.imagen_url;

    // Mapeo de imágenes locales por nombre (solo para datos semilla antiguos)
    const imageMap = {
        'acetaminofén': 'img/acetaminofen.jpeg',
        'acetaminofen': 'img/acetaminofen.jpeg',
        'ibuprofeno': 'img/ibuprofeno.webp',
        'paracetamol': 'img/paracetamol.webp',
        'loratadina': 'img/loratadina.webp',
        'vitamina c': 'img/vitamina.webp',
        'vitamina d3': 'img/vitamina.webp',
        'betametasona': 'img/betametasona.jpeg',
    };

    const nombre = (producto.nombre || producto.nombre_producto || '').toLowerCase();
    for (const [key, val] of Object.entries(imageMap)) {
        if (nombre.includes(key)) return val;
    }

    // Placeholder por defecto si no hay imagen (URL Encoded para no romper el HTML)
    const svgPlaceholder = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder);
}

/**
 * Crear SVG de tienda (inline)
 */
function storeIconSVG() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
}

/**
 * Actualizar el navbar según el rol de autenticación
 */
function actualizarNavbar() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // ── Lógica para Administrador ──
    if (usuario.nombre_rol === 'Usuario' || usuario.id_rol === 1) {
        navRight.innerHTML = `
            <a href="admin.html" style="text-decoration: none; color: #475569; font-weight: 500;">Panel Admin</a>
            <a href="#" onclick="event.preventDefault(); cerrarSesion();" style="text-decoration: none; color: #ef4444; font-weight: 600;">Cerrar sesión</a>
        `;
        
        // Ocultar buscador y ubicación en todas las vistas si es admin
        const search = document.querySelector('.nav-center');
        if (search) search.style.display = 'none';
        const location = document.querySelector('.nav-location');
        if (location) location.style.display = 'none';
        
        return;
    }

    // ── Lógica para Tienda ──
    if (usuario.nombre_rol === 'Tienda') {
        navRight.innerHTML = `
            <a href="gestionar-productos.html" class="icon-btn" title="Mis Productos">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </a>
            <a href="perfil-tienda.html" class="icon-btn" title="Mis Ventas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </a>
            <a href="perfil-tienda.html" class="nav-avatar-link" title="Mi Perfil"><div class="user-avatar" style="background-color: #cdd4c2;"></div></a>
            <a href="#" class="icon-btn" style="color: #ef4444;" onclick="event.preventDefault(); cerrarSesion();" title="Cerrar sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </a>
        `;
        
        // Ocultar buscador y ubicación en todas las vistas si es tienda
        const search = document.querySelector('.nav-center');
        if (search) search.style.display = 'none';
        const location = document.querySelector('.nav-location');
        if (location) location.style.display = 'none';
        
        return;
    }

    // ── Lógica para Consumidor ──
    if (usuario.nombre_rol === 'Consumidor') {
        navRight.innerHTML = `
            <a href="pedidos.html" class="icon-btn" title="Mis pedidos">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </a>
            <a href="carrito.html" class="icon-btn" id="nav-cart-btn" title="Carrito">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            </a>
            <a href="perfil-persona.html" class="nav-avatar-link"><div class="user-avatar" style="background-color: #cdd4c2;"></div></a>
            <a href="#" class="icon-btn" style="color: #ef4444;" onclick="event.preventDefault(); cerrarSesion();" title="Cerrar sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </a>
        `;
        return;
    }
}
