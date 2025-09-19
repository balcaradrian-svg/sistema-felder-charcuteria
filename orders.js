// ============================================
// SISTEMA DE PEDIDOS - CORREGIDO
// ============================================

// Variables para manejo de pedidos
let productosSeleccionados = [];
let pedidoTotal = 0;

// ============================================
// CARGA DE INFORMACIÓN DEL CLIENTE
// ============================================
function loadClientInfo() {
    const clienteId = document.getElementById('clientePedido').value;
    const infoDiv = document.getElementById('clienteInfo');
    const infoContent = document.getElementById('clienteInfoContent');
    
    if (!clienteId) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const cliente = clientes.find(c => c.id == clienteId);
    if (!cliente) return;
    
    // Calcular estadísticas del cliente
    const pedidosCliente = pedidos.filter(p => p.clienteId == clienteId);
    const totalPedidosPrevios = pedidosCliente.length;
    const montoTotalPrevio = pedidosCliente.reduce((sum, p) => sum + p.total, 0);
    
    let distanceInfo = '';
    if (cliente.coordenadas && validateCoordinates(cliente.coordenadas)) {
        const distance = calculateDistance(BASE_FELDER.coordenadas, cliente.coordenadas);
        if (distance) {
            distanceInfo = `<br><strong>📍 Distancia:</strong> ${distance.toFixed(1)} km de la base`;
        }
    }
    
    infoContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div>
                <strong>🏢 Razón Social:</strong> ${cliente.razonSocial}<br>
                <strong>📄 CUIT:</strong> ${cliente.cuit}<br>
                <strong>📞 Teléfono:</strong> ${cliente.telefono}
            </div>
            <div>
                <strong>📍 Dirección:</strong> ${cliente.direccion}${distanceInfo}<br>
                <strong>👤 Vendedor:</strong> ${cliente.vendedor}<br>
                <strong>⭐ Potencialidad:</strong> <span class="potential-badge potential-${cliente.potencialidad.toLowerCase()}">${cliente.potencialidad}</span>
            </div>
            <div>
                <strong>📊 Historial:</strong><br>
                • ${totalPedidosPrevios} pedidos anteriores<br>
                • Monto total: $${montoTotalPrevio.toLocaleString('es-AR')}
                ${cliente.notas ? `<br><strong>📝 Notas:</strong> ${cliente.notas}` : ''}
            </div>
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

// ============================================
// GESTIÓN DE PRODUCTOS EN PEDIDOS
// ============================================
function loadSubcategorias(selectElement) {
    const categoria = selectElement.value;
    const productoSelect = selectElement.closest('.producto-item').querySelector('.producto-select');
    
    // Limpiar productos
    productoSelect.innerHTML = '<option value="">Seleccionar producto</option>';
    
    if (!categoria || !window.productData) return;
    
    // CORREGIDO: usar window.productData en lugar de catalogo
    const productos = window.productData[categoria] || [];
    
    productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.nombre;
        option.textContent = producto.nombre;
        option.dataset.precio = producto.precio;
        option.dataset.unidad = producto.unidad;
        option.dataset.presentacion = producto.presentacion;
        productoSelect.appendChild(option);
    });
}

function loadProductInfo(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const productoItem = selectElement.closest('.producto-item');
    
    if (!selectedOption.value) {
        // Limpiar campos
        productoItem.querySelector('.precio-input').value = '';
        productoItem.querySelector('.unidad-input').value = '';
        productoItem.querySelector('.cantidad-input').value = '';
        productoItem.querySelector('.subtotal-input').value = '';
        return;
    }
    
    // Cargar información del producto
    const precio = parseFloat(selectedOption.dataset.precio) || 0;
    const unidad = selectedOption.dataset.unidad || 'kg';
    const presentacion = selectedOption.dataset.presentacion || '';
    
    productoItem.querySelector('.precio-input').value = precio;
    productoItem.querySelector('.unidad-input').value = unidad;
    
    // Limpiar cantidad y subtotal
    productoItem.querySelector('.cantidad-input').value = '';
    productoItem.querySelector('.subtotal-input').value = '';
    
    // Mostrar información de presentación si existe
    const infoDiv = productoItem.querySelector('.producto-info') || createProductInfoDiv(productoItem);
    if (presentacion) {
        infoDiv.innerHTML = `<small style="color: #666;">📦 ${presentacion}</small>`;
        infoDiv.style.display = 'block';
    } else {
        infoDiv.style.display = 'none';
    }
}

function createProductInfoDiv(productoItem) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'producto-info';
    infoDiv.style.marginTop = '5px';
    productoItem.appendChild(infoDiv);
    return infoDiv;
}

function calculateSubtotal(cantidadInput) {
    const productoItem = cantidadInput.closest('.producto-item');
    const cantidad = parseFloat(cantidadInput.value) || 0;
    const precio = parseFloat(productoItem.querySelector('.precio-input').value) || 0;
    
    const subtotal = cantidad * precio;
    productoItem.querySelector('.subtotal-input').value = subtotal.toFixed(2);
    
    // Actualizar total del pedido
    updatePedidoTotal();
}

function updatePedidoTotal() {
    const subtotales = document.querySelectorAll('.subtotal-input');
    let total = 0;
    
    subtotales.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    document.getElementById('totalPedido').textContent = total.toLocaleString('es-AR');
    pedidoTotal = total;
}

function addProducto() {
    const container = document.getElementById('productosContainer');
    const newProducto = createProductoItem();
    container.appendChild(newProducto);
}

function removeProducto(button) {
    const productoItem = button.closest('.producto-item');
    const container = document.getElementById('productosContainer');
    
    // No permitir eliminar si es el único producto
    if (container.querySelectorAll('.producto-item').length > 1) {
        productoItem.remove();
        updatePedidoTotal();
    } else {
        alert('Debe mantener al menos un producto en el pedido');
    }
}

function createProductoItem() {
    const div = document.createElement('div');
    div.className = 'producto-item';
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Categoría <span class="required">*</span></label>
                <select class="categoria-select" onchange="loadSubcategorias(this)" required>
                    <option value="">Seleccionar categoría</option>
                    <option value="salazones">Salazones</option>
                    <option value="fermentados">Fermentados</option>
                    <option value="embutidos">Embutidos</option>
                    <option value="fiambres">Fiambres de músculo entero</option>
                    <option value="frescos">Frescos Cerdo</option>
                    <option value="elaborados">Otros Elaborados</option>
                </select>
            </div>
            <div class="form-group">
                <label>Producto <span class="required">*</span></label>
                <select class="producto-select" onchange="loadProductInfo(this)" required>
                    <option value="">Seleccionar producto</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Cantidad <span class="required">*</span></label>
                <input type="number" class="cantidad-input" min="0.1" step="0.1" required onchange="calculateSubtotal(this)">
            </div>
            <div class="form-group">
                <label>Unidad</label>
                <input type="text" class="unidad-input" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Precio Unitario</label>
                <input type="number" class="precio-input" readonly>
            </div>
            <div class="form-group">
                <label>Subtotal</label>
                <input type="number" class="subtotal-input" readonly>
            </div>
        </div>
        <div class="form-group">
            <button type="button" class="btn btn-secondary btn-small" onclick="removeProducto(this)">Quitar Producto</button>
        </div>
        <hr style="margin: 20px 0;">
    `;
    return div;
}

// ============================================
// CREACIÓN DE PEDIDOS - CORREGIDA
// ============================================
function handlePedidoSubmit(e) {
    e.preventDefault();
    
    const clienteId = document.getElementById('clientePedido').value;
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    const observaciones = document.getElementById('observaciones').value.trim();
    
    if (!clienteId || !fechaEntrega) {
        showPedidoError('Por favor complete todos los campos obligatorios');
        return;
    }
    
    const productos = getProductosFromForm();
    if (productos.length === 0) {
        showPedidoError('Debe agregar al menos un producto al pedido');
        return;
    }
    
    // Validar que todos los productos tengan cantidad y precio
    const productosInvalidos = productos.filter(p => !p.cantidad || !p.precio || p.cantidad <= 0);
    if (productosInvalidos.length > 0) {
        showPedidoError('Todos los productos deben tener cantidad y precio válidos');
        return;
    }
    
    const cliente = clientes.find(c => c.id == clienteId);
    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);
    
    // Validar que el total sea mayor a 0
    if (total <= 0) {
        showPedidoError('El total del pedido debe ser mayor a $0');
        return;
    }
    
    const pedido = {
        id: pedidoIdCounter++,
        numero: generatePedidoNumber(),
        clienteId: parseInt(clienteId),
        clienteNombre: cliente.nombreFicticio,
        clienteTelefono: cliente.telefono,
        clienteDireccion: cliente.direccion,
        vendedorAsignado: cliente.vendedor,
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaEntrega: fechaEntrega,
        productos: productos,
        total: total,
        observaciones: observaciones,
        estado: 'Pendiente',
        creadoPor: currentUser.nombre
    };
    
    pedidos.push(pedido);
    saveData();
    
    showPedidoSuccess(`Pedido #${pedido.numero} creado exitosamente - Total: $${total.toLocaleString('es-AR')}`);
    
    // Limpiar formulario
    resetPedidoForm();
    
    // Preguntar si enviar WhatsApp
    if (cliente.telefono && confirm('¿Desea enviar notificación por WhatsApp al cliente?')) {
        sendWhatsAppNotification(pedido, cliente);
    }
}

function generatePedidoNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = today.toISOString().slice(11, 16).replace(':', ''); // HHMM
    return `F${dateStr}${timeStr}`;
}

function getProductosFromForm() {
    const productos = [];
    const productosItems = document.querySelectorAll('.producto-item');
    
    productosItems.forEach(item => {
        const categoria = item.querySelector('.categoria-select').value;
        const productoSelect = item.querySelector('.producto-select');
        const cantidad = parseFloat(item.querySelector('.cantidad-input').value);
        const precio = parseFloat(item.querySelector('.precio-input').value);
        const subtotal = parseFloat(item.querySelector('.subtotal-input').value);
        const unidad = item.querySelector('.unidad-input').value;
        
        if (categoria && productoSelect.value && cantidad && precio) {
            productos.push({
                categoria: categoria,
                nombre: productoSelect.options[productoSelect.selectedIndex].text,
                cantidad: cantidad,
                precio: precio,
                subtotal: subtotal || (cantidad * precio),
                unidad: unidad || 'kg'
            });
        }
    });
    
    return productos;
}

function resetPedidoForm() {
    document.getElementById('pedidoForm').reset();
    
    // Mantener solo un producto vacío
    const container = document.getElementById('productosContainer');
    const primerProducto = container.querySelector('.producto-item');
    
    // Limpiar todos los productos
    container.innerHTML = '';
    
    // Agregar un producto vacío
    container.appendChild(createProductoItem());
    
    // Limpiar total
    document.getElementById('totalPedido').textContent = '0';
    pedidoTotal = 0;
    
    // Ocultar información del cliente
    document.getElementById('clienteInfo').style.display = 'none';
}

// ============================================
// VISUALIZACIÓN DE PEDIDOS
// ============================================
function displayAllPedidos() {
    const container = document.getElementById('pedidosList');
    
    let pedidosToShow = pedidos;
    
    // Filtrar por vendedor si es necesario
    if (currentUser && currentUser.rol === 'vendedor') {
        pedidosToShow = pedidosToShow.filter(p => p.vendedorAsignado === currentUser.vendedor);
    }
    
    if (pedidosToShow.length === 0) {
        container.innerHTML = '<div class="no-results">No hay pedidos registrados.</div>';
        return;
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    pedidosToShow.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    container.innerHTML = pedidosToShow.map(pedido => createPedidoCard(pedido)).join('');
}

function createPedidoCard(pedido) {
    const cliente = clientes.find(c => c.id === pedido.clienteId);
    const estadoColor = getEstadoColor(pedido.estado);
    const isEditable = currentUser && (currentUser.rol === 'admin' || pedido.vendedorAsignado === currentUser.vendedor);
    
    return `
        <div class="client-card" data-pedido-id="${pedido.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 style="color: #d32f2f; margin-bottom: 5px;">Pedido #${pedido.numero}</h3>
                    <p style="font-weight: 600; margin-bottom: 5px;">${pedido.clienteNombre}</p>
                    <p style="font-size: 0.9em; color: #666;">${cliente?.razonSocial || 'Cliente no encontrado'}</p>
                </div>
                <span style="background: ${estadoColor}; color: white; padding: 6px 15px; border-radius: 20px; font-size: 0.9em; font-weight: 600;">
                    ${pedido.estado}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>📅 Fecha Creación:</strong> ${new Date(pedido.fechaCreacion).toLocaleDateString('es-AR')}<br>
                    <strong>🚛 Fecha Entrega:</strong> ${new Date(pedido.fechaEntrega).toLocaleDateString('es-AR')}<br>
                    <strong>👤 Vendedor:</strong> ${pedido.vendedorAsignado}
                </div>
                <div>
                    <strong>💰 Total:</strong> $${pedido.total.toLocaleString('es-AR')}<br>
                    <strong>📦 Productos:</strong> ${pedido.productos.length} items<br>
                    <strong>👨‍💼 Creado por:</strong> ${pedido.creadoPor || 'N/A'}
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>🛒 Productos:</strong>
                <div style="margin-top: 8px; max-height: 150px; overflow-y: auto;">
                    ${pedido.productos.map(p => `
                        <div style="background: #f8f8f8; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 0.9em;">
                            • ${p.nombre} - ${p.cantidad} ${p.unidad} - $${p.subtotal.toLocaleString('es-AR')}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${pedido.observaciones ? `
                <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; color: #856404;">
                    <strong>📝 Observaciones:</strong> ${pedido.observaciones}
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${isEditable ? `
                    <button class="btn btn-secondary btn-small" onclick="changeEstadoPedido(${pedido.id})">📋 Cambiar Estado</button>
                    <button class="btn btn-secondary btn-small" onclick="editPedido(${pedido.id})">✏️ Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="duplicatePedido(${pedido.id})">📄 Duplicar</button>
                ` : ''}
                <button class="btn btn-secondary btn-small" onclick="viewPedidoDetail(${pedido.id})">👁️ Ver Detalle</button>
                ${cliente?.telefono ? `
                    <button class="btn btn-secondary btn-small" onclick="sendPedidoWhatsApp(${pedido.id})">💬 WhatsApp</button>
                ` : ''}
                ${isEditable ? `
                    <button class="btn btn-secondary btn-small" onclick="deletePedido(${pedido.id})" style="background: #f44336;">🗑️ Eliminar</button>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// GESTIÓN DE ESTADOS DE PEDIDOS
// ============================================
function changeEstadoPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const estados = ['Pendiente', 'Preparando', 'Listo', 'Entregado'];
    const currentIndex = estados.indexOf(pedido.estado);
    
    let opciones = '<option value="">Seleccionar estado</option>';
    estados.forEach(estado => {
        const selected = estado === pedido.estado ? 'selected' : '';
        opciones += `<option value="${estado}" ${selected}>${estado}</option>`;
    });
    
    const nuevoEstado = prompt(`Cambiar estado del pedido #${pedido.numero}:\n\nEstado actual: ${pedido.estado}\n\nSeleccione nuevo estado:`, pedido.estado);
    
    if (nuevoEstado && estados.includes(nuevoEstado) && nuevoEstado !== pedido.estado) {
        pedido.estado = nuevoEstado;
        pedido.fechaActualizacion = new Date().toISOString();
        pedido.actualizadoPor = currentUser.nombre;
        
        saveData();
        displayAllPedidos();
        
        showPedidoSuccess(`Estado del pedido #${pedido.numero} cambiado a: ${nuevoEstado}`);
    }
}

// ============================================
// FILTROS DE PEDIDOS
// ============================================
function filterPedidos() {
    const fechaFilter = document.getElementById('filterFecha').value;
    const vendedorFilter = document.getElementById('filterVendedorPedido').value;
    const estadoFilter = document.getElementById('filterEstado').value;
    
    let pedidosToShow = pedidos;
    
    // Filtrar por rol del usuario
    if (currentUser && currentUser.rol === 'vendedor') {
        pedidosToShow = pedidosToShow.filter(p => p.vendedorAsignado === currentUser.vendedor);
    }
    
    // Aplicar filtros adicionales
    if (fechaFilter) {
        pedidosToShow = pedidosToShow.filter(p => 
            p.fechaEntrega === fechaFilter || p.fechaCreacion === fechaFilter
        );
    }
    
    if (vendedorFilter) {
        pedidosToShow = pedidosToShow.filter(p => p.vendedorAsignado === vendedorFilter);
    }
    
    if (estadoFilter) {
        pedidosToShow = pedidosToShow.filter(p => p.estado === estadoFilter);
    }
    
    // Mostrar resultados filtrados
    const container = document.getElementById('pedidosList');
    if (pedidosToShow.length === 0) {
        container.innerHTML = '<div class="no-results">No se encontraron pedidos con los filtros aplicados</div>';
    } else {
        // Ordenar por fecha de creación
        pedidosToShow.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        container.innerHTML = pedidosToShow.map(pedido => createPedidoCard(pedido)).join('');
    }
}

// ============================================
// WHATSAPP INTEGRATION CORREGIDA
// ============================================
function sendWhatsAppNotification(pedido, cliente) {
    // CORRECCIÓN: Evitar duplicar prefijo +54
    let telefono = cliente.telefono.replace(/\D/g, ''); // Solo números
    
    // Si no empieza con 54, agregarlo
    if (!telefono.startsWith('54')) {
        telefono = '54' + telefono;
    }
    
    // Si ya tiene 54 duplicado, corregirlo
    if (telefono.startsWith('5454')) {
        telefono = telefono.substring(2);
    }
    
    const mensaje = `Hola ${cliente.nombreFicticio}! 🥩

Tu pedido #${pedido.numero} ha sido confirmado.

📅 Fecha de entrega: ${new Date(pedido.fechaEntrega).toLocaleDateString('es-AR')}
💰 Total: $${pedido.total.toLocaleString('es-AR')}

Productos:
${pedido.productos.map(p => `• ${p.nombre} - ${p.cantidad} ${p.unidad} = $${p.subtotal.toLocaleString('es-AR')}`).join('\n')}

${pedido.observaciones ? `\nObservaciones: ${pedido.observaciones}\n` : ''}
¡Gracias por elegir Felder Charcutería!
Av. Almafuerte 5550, Paraná, E.R.`;
    
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

function sendPedidoWhatsApp(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    const cliente = clientes.find(c => c.id === pedido.clienteId);
    
    if (pedido && cliente) {
        sendWhatsAppNotification(pedido, cliente);
    }
}

// ============================================
// OPERACIONES ADICIONALES
// ============================================
function duplicatePedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    if (confirm(`¿Desea duplicar el pedido #${pedido.numero}?`)) {
        // Cambiar a tab de pedidos
        showTab('pedidos');
        
        // Seleccionar cliente
        document.getElementById('clientePedido').value = pedido.clienteId;
        loadClientInfo();
        
        // Cargar observaciones
        document.getElementById('observaciones').value = pedido.observaciones || '';
        
        showPedidoSuccess(`Duplicando pedido #${pedido.numero}. Complete los productos manualmente.`);
    }
}

function deletePedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    if (confirm(`¿Está seguro de eliminar el pedido #${pedido.numero}?\n\nEsta acción no se puede deshacer.`)) {
        pedidos = pedidos.filter(p => p.id !== pedidoId);
        saveData();
        displayAllPedidos();
        showPedidoSuccess(`Pedido #${pedido.numero} eliminado exitosamente`);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos de filtros
    const filterFecha = document.getElementById('filterFecha');
    const filterVendedorPedido = document.getElementById('filterVendedorPedido');
    const filterEstado = document.getElementById('filterEstado');
    
    if (filterFecha) filterFecha.addEventListener('change', filterPedidos);
    if (filterVendedorPedido) filterVendedorPedido.addEventListener('change', filterPedidos);
    if (filterEstado) filterEstado.addEventListener('change', filterPedidos);
});

// Exponer funciones globalmente - CORREGIDO
window.loadClientInfo = loadClientInfo;
window.loadSubcategorias = loadSubcategorias;
window.loadProductInfo = loadProductInfo;
window.calculateSubtotal = calculateSubtotal;
window.addProducto = addProducto;
window.removeProducto = removeProducto;
window.handlePedidoSubmit = handlePedidoSubmit;
window.displayAllPedidos = displayAllPedidos;
window.changeEstadoPedido = changeEstadoPedido;
window.filterPedidos = filterPedidos;
window.sendPedidoWhatsApp = sendPedidoWhatsApp;
window.duplicatePedido = duplicatePedido;
window.deletePedido = deletePedido;
window.getProductosFromForm = getProductosFromForm;

console.log('Orders.js cargado correctamente con todas las funciones expuestas');