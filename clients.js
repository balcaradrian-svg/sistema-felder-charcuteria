// ============================================
// GESTIÓN DE CLIENTES - CORREGIDA
// ============================================

// Variables para manejo de clientes
let clientesFiltered = [];
let editingClientId = null;

// ============================================
// BÚSQUEDA Y FILTRADO
// ============================================
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const vendedorFilter = document.getElementById('filterVendedor').value;
    const potencialFilter = document.getElementById('filterPotencial').value;
    
    let clientesToShow = clientes;
    
    // Filtrar por rol del usuario
    if (currentUser && currentUser.rol === 'vendedor') {
        clientesToShow = clientesToShow.filter(c => c.vendedor === currentUser.vendedor);
    }
    
    // Aplicar filtros
    if (searchTerm) {
        clientesToShow = clientesToShow.filter(cliente =>
            cliente.nombreFicticio.toLowerCase().includes(searchTerm) ||
            cliente.razonSocial.toLowerCase().includes(searchTerm) ||
            cliente.cuit.includes(searchTerm) ||
            cliente.telefono.includes(searchTerm) ||
            (cliente.direccion && cliente.direccion.toLowerCase().includes(searchTerm))
        );
    }
    
    if (vendedorFilter) {
        clientesToShow = clientesToShow.filter(c => c.vendedor === vendedorFilter);
    }
    
    if (potencialFilter) {
        clientesToShow = clientesToShow.filter(c => c.potencialidad === potencialFilter);
    }
    
    clientesFiltered = clientesToShow;
    displaySearchResults(clientesToShow);
}

function displaySearchResults(clientesToShow) {
    const container = document.getElementById('searchResults');
    
    if (clientesToShow.length === 0) {
        container.innerHTML = '<div class="no-results">No se encontraron clientes que coincidan con los criterios de búsqueda.</div>';
        return;
    }
    
    container.innerHTML = clientesToShow.map(cliente => createClientCard(cliente)).join('');
}

// ============================================
// VISUALIZACIÓN DE CLIENTES
// ============================================
function displayAllClients() {
    let clientesToShow = clientes;
    
    // Filtrar por rol del usuario
    if (currentUser && currentUser.rol === 'vendedor') {
        clientesToShow = clientesToShow.filter(c => c.vendedor === currentUser.vendedor);
    }
    
    const container = document.getElementById('clientList');
    
    if (clientesToShow.length === 0) {
        container.innerHTML = '<div class="no-results">No hay clientes registrados.</div>';
        return;
    }
    
    // Ordenar por fecha de registro (más recientes primero)
    clientesToShow.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
    
    container.innerHTML = clientesToShow.map(cliente => createClientCard(cliente)).join('');
}

function createClientCard(cliente) {
    const isReadonly = currentUser && currentUser.rol === 'vendedor';
    const readonlyClass = isReadonly ? 'readonly' : '';
    
    // Calcular distancia si tiene coordenadas - CORREGIDO
    let distanceInfo = '';
    if (cliente.coordenadas && validateCoordinates(cliente.coordenadas)) {
        const distance = calculateDistance(BASE_FELDER.coordenadas, cliente.coordenadas); // CORREGIDO: usar BASE_FELDER
        if (distance) {
            distanceInfo = `<br><small>📍 ${distance.toFixed(1)} km de la base</small>`;
        }
    }
    
    // Verificar zona de entrega
    let zoneInfo = '';
    if (cliente.coordenadas && validateCoordinates(cliente.coordenadas)) {
        const zoneCheck = checkDeliveryZone(cliente.coordenadas);
        const zoneColor = zoneCheck.valid ? '#4caf50' : '#ff9800';
        zoneInfo = `<br><small style="color: ${zoneColor};">🗺️ ${zoneCheck.message}</small>`;
    }
    
    const potencialClass = `potential-${cliente.potencialidad.toLowerCase()}`;
    
    return `
        <div class="client-card ${readonlyClass}" data-client-id="${cliente.id}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <h3 style="color: #d32f2f; margin-bottom: 5px;">${cliente.nombreFicticio}</h3>
                    <p style="font-weight: 600; margin-bottom: 10px;">${cliente.razonSocial}</p>
                </div>
                <span class="potential-badge ${potencialClass}">${cliente.potencialidad}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>📄 CUIT:</strong> ${cliente.cuit}<br>
                    <strong>📞 Teléfono:</strong> ${cliente.telefono}<br>
                    <strong>👤 Vendedor:</strong> ${cliente.vendedor}
                </div>
                <div>
                    <strong>📍 Dirección:</strong> ${cliente.direccion || 'No especificada'}
                    ${distanceInfo}
                    ${zoneInfo}
                </div>
            </div>
            
            ${cliente.email ? `<p><strong>📧 Email:</strong> ${cliente.email}</p>` : ''}
            ${cliente.notas ? `<p><strong>📝 Notas:</strong> ${cliente.notas}</p>` : ''}
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
                <strong>Registrado:</strong> ${new Date(cliente.fechaRegistro).toLocaleDateString('es-AR')}
                ${getPedidosCount(cliente.id)}
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${!isReadonly ? `
                    <button class="btn btn-secondary btn-small" onclick="editClient(${cliente.id})">✏️ Editar</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteClient(${cliente.id})">🗑️ Eliminar</button>
                ` : ''}
                <button class="btn btn-secondary btn-small" onclick="viewClientHistory(${cliente.id})">📈 Historial</button>
                <button class="btn btn-secondary btn-small" onclick="createPedidoForClient(${cliente.id})">🛒 Nuevo Pedido</button>
                ${cliente.telefono ? `<button class="btn btn-secondary btn-small" onclick="contactClient(${cliente.id})">💬 WhatsApp</button>` : ''}
            </div>
        </div>
    `;
}

function getPedidosCount(clienteId) {
    const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId);
    const totalPedidos = pedidosCliente.length;
    const totalMonto = pedidosCliente.reduce((total, p) => total + p.total, 0);
    
    if (totalPedidos === 0) {
        return '<br><small>📦 Sin pedidos registrados</small>';
    }
    
    return `<br><small>📦 ${totalPedidos} pedidos - Total: $${totalMonto.toLocaleString('es-AR')}</small>`;
}

// ============================================
// EDICIÓN DE CLIENTES
// ============================================
function editClient(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    // Cambiar a tab de registro
    showTab('registro');
    
    // Rellenar formulario con datos del cliente
    document.getElementById('nombreFicticio').value = cliente.nombreFicticio;
    document.getElementById('razonSocial').value = cliente.razonSocial;
    document.getElementById('cuit').value = cliente.cuit;
    document.getElementById('telefono').value = cliente.telefono;
    document.getElementById('direccion').value = cliente.direccion || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('vendedor').value = cliente.vendedor;
    document.getElementById('potencialidad').value = cliente.potencialidad;
    document.getElementById('notas').value = cliente.notas || '';
    
    // Establecer coordenadas si existen
    if (cliente.coordenadas) {
        window.selectedCoordinates = cliente.coordenadas;
        updateCoordinatesInfo(cliente.coordenadas, cliente.direccion);
    }
    
    // Cambiar modo a edición
    editingClientId = clienteId;
    
    // Cambiar texto del botón
    const submitBtn = document.querySelector('#clientForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Actualizar Cliente';
        submitBtn.style.background = '#ff9800';
    }
    
    // Mostrar mensaje informativo
    showSuccess(`Editando cliente: ${cliente.nombreFicticio}`);
}

function cancelEdit() {
    editingClientId = null;
    
    // Restaurar botón
    const submitBtn = document.querySelector('#clientForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Registrar Cliente';
        submitBtn.style.background = '#d32f2f';
    }
    
    // Limpiar formulario
    document.getElementById('clientForm').reset();
    clearClienteMap();
}

// ============================================
// ELIMINACIÓN DE CLIENTES
// ============================================
function deleteClient(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    // Verificar si tiene pedidos asociados
    const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId);
    
    let confirmMessage = `¿Está seguro de eliminar el cliente "${cliente.nombreFicticio}"?`;
    
    if (pedidosCliente.length > 0) {
        confirmMessage += `\n\nATENCIÓN: Este cliente tiene ${pedidosCliente.length} pedidos asociados que también se eliminarán.`;
    }
    
    if (confirm(confirmMessage)) {
        // Eliminar cliente
        clientes = clientes.filter(c => c.id !== clienteId);
        
        // Eliminar pedidos asociados
        if (pedidosCliente.length > 0) {
            pedidos = pedidos.filter(p => p.clienteId !== clienteId);
        }
        
        // Guardar cambios
        saveData();
        
        // Actualizar vistas
        displayAllClients();
        performSearch();
        loadClientesForPedidos();
        
        showSuccess(`Cliente "${cliente.nombreFicticio}" eliminado exitosamente${pedidosCliente.length > 0 ? ` junto con ${pedidosCliente.length} pedidos` : ''}`);
    }
}

// ============================================
// HISTORIAL Y ESTADÍSTICAS DE CLIENTE
// ============================================
function viewClientHistory(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId);
    
    let historyHtml = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; margin: 20px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #d32f2f; margin-bottom: 20px;">📈 Historial de ${cliente.nombreFicticio}</h2>
            
            <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3>Información General</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div><strong>Razón Social:</strong> ${cliente.razonSocial}</div>
                    <div><strong>CUIT:</strong> ${cliente.cuit}</div>
                    <div><strong>Vendedor:</strong> ${cliente.vendedor}</div>
                    <div><strong>Potencialidad:</strong> <span class="potential-badge potential-${cliente.potencialidad.toLowerCase()}">${cliente.potencialidad}</span></div>
                </div>
            </div>
    `;
    
    if (pedidosCliente.length === 0) {
        historyHtml += `
            <div class="no-results">
                Este cliente aún no ha realizado pedidos.
            </div>
        `;
    } else {
        // Estadísticas generales
        const totalPedidos = pedidosCliente.length;
        const totalMonto = pedidosCliente.reduce((sum, p) => sum + p.total, 0);
        const montoPromedio = totalMonto / totalPedidos;
        const ultimoPedido = pedidosCliente.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))[0];
        
        historyHtml += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-number">${totalPedidos}</div>
                    <div class="stat-label">Total Pedidos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">$${totalMonto.toLocaleString('es-AR')}</div>
                    <div class="stat-label">Monto Total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">$${montoPromedio.toLocaleString('es-AR')}</div>
                    <div class="stat-label">Promedio por Pedido</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${new Date(ultimoPedido.fechaCreacion).toLocaleDateString('es-AR')}</div>
                    <div class="stat-label">Último Pedido</div>
                </div>
            </div>
            
            <h3>Historial de Pedidos</h3>
            <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
        `;
        
        // Lista de pedidos ordenados por fecha
        const pedidosOrdenados = pedidosCliente.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        
        pedidosOrdenados.forEach(pedido => {
            const estadoColor = getEstadoColor(pedido.estado);
            historyHtml += `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong>Pedido #${pedido.numero}</strong>
                        <span style="background: ${estadoColor}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8em;">${pedido.estado}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9em;">
                        <div><strong>Fecha:</strong> ${new Date(pedido.fechaCreacion).toLocaleDateString('es-AR')}</div>
                        <div><strong>Entrega:</strong> ${new Date(pedido.fechaEntrega).toLocaleDateString('es-AR')}</div>
                        <div><strong>Total:</strong> $${pedido.total.toLocaleString('es-AR')}</div>
                        <div><strong>Productos:</strong> ${pedido.productos.length} items</div>
                    </div>
                    ${pedido.observaciones ? `<div style="margin-top: 10px; font-style: italic; color: #666;">Obs: ${pedido.observaciones}</div>` : ''}
                </div>
            `;
        });
        
        historyHtml += '</div>';
    }
    
    historyHtml += `
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn" onclick="closeHistory()">Cerrar</button>
            </div>
        </div>
    `;
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'historyOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
    `;
    
    overlay.innerHTML = historyHtml;
    document.body.appendChild(overlay);
    
    // Cerrar al hacer click fuera
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeHistory();
        }
    });
}

function closeHistory() {
    const overlay = document.getElementById('historyOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function getEstadoColor(estado) {
    const colors = {
        'Pendiente': '#ff9800',
        'Preparando': '#2196f3',
        'Listo': '#4caf50',
        'Entregado': '#4caf50'
    };
    return colors[estado] || '#757575';
}

// ============================================
// ACCIONES ADICIONALES
// ============================================
function createPedidoForClient(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    
    // Cambiar a tab de pedidos
    showTab('pedidos');
    
    // Seleccionar el cliente en el formulario
    const clienteSelect = document.getElementById('clientePedido');
    if (clienteSelect) {
        clienteSelect.value = clienteId;
        loadClientInfo(); // Cargar información del cliente
    }
    
    showSuccess(`Creando pedido para: ${cliente.nombreFicticio}`);
}

function contactClient(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente || !cliente.telefono) return;
    
    // Limpiar teléfono y agregar prefijo si es necesario
    let telefono = cliente.telefono.replace(/\D/g, '');
    
    if (!telefono.startsWith('54')) {
        telefono = '54' + telefono;
    }
    
    const mensaje = `Hola ${cliente.nombreFicticio}! 🥩

Soy ${currentUser.nombre} de Felder Charcutería.

¿Te gustaría hacer un pedido o tienes alguna consulta sobre nuestros productos?

¡Estamos aquí para ayudarte!`;
    
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

// ============================================
// VALIDACIONES - CORREGIDO
// ============================================
function validateCUIT(cuit) {
    // Validar formato XX-XXXXXXXX-X
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
}

// ============================================
// MODIFICACIÓN DEL FORMULARIO DE CLIENTE
// ============================================
function handleClientSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nombreFicticio: document.getElementById('nombreFicticio').value.trim(),
        razonSocial: document.getElementById('razonSocial').value.trim(),
        cuit: document.getElementById('cuit').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        email: document.getElementById('email').value.trim(),
        vendedor: document.getElementById('vendedor').value,
        potencialidad: document.getElementById('potencialidad').value,
        notas: document.getElementById('notas').value.trim(),
        coordenadas: window.selectedCoordinates || null
    };
    
    // Validación CUIT corregida - usar función global
    if (!validateCUIT(formData.cuit)) {
        showError('El CUIT debe tener el formato: 20-12345678-9');
        return;
    }
    
    if (editingClientId) {
        // Modo edición
        updateClient(editingClientId, formData);
    } else {
        // Modo creación
        createNewClient(formData);
    }
}

function createNewClient(formData) {
    // Verificar CUIT duplicado
    if (clientes.some(cliente => cliente.cuit === formData.cuit)) {
        showError('Ya existe un cliente registrado con este CUIT');
        return;
    }
    
    const newClient = {
        ...formData,
        id: clienteIdCounter++,
        fechaRegistro: new Date().toISOString().split('T')[0]
    };
    
    clientes.push(newClient);
    saveData();
    
    showSuccess('Cliente registrado exitosamente');
    document.getElementById('clientForm').reset();
    window.selectedCoordinates = null;
    
    // Actualizar listas
    loadClientesForPedidos();
}

function updateClient(clienteId, formData) {
    const clienteIndex = clientes.findIndex(c => c.id === clienteId);
    if (clienteIndex === -1) return;
    
    // Verificar CUIT duplicado (excluyendo el cliente actual)
    if (clientes.some(cliente => cliente.cuit === formData.cuit && cliente.id !== clienteId)) {
        showError('Ya existe otro cliente registrado con este CUIT');
        return;
    }
    
    // Mantener fecha de registro original
    const fechaRegistroOriginal = clientes[clienteIndex].fechaRegistro;
    
    clientes[clienteIndex] = {
        ...formData,
        id: clienteId,
        fechaRegistro: fechaRegistroOriginal
    };
    
    saveData();
    
    showSuccess('Cliente actualizado exitosamente');
    cancelEdit();
    
    // Actualizar vistas
    displayAllClients();
    performSearch();
    loadClientesForPedidos();
}

// ============================================
// EXPORTACIÓN E IMPORTACIÓN
// ============================================
function exportClients() {
    try {
        const dataToExport = {
            clientes: clientes,
            fecha: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `felder-clientes-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSuccess('Clientes exportados exitosamente');
    } catch (error) {
        showError('Error al exportar clientes: ' + error.message);
    }
}

// Exponer funciones globalmente - CORREGIDO
window.performSearch = performSearch;
window.displayAllClients = displayAllClients;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewClientHistory = viewClientHistory;
window.closeHistory = closeHistory;
window.createPedidoForClient = createPedidoForClient;
window.contactClient = contactClient;
window.exportClients = exportClients;
window.cancelEdit = cancelEdit;
window.handleClientSubmit = handleClientSubmit; // Asegurar que esté expuesta
window.createClientCard = createClientCard;
window.validateCUIT = validateCUIT;

console.log('Clients.js cargado correctamente con todas las funciones expuestas');