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

    // Mapeo de imágenes locales por nombre
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

    return 'img/acetaminofen.jpeg'; // fallback
}

/**
 * Crear SVG de tienda (inline)
 */
function storeIconSVG() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
}

/**
 * Actualizar el navbar según el estado de autenticación
 */
function actualizarNavbar() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    // Actualizar avatar o nombre si existen elementos
    const avatarLinks = document.querySelectorAll('.nav-avatar-link');
    if (usuario.nombre_rol === 'Tienda') {
        avatarLinks.forEach(link => {
            link.href = '/perfil-tienda.html';
        });

        // Agregar el menú de opciones '+' para el rol Tienda
        const navRightElements = document.querySelectorAll('.nav-right');
        navRightElements.forEach(navRight => {
            // Prevenir duplicados si se llama a actualizarNavbar varias veces
            if (navRight.querySelector('.tienda-options-menu')) return;
            
            const tiendaMenu = document.createElement('div');
            tiendaMenu.className = 'tienda-options-menu';
            tiendaMenu.innerHTML = `
                <button class="tienda-options-btn" id="btn-tienda-options" title="Opciones de Tienda">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <div class="tienda-dropdown" style="display: none;">
                    <a href="gestionar-productos.html?action=new">Agregar producto</a>
                    <a href="gestionar-productos.html">Gestionar productos</a>
                </div>
            `;
            
            // Insertar antes del avatar, o al inicio de nav-right
            const avatarLink = navRight.querySelector('.nav-avatar-link') || navRight.querySelector('.user-avatar-small');
            if (avatarLink) {
                navRight.insertBefore(tiendaMenu, avatarLink);
            } else {
                navRight.appendChild(tiendaMenu);
            }

            // Lógica para mostrar/ocultar el menú
            const btn = tiendaMenu.querySelector('#btn-tienda-options');
            const dropdown = tiendaMenu.querySelector('.tienda-dropdown');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        });
    }
}
