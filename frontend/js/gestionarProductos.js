// ================================================================
//  Gestionar Productos — CRUD para el perfil de tienda
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (!requiereAuth()) return;
    actualizarNavbar();

    const productosContainer = document.getElementById('productos-container');
    const modal = document.getElementById('modal-producto');
    const formProducto = document.getElementById('form-producto');
    const modalTitulo = document.getElementById('modal-titulo');

    let categoriasGlobal = [];

    // ── Cargar Datos Iniciales ──────────────────────────────────
    async function init() {
        await cargarTiendaNav();
        await cargarCategorias();
        await cargarMisProductos();
    }

    async function cargarTiendaNav() {
        try {
            const result = await API.get('/tiendas/mi-tienda');
            const storeNameHeader = document.querySelector('.store-name-header');
            if (storeNameHeader) storeNameHeader.textContent = result.data.nombre;
        } catch (error) {
            console.error('Error al cargar datos tienda navbar', error);
        }
    }

    async function cargarCategorias() {
        try {
            const result = await API.get('/categorias');
            categoriasGlobal = result.data;
            const select = document.getElementById('prod-categoria');
            select.innerHTML = '<option value="">Selecciona categoría...</option>';
            categoriasGlobal.forEach(c => {
                select.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`;
            });
        } catch (error) {
            console.error('Error al cargar categorías', error);
            showToast('No se pudieron cargar las categorías', 'error');
        }
    }

    async function cargarMisProductos() {
        try {
            const result = await API.get('/productos/tienda/mis-productos');
            renderizarProductos(result.data);
        } catch (error) {
            console.error('Error al cargar mis productos', error);
            productosContainer.innerHTML = `<div class="empty-state">
                <h3>Error al cargar los productos.</h3>
            </div>`;
        }
    }

    // ── Render ──────────────────────────────────────────────────
    function renderizarProductos(productos) {
        if (!productos || productos.length === 0) {
            productosContainer.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48" style="margin-bottom: 15px; color: #cbd5e1;">
                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3 style="margin-bottom: 10px; color: #475569;">No tienes productos aún</h3>
                    <p>Empieza a vender publicando tu primer producto.</p>
                </div>`;
            return;
        }

        productosContainer.innerHTML = '';
        productos.forEach(p => {
            const imgHtml = p.imagen_url
                ? `<img src="${p.imagen_url}" alt="${p.nombre}" class="product-img" onerror="this.onerror=null; this.innerHTML='<span>Sin Imagen</span>'; this.style.backgroundColor='#f1f5f9'; this.src=''; ">`
                : `<div class="product-img"><span>Sin Imagen</span></div>`;

            const formatMoney = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

            const precioOfertaHtml = p.precio_oferta && parseFloat(p.precio_oferta) > 0
                ? `<div class="product-price">${formatMoney(p.precio_oferta)}</div>
                   <div class="product-original-price">${formatMoney(p.precio_original)}</div>`
                : `<div class="product-price">${formatMoney(p.precio_original)}</div>`;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                ${imgHtml}
                <div class="product-info">
                    <h3 class="product-title">${p.nombre}</h3>
                    <div style="flex: 1;">
                        ${precioOfertaHtml}
                        <div class="product-stock" style="color: ${p.stock <= 5 ? '#ef4444' : '#64748b'}">Stock: ${p.stock} unidades</div>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" data-id="${p.id_producto}">Editar</button>
                    <button class="btn-delete" data-id="${p.id_producto}">Eliminar</button>
                </div>
            `;
            productosContainer.appendChild(card);
        });

        // Eventos a botones
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id, productos));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id));
        });
    }

    // ── Funciones de Modal ──────────────────────────────────────
    document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
        formProducto.reset();
        document.getElementById('prod-id').value = '';
        modalTitulo.textContent = 'Nuevo Producto';
        modal.style.display = 'flex';
    });

    document.getElementById('btn-cancelar-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    function abrirModalEditar(id, productos) {
        const p = productos.find(x => x.id_producto == id);
        if (!p) return;

        document.getElementById('prod-id').value = p.id_producto;
        document.getElementById('prod-nombre').value = p.nombre;
        document.getElementById('prod-categoria').value = p.id_categoria;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-precio-original').value = p.precio_original;
        document.getElementById('prod-precio-oferta').value = p.precio_oferta || '';
        document.getElementById('prod-descripcion').value = p.descripcion || '';
        document.getElementById('prod-imagen').value = p.imagen_url || '';

        if (p.fecha_vencimiento) {
            document.getElementById('prod-vencimiento').value = p.fecha_vencimiento.split('T')[0];
        } else {
            document.getElementById('prod-vencimiento').value = '';
        }

        modalTitulo.textContent = 'Editar Producto';
        modal.style.display = 'flex';
    }

    // ── Guardar / Crear / Editar ────────────────────────────────
    formProducto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('prod-id').value;
        const payload = {
            nombre: document.getElementById('prod-nombre').value,
            id_categoria: document.getElementById('prod-categoria').value,
            stock: parseInt(document.getElementById('prod-stock').value, 10),
            precio_original: parseFloat(document.getElementById('prod-precio-original').value),
            precio_oferta: document.getElementById('prod-precio-oferta').value ? parseFloat(document.getElementById('prod-precio-oferta').value) : null,
            descripcion: document.getElementById('prod-descripcion').value,
            imagen_url: document.getElementById('prod-imagen').value,
            fecha_vencimiento: document.getElementById('prod-vencimiento').value || null
        };

        try {
            if (id) {
                await API.put(`/productos/${id}`, payload);
                showToast('Producto actualizado exitosamente.');
            } else {
                await API.post('/productos', payload);
                showToast('Producto creado exitosamente.');
            }
            modal.style.display = 'none';
            cargarMisProductos();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Error al guardar.', 'error');
        }
    });

    // ── Eliminar ────────────────────────────────────────────────
    async function confirmarEliminar(id) {
        if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;

        try {
            await API.delete(`/productos/${id}`);
            showToast('Producto eliminado exitosamente.');
            cargarMisProductos();
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Error al eliminar.', 'error');
        }
    }

    init();
});
