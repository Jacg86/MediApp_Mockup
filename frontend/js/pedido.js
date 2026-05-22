// ================================================================
//  Pedido — Crear pedido y ver historial
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!requiereAuth()) return;
    actualizarNavbar();

    // ── Stripe Config ──────────────────────────────────────────────
    let stripe, elements, cardElement;
    
    // Llave pública de Stripe para inicializar el formulario de tarjeta
    const STRIPE_PUBLIC_KEY = 'pk_test_51TYuFUJr2KAWvDFi9mTeWNzREKIial2Gt0CM83nQo4VNH0PQETWjp8BEDIn30QQnrmH2CVCdITi9Ebp';
    
    if (window.Stripe) {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        elements = stripe.elements();
        cardElement = elements.create('card');
        
        const cardContainer = document.getElementById('card-element');
        if (cardContainer) {
            cardElement.mount('#card-element');
            
            cardElement.on('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        }
    }

    // Toggle de UI para métodos de pago
    const radioEfectivo = document.querySelector('input[name="payment_method"][value="efectivo"]');
    const radioTarjeta = document.querySelector('input[name="payment_method"][value="tarjeta"]');
    const stripeContainer = document.getElementById('stripe-container');

    if (radioEfectivo && radioTarjeta && stripeContainer) {
        radioEfectivo.addEventListener('change', () => { stripeContainer.style.display = 'none'; });
        radioTarjeta.addEventListener('change', () => { stripeContainer.style.display = 'block'; });
    }

    // ── Formulario de domicilio (crear pedido y pagar) ──────────────
    const pedidoForm = document.getElementById('pedido-form');
    if (pedidoForm) {
        pedidoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const direccion = document.getElementById('delivery-address').value.trim();
            const ciudad = document.getElementById('delivery-city').value.trim();
            const telefono = document.getElementById('delivery-phone').value.trim();
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

            if (!direccion || !ciudad) {
                showToast('La dirección y ciudad son obligatorias.', 'error');
                return;
            }

            const btnConfirm = pedidoForm.querySelector('.btn-submit');
            btnConfirm.disabled = true;
            btnConfirm.textContent = 'Procesando...';

            try {
                // 1. Crear el Pedido
                const result = await API.post('/pedidos', {
                    metodo_entrega: 'domicilio_express',
                    direccion_entrega: `${direccion}, ${ciudad}`,
                    notas: telefono ? `Tel: ${telefono}` : null,
                });

                const id_pedido = result.data.id_pedido;

                // 2. Procesar Pago
                if (paymentMethod === 'efectivo') {
                    await API.post('/pagos/confirmar-efectivo', { id_pedido });
                    showToast('¡Pedido creado! Pago contra entrega.');
                    setTimeout(() => window.location.href = '/pedidos.html', 1500);

                } else if (paymentMethod === 'tarjeta') {
                    // a) Obtener Intent de Stripe
                    const intentRes = await API.post('/pagos/crear-intencion', { id_pedido });
                    const clientSecret = intentRes.clientSecret;

                    // b) Confirmar en el frontend con Stripe
                    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                address: {
                                    line1: direccion,
                                    city: ciudad
                                }
                            }
                        }
                    });

                    if (error) {
                        document.getElementById('card-errors').textContent = error.message;
                        showToast(error.message, 'error');
                        btnConfirm.disabled = false;
                        btnConfirm.textContent = 'Confirmar pedido';
                        return;
                    }

                    if (paymentIntent.status === 'succeeded') {
                        // c) Notificar al backend del éxito
                        await API.post('/pagos/confirmar-tarjeta', { 
                            id_pedido, 
                            paymentIntentId: paymentIntent.id 
                        });
                        showToast('¡Pago con tarjeta exitoso!');
                        setTimeout(() => window.location.href = '/pedidos.html', 1500);
                    }
                }

            } catch (error) {
                showToast(error.message || 'Error al procesar el pedido o el pago.', 'error');
                btnConfirm.disabled = false;
                btnConfirm.textContent = 'Confirmar pedido';
            }
        });
    }

    // ── Historial de pedidos ─────────────────────────────────────
    const pedidosList = document.getElementById('pedidos-list');
    if (pedidosList) {
        cargarPedidos();
    }

    async function cargarPedidos() {
        try {
            const result = await API.get('/pedidos');

            if (result.data.length === 0) {
                pedidosList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📦</div>
                        <h3>No tienes pedidos</h3>
                        <p>Cuando realices tu primera compra, aparecerá aquí.</p>
                        <a href="/home.html" class="btn-back-home">Explorar catálogo</a>
                    </div>
                `;
                return;
            }

            let html = '';
            result.data.forEach(pedido => {
                const items = pedido.items || [];
                const itemsHtml = items.map(i =>
                    `<span class="pedido-item-tag">${i.nombre_producto} x${i.cantidad}</span>`
                ).join('');

                html += `
                    <div class="pedido-card">
                        <div class="pedido-card-header">
                            <div>
                                <span class="pedido-id">Pedido #${pedido.id_pedido}</span>
                                <span class="pedido-fecha">${formatDate(pedido.created_at)}</span>
                            </div>
                            <span class="pedido-estado">${formatEstado(pedido.estado)}</span>
                        </div>
                        <div class="pedido-items">${itemsHtml}</div>
                        <div class="pedido-card-footer">
                            <span class="pedido-metodo">${pedido.metodo_entrega === 'domicilio_express' ? '🏍️ Domicilio Express' : pedido.metodo_entrega === 'programado' ? '📅 Programado' : '🏪 Retiro en tienda'}</span>
                            <span class="pedido-total">Total: ${formatPrice(pedido.total)}</span>
                        </div>
                        ${pedido.estado === 'pagado' ? `
                        <div style="margin-top: 12px; border-top: 1px dashed #e5e7eb; padding-top: 12px; text-align: right;">
                            <a href="/api/pagos/comprobante/${pedido.id_pedido}?token=${obtenerToken()}" target="_blank" class="btn-submit" style="background:var(--primary);color:var(--text-dark);padding:6px 12px;font-size:12px;width:auto;display:inline-block;text-decoration:none;">
                                📄 Descargar Comprobante
                            </a>
                        </div>
                        ` : ''}
                    </div>
                `;
            });

            pedidosList.innerHTML = html;

        } catch (error) {
            console.error('Error cargando pedidos:', error);
            pedidosList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Error al cargar pedidos</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
});
