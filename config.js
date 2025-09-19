// ============================================
// PANEL DE CONFIGURACIÓN - SOLO ADMINISTRADORES
// ============================================

// Variables de configuración
let systemConfig = {
    empresa: {
        nombre: "Felder - Charcutería y carnicería",
        direccion: "Av. Almafuerte 5550, Paraná, Entre Ríos",
        telefono: "(343) 5019486",
        email: "info@feldercharcuteria.com",
        instagram: "feldercharcuteria"
    },
    reparto: {
        diasPermitidos: [2, 5], // Martes y Viernes
        horaInicio: "08:00",
        capacidadMaxima: 500, // kg
        zonaEntrega: ["Paraná", "San Benito", "Colonia Avellaneda"],
        costoEnvasadoVacio: 2500
    },
    whatsapp: {
        numeroEmpresa: "543435019486",
        mensajePedido: `Hola {cliente}! 🥩

Tu pedido #{numero} ha sido confirmado.

📅 Fecha de entrega: {fecha}
💰 Total: ${total}

Productos:
{productos}

¡Gracias por elegir Felder Charcutería!`
    }
};

// ============================================
// CARGA DE CONFIGURACIÓN
// ============================================
function loadConfiguracion() {
    if (currentUser?.rol !== 'admin') {
        document.getElementById('configContent').innerHTML = `
            <div class="permission-notice">
                ⚠️ Solo los administradores pueden acceder a la configuración del sistema.
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('configContent');
    container.innerHTML = createConfigInterface();
    
    // Cargar datos guardados
    loadSavedConfig();
}

function createConfigInterface() {
    return `
        <div class="config-sections">
            <!-- Gestión de Vendedores -->
            <div class="config-section">
                <h3>👥 Gestión de Vendedores</h3>
                <div class="config-card">
                    <h4>Vendedores Activos</h4>
                    <div id="vendedoresList">
                        ${createVendedoresList()}
                    </div>
                    <div style="margin-top: 15px;">
                        <button class="btn btn-secondary" onclick="showAddVendedorForm()">➕ Agregar Vendedor</button>
                        <button class="btn btn-secondary" onclick="exportVendedoresReport()">📊 Reporte de Vendedores</button>
                    </div>
                </div>
            </div>

            <!-- Configuración de Productos -->
            <div class="config-section">
                <h3>🛒 Gestión de Productos</h3>
                <div class="config-card">
                    <h4>Catálogo de Productos</h4>
                    <p>Productos registrados: <strong>${Object.values(window.productData).flat().length}</strong></p>
                    <p>Categorías: <strong>${Object.keys(window.productData).length}</strong></p>
                    <div style="margin-top: 15px;">
                        <button class="btn btn-secondary" onclick="showProductManager()">📝 Administrar Productos</button>
                        <button class="btn btn-secondary" onclick="exportCatalog()">📄 Exportar Catálogo</button>
                        <button class="btn btn-secondary" onclick="importCatalog()">📁 Importar Catálogo</button>
                    </div>
                </div>
            </div>

            <!-- Configuración de Empresa -->
            <div class="config-section">
                <h3>🏢 Datos de la Empresa</h3>
                <div class="config-card">
                    <form id="empresaConfigForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nombre de la Empresa</label>
                                <input type="text" id="empresaNombre" value="${systemConfig.empresa.nombre}">
                            </div>
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="text" id="empresaTelefono" value="${systemConfig.empresa.telefono}">
                            </div>
                        </div>
                        <div class="form-row single">
                            <div class="form-group">
                                <label>Dirección</label>
                                <input type="text" id="empresaDireccion" value="${systemConfig.empresa.direccion}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="empresaEmail" value="${systemConfig.empresa.email}">
                            </div>
                            <div class="form-group">
                                <label>Instagram (sin @)</label>
                                <input type="text" id="empresaInstagram" value="${systemConfig.empresa.instagram}">
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="saveEmpresaConfig()">Guardar Configuración</button>
                    </form>
                </div>
            </div>

            <!-- Configuración de Reparto -->
            <div class="config-section">
                <h3>🚛 Configuración de Reparto</h3>
                <div class="config-card">
                    <form id="repartoConfigForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Hora de Inicio</label>
                                <input type="time" id="repartoHoraInicio" value="${systemConfig.reparto.horaInicio}">
                            </div>
                            <div class="form-group">
                                <label>Capacidad Máxima (kg)</label>
                                <input type="number" id="repartoCapacidad" value="${systemConfig.reparto.capacidadMaxima}" min="100" max="1000">
                            </div>
                        </div>
                        <div class="form-row single">
                            <div class="form-group">
                                <label>Zonas de Entrega (separadas por coma)</label>
                                <input type="text" id="repartoZonas" value="${systemConfig.reparto.zonaEntrega.join(', ')}">
                            </div>
                        </div>
                        <div class="form-row single">
                            <div class="form-group">
                                <label>Días de Reparto</label>
                                <div style="display: flex; gap: 15px; margin-top: 5px;">
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(1) ? 'checked' : ''} value="1"> Lunes</label>
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(2) ? 'checked' : ''} value="2"> Martes</label>
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(3) ? 'checked' : ''} value="3"> Miércoles</label>
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(4) ? 'checked' : ''} value="4"> Jueves</label>
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(5) ? 'checked' : ''} value="5"> Viernes</label>
                                    <label><input type="checkbox" ${systemConfig.reparto.diasPermitidos.includes(6) ? 'checked' : ''} value="6"> Sábado</label>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="saveRepartoConfig()">Guardar Configuración</button>
                    </form>
                </div>
            </div>

            <!-- Configuración de WhatsApp -->
            <div class="config-section">
                <h3>💬 Configuración de WhatsApp</h3>
                <div class="config-card">
                    <form id="whatsappConfigForm">
                        <div class="form-row single">
                            <div class="form-group">
                                <label>Número de WhatsApp Business (con código de país)</label>
                                <input type="text" id="whatsappNumero" value="${systemConfig.whatsapp.numeroEmpresa}" placeholder="543435019486">
                            </div>
                        </div>
                        <div class="form-row single">
                            <div class="form-group">
                                <label>Plantilla de Mensaje para Pedidos</label>
                                <textarea id="whatsappMensaje" rows="10" style="font-family: monospace;">${systemConfig.whatsapp.mensajePedido}</textarea>
                                <small style="color: #666; margin-top: 5px; display: block;">
                                    Variables disponibles: {cliente}, {numero}, {fecha}, {total}, {productos}
                                </small>
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="saveWhatsappConfig()">Guardar Configuración</button>
                        <button type="button" class="btn btn-secondary" onclick="testWhatsappMessage()">🧪 Probar Mensaje</button>
                    </form>
                </div>
            </div>

            <!-- Respaldo y Restauración -->
            <div class="config-section">
                <h3>💾 Respaldo y Restauración</h3>
                <div class="config-card">
                    <h4>Gestión de Datos</h4>
                    <p>Última actualización: <strong id="lastUpdateTime">${new Date().toLocaleString('es-AR')}</strong></p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                        <div class="stat-card">
                            <div class="stat-number">${clientes.length}</div>
                            <div class="stat-label">Clientes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${pedidos.length}</div>
                            <div class="stat-label">Pedidos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${Object.keys(usuarios).length}</div>
                            <div class="stat-label">Usuarios</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn" onclick="showBackupManager()">💾 Administrador de Respaldos</button>
                        <button class="btn btn-secondary" onclick="createManualBackup()">📥 Respaldo Manual</button>
                        <button class="btn btn-secondary" onclick="exportFullBackup()">📥 Exportar Completo</button>
                        <button class="btn btn-secondary" onclick="importBackup()">📤 Importar Respaldo</button>
                        <button class="btn btn-secondary" onclick="clearAllData()" style="background: #f44336;">🗑️ Limpiar Todos los Datos</button>
                    </div>
                </div>
            </div>

            <!-- Sincronización Firebase -->
            <div class="config-section">
                <h3>☁️ Sincronización en la Nube</h3>
                <div class="config-card">
                    <h4>Firebase (Opcional)</h4>
                    <p>Estado: <span id="firebase-config-status">🟡 Verificando...</span></p>
                    <div style="margin: 15px 0;">
                        <p><strong>Características:</strong></p>
                        <ul style="margin-left: 20px; line-height: 1.6;">
                            <li>Sincronización automática entre dispositivos</li>
                            <li>Respaldo en la nube</li>
                            <li>Acceso desde múltiples ubicaciones</li>
                            <li>Resolución automática de conflictos</li>
                        </ul>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="enableFirebaseSync()">🔄 Activar Sincronización</button>
                        <button class="btn btn-secondary" onclick="disableFirebaseSync()">⏸️ Pausar Sincronización</button>
                        <button class="btn btn-secondary" onclick="forceFirebaseSync()">⚡ Forzar Sincronización</button>
                    </div>
                    <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 5px; color: #856404;">
                        <strong>💡 Nota:</strong> Para usar Firebase, configure sus credenciales en <code>firebase-config.js</code>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// GESTIÓN DE VENDEDORES
// ============================================
function createVendedoresList() {
    let html = '';
    
    Object.entries(usuarios).forEach(([username, user]) => {
        if (user.rol === 'vendedor') {
            const clientesAsignados = clientes.filter(c => c.vendedor === user.vendedor).length;
            const pedidosRealizados = pedidos.filter(p => p.vendedorAsignado === user.vendedor).length;
            
            html += `
                <div class="vendedor-item">
                    <div>
                        <strong>${user.nombre}</strong> (${username})<br>
                        <small>${clientesAsignados} clientes • ${pedidosRealizados} pedidos</small>
                    </div>
                    <div>
                        <button class="btn btn-small btn-secondary" onclick="editVendedor('${username}')">✏️ Editar</button>
                        <button class="btn btn-small btn-secondary" onclick="deleteVendedor('${username}')" style="background: #f44336;">🗑️ Eliminar</button>
                    </div>
                </div>
            `;
        }
    });
    
    return html || '<p>No hay vendedores registrados.</p>';
}

function showAddVendedorForm() {
    const form = `
        <div id="vendedorFormOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 100%;">
                <h3>Agregar Nuevo Vendedor</h3>
                <form id="addVendedorForm">
                    <div class="form-group">
                        <label>Nombre del Vendedor</label>
                        <input type="text" id="newVendedorNombre" required placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="form-group">
                        <label>Nombre de Usuario</label>
                        <input type="text" id="newVendedorUsername" required placeholder="Ej: jperez" pattern="[a-zA-Z0-9]+">
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="newVendedorPassword" required minlength="6">
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn" onclick="saveNewVendedor()">Guardar</button>
                        <button type="button" class="btn btn-secondary" onclick="closeVendedorForm()">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', form);
}

function saveNewVendedor() {
    const nombre = document.getElementById('newVendedorNombre').value.trim();
    const username = document.getElementById('newVendedorUsername').value.trim();
    const password = document.getElementById('newVendedorPassword').value;
    
    if (!nombre || !username || !password) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    if (usuarios[username]) {
        alert('Ya existe un usuario con ese nombre');
        return;
    }
    
    // Agregar nuevo vendedor
    usuarios[username] = {
        password: password,
        nombre: nombre,
        rol: 'vendedor',
        vendedor: nombre
    };
    
    saveData();
    closeVendedorForm();
    loadConfiguracion(); // Recargar configuración
    
    showSuccess(`Vendedor "${nombre}" agregado exitosamente`);
}

function closeVendedorForm() {
    const overlay = document.getElementById('vendedorFormOverlay');
    if (overlay) overlay.remove();
}

function deleteVendedor(username) {
    const vendedor = usuarios[username];
    if (!vendedor) return;
    
    const clientesAsignados = clientes.filter(c => c.vendedor === vendedor.vendedor).length;
    
    let confirmMessage = `¿Está seguro de eliminar al vendedor "${vendedor.nombre}"?`;
    if (clientesAsignados > 0) {
        confirmMessage += `\n\nATENCIÓN: Tiene ${clientesAsignados} clientes asignados. Estos clientes quedarán sin vendedor asignado.`;
    }
    
    if (confirm(confirmMessage)) {
        delete usuarios[username];
        saveData();
        loadConfiguracion();
        showSuccess(`Vendedor "${vendedor.nombre}" eliminado exitosamente`);
    }
}

// ============================================
// CONFIGURACIONES ESPECÍFICAS
// ============================================
function saveEmpresaConfig() {
    systemConfig.empresa = {
        nombre: document.getElementById('empresaNombre').value,
        direccion: document.getElementById('empresaDireccion').value,
        telefono: document.getElementById('empresaTelefono').value,
        email: document.getElementById('empresaEmail').value,
        instagram: document.getElementById('empresaInstagram').value
    };
    
    localStorage.setItem('felder_system_config', JSON.stringify(systemConfig));
    showSuccess('Configuración de empresa guardada exitosamente');
}

function saveRepartoConfig() {
    const diasChecked = Array.from(document.querySelectorAll('#repartoConfigForm input[type="checkbox"]:checked'))
                            .map(cb => parseInt(cb.value));
    
    systemConfig.reparto = {
        horaInicio: document.getElementById('repartoHoraInicio').value,
        capacidadMaxima: parseInt(document.getElementById('repartoCapacidad').value),
        zonaEntrega: document.getElementById('repartoZonas').value.split(',').map(z => z.trim()),
        diasPermitidos: diasChecked,
        costoEnvasadoVacio: systemConfig.reparto.costoEnvasadoVacio
    };
    
    localStorage.setItem('felder_system_config', JSON.stringify(systemConfig));
    
    // Regenerar fechas de entrega con nueva configuración
    generateDeliveryDates();
    
    showSuccess('Configuración de reparto guardada exitosamente');
}

function saveWhatsappConfig() {
    systemConfig.whatsapp = {
        numeroEmpresa: document.getElementById('whatsappNumero').value,
        mensajePedido: document.getElementById('whatsappMensaje').value
    };
    
    localStorage.setItem('felder_system_config', JSON.stringify(systemConfig));
    showSuccess('Configuración de WhatsApp guardada exitosamente');
}

// ============================================
// RESPALDO Y RESTAURACIÓN
// ============================================
function exportFullBackup() {
    try {
        const backupData = {
            clientes: clientes,
            pedidos: pedidos,
            usuarios: usuarios,
            systemConfig: systemConfig,
            productData: window.productData,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `felder-backup-completo-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSuccess('Respaldo completo exportado exitosamente');
    } catch (error) {
        showError('Error al crear respaldo: ' + error.message);
    }
}

function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (confirm('¿Está seguro de restaurar este respaldo? Esto sobrescribirá todos los datos actuales.')) {
                    // Restaurar datos
                    if (backupData.clientes) clientes = backupData.clientes;
                    if (backupData.pedidos) pedidos = backupData.pedidos;
                    if (backupData.usuarios) usuarios = backupData.usuarios;
                    if (backupData.systemConfig) systemConfig = backupData.systemConfig;
                    if (backupData.productData) window.productData = backupData.productData;
                    
                    // Guardar en localStorage
                    saveData();
                    localStorage.setItem('felder_system_config', JSON.stringify(systemConfig));
                    
                    // Recargar página
                    showSuccess('Respaldo restaurado exitosamente. La página se recargará...');
                    setTimeout(() => location.reload(), 2000);
                }
            } catch (error) {
                showError('Error al importar respaldo: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    const confirmation = prompt('Esta acción eliminará TODOS los datos del sistema.\n\nPara continuar, escriba "ELIMINAR TODO":');
    
    if (confirmation === 'ELIMINAR TODO') {
        localStorage.clear();
        showSuccess('Todos los datos han sido eliminados. La página se recargará...');
        setTimeout(() => location.reload(), 2000);
    }
}

// ============================================
// CARGAR CONFIGURACIÓN GUARDADA
// ============================================
function loadSavedConfig() {
    try {
        const savedConfig = localStorage.getItem('felder_system_config');
        if (savedConfig) {
            systemConfig = { ...systemConfig, ...JSON.parse(savedConfig) };
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

// ============================================
// ESTADÍSTICAS DEL SISTEMA
// ============================================
function loadEstadisticas() {
    if (currentUser?.rol !== 'admin') {
        document.getElementById('statsContent').innerHTML = `
            <div class="permission-notice">
                ⚠️ Solo los administradores pueden acceder a las estadísticas del sistema.
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('statsContent');
    container.innerHTML = createStatsInterface();
}

function createStatsInterface() {
    const totalClientes = clientes.length;
    const totalPedidos = pedidos.length;
    const montoTotal = pedidos.reduce((sum, p) => sum + p.total, 0);
    const promedioMensual = montoTotal / Math.max(1, new Date().getMonth() + 1);
    
    // Estadísticas por vendedor
    const statsByVendedor = {};
    Object.values(usuarios).forEach(user => {
        if (user.rol === 'vendedor') {
            const clientesVendedor = clientes.filter(c => c.vendedor === user.vendedor);
            const pedidosVendedor = pedidos.filter(p => p.vendedorAsignado === user.vendedor);
            const montoVendedor = pedidosVendedor.reduce((sum, p) => sum + p.total, 0);
            
            statsByVendedor[user.vendedor] = {
                clientes: clientesVendedor.length,
                pedidos: pedidosVendedor.length,
                monto: montoVendedor
            };
        }
    });
    
    return `
        <h2>📊 Estadísticas del Sistema</h2>
        
        <!-- Estadísticas Generales -->
        <div class="resumen-cards">
            <div class="stat-card">
                <div class="stat-number">${totalClientes}</div>
                <div class="stat-label">Total Clientes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalPedidos}</div>
                <div class="stat-label">Total Pedidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${montoTotal.toLocaleString('es-AR')}</div>
                <div class="stat-label">Monto Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${promedioMensual.toLocaleString('es-AR')}</div>
                <div class="stat-label">Promedio Mensual</div>
            </div>
        </div>

        <!-- Estadísticas por Vendedor -->
        <div style="margin: 30px 0;">
            <h3>Rendimiento por Vendedor</h3>
            ${Object.entries(statsByVendedor).map(([vendedor, stats]) => `
                <div class="client-card" style="margin-bottom: 15px;">
                    <h4>${vendedor}</h4>
                    <div class="resumen-cards" style="margin-top: 15px;">
                        <div class="stat-card">
                            <div class="stat-number">${stats.clientes}</div>
                            <div class="stat-label">Clientes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.pedidos}</div>
                            <div class="stat-label">Pedidos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">$${stats.monto.toLocaleString('es-AR')}</div>
                            <div class="stat-label">Monto Total</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">$${stats.clientes > 0 ? (stats.monto / stats.clientes).toLocaleString('es-AR') : '0'}</div>
                            <div class="stat-label">Promedio por Cliente</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración guardada al inicio
    loadSavedConfig();
});

// ============================================
// FUNCIONES ADICIONALES FALTANTES
// ============================================

// Administrar productos
function showProductManager() {
    const productManagerHtml = `
        <div id="productManagerOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; overflow-y: auto; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 1000px; margin: 20px auto;">
                <h2>📝 Administrador de Productos</h2>
                
                <div style="margin: 20px 0;">
                    <button class="btn btn-secondary" onclick="addNewProduct()">➕ Agregar Producto</button>
                    <button class="btn btn-secondary" onclick="bulkEditPrices()">💰 Editar Precios Masivo</button>
                    <button class="btn btn-secondary" onclick="closeProductManager()">❌ Cerrar</button>
                </div>
                
                <div id="productManagerContent">
                    ${createProductManagerContent()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', productManagerHtml);
}

function createProductManagerContent() {
    let html = '';
    
    Object.entries(window.productData).forEach(([categoria, productos]) => {
        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #d32f2f; margin-bottom: 15px;">${categoria.toUpperCase()}</h3>
                ${productos.map(producto => `
                    <div class="producto-config-item">
                        <input type="text" value="${producto.nombre}" onchange="updateProductName('${categoria}', '${producto.nombre}', this.value)">
                        <input type="number" value="${producto.precio}" onchange="updateProductPrice('${categoria}', '${producto.nombre}', this.value)">
                        <input type="text" value="${producto.unidad}" onchange="updateProductUnit('${categoria}', '${producto.nombre}', this.value)">
                        <input type="text" value="${producto.presentacion}" onchange="updateProductPresentation('${categoria}', '${producto.nombre}', this.value)">
                        <button class="btn btn-small" onclick="deleteProduct('${categoria}', '${producto.nombre}')" style="background: #f44336;">🗑️</button>
                    </div>
                `).join('')}
            </div>
        `;
    });
    
    return html;
}

function updateProductName(categoria, oldName, newName) {
    if (!newName.trim()) return;
    
    const productos = window.productData[categoria];
    const producto = productos.find(p => p.nombre === oldName);
    if (producto) {
        producto.nombre = newName;
        saveProductData();
    }
}

function updateProductPrice(categoria, nombre, newPrice) {
    const precio = parseFloat(newPrice);
    if (isNaN(precio) || precio < 0) return;
    
    const productos = window.productData[categoria];
    const producto = productos.find(p => p.nombre === nombre);
    if (producto) {
        producto.precio = precio;
        saveProductData();
    }
}

function updateProductUnit(categoria, nombre, newUnit) {
    if (!newUnit.trim()) return;
    
    const productos = window.productData[categoria];
    const producto = productos.find(p => p.nombre === nombre);
    if (producto) {
        producto.unidad = newUnit;
        saveProductData();
    }
}

function updateProductPresentation(categoria, nombre, newPresentation) {
    const productos = window.productData[categoria];
    const producto = productos.find(p => p.nombre === nombre);
    if (producto) {
        producto.presentacion = newPresentation;
        saveProductData();
    }
}

function deleteProduct(categoria, nombre) {
    if (confirm(`¿Eliminar el producto "${nombre}"?`)) {
        window.productData[categoria] = window.productData[categoria].filter(p => p.nombre !== nombre);
        saveProductData();
        
        // Recargar interfaz
        document.getElementById('productManagerContent').innerHTML = createProductManagerContent();
    }
}

function closeProductManager() {
    const overlay = document.getElementById('productManagerOverlay');
    if (overlay) overlay.remove();
}

function saveProductData() {
    localStorage.setItem('felder_product_data', JSON.stringify(window.productData));
    showSuccess('Productos actualizados exitosamente');
}

// Exportar catálogo
function exportCatalog() {
    try {
        const catalogData = {
            productos: window.productData,
            empresa: systemConfig.empresa,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(catalogData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `felder-catalogo-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSuccess('Catálogo exportado exitosamente');
    } catch (error) {
        showError('Error al exportar catálogo: ' + error.message);
    }
}

// Importar catálogo
function importCatalog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const catalogData = JSON.parse(e.target.result);
                
                if (confirm('¿Importar este catálogo? Esto sobrescribirá el catálogo actual.')) {
                    if (catalogData.productos) {
                        window.productData = catalogData.productos;
                        saveProductData();
                        showSuccess('Catálogo importado exitosamente');
                    }
                }
            } catch (error) {
                showError('Error al importar catálogo: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Editar vendedor
function editVendedor(username) {
    const vendedor = usuarios[username];
    if (!vendedor) return;
    
    const newName = prompt('Nuevo nombre del vendedor:', vendedor.nombre);
    if (newName && newName.trim()) {
        vendedor.nombre = newName.trim();
        vendedor.vendedor = newName.trim();
        
        // Actualizar clientes asignados
        clientes.forEach(cliente => {
            if (cliente.vendedor === vendedor.vendedor) {
                cliente.vendedor = newName.trim();
            }
        });
        
        saveData();
        loadConfiguracion();
        showSuccess(`Vendedor actualizado a: ${newName}`);
    }
}

// Reporte de vendedores
function exportVendedoresReport() {
    const reportData = [];
    
    Object.entries(usuarios).forEach(([username, user]) => {
        if (user.rol === 'vendedor') {
            const clientesAsignados = clientes.filter(c => c.vendedor === user.vendedor);
            const pedidosRealizados = pedidos.filter(p => p.vendedorAsignado === user.vendedor);
            const montoTotal = pedidosRealizados.reduce((sum, p) => sum + p.total, 0);
            
            reportData.push({
                usuario: username,
                nombre: user.nombre,
                clientesAsignados: clientesAsignados.length,
                pedidosRealizados: pedidosRealizados.length,
                montoTotal: montoTotal,
                promedioMensual: montoTotal / Math.max(1, new Date().getMonth() + 1)
            });
        }
    });
    
    // Crear CSV
    const csvContent = [
        ['Usuario', 'Nombre', 'Clientes', 'Pedidos', 'Monto Total', 'Promedio Mensual'],
        ...reportData.map(row => [
            row.usuario,
            row.nombre,
            row.clientesAsignados,
            row.pedidosRealizados,
            row.montoTotal,
            row.promedioMensual.toFixed(2)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-vendedores-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Reporte de vendedores exportado exitosamente');
}

// Probar mensaje de WhatsApp
function testWhatsappMessage() {
    const mensaje = document.getElementById('whatsappMensaje').value;
    const numero = document.getElementById('whatsappNumero').value;
    
    // Datos de prueba
    const datosTest = {
        cliente: 'Cliente de Prueba',
        numero: 'TEST001',
        fecha: new Date().toLocaleDateString('es-AR'),
        total: '$12,500',
        productos: '• Bondiola - 2 kg\n• Salame Tradicional - 1 kg'
    };
    
    // Reemplazar variables
    let mensajeFinal = mensaje;
    Object.entries(datosTest).forEach(([key, value]) => {
        mensajeFinal = mensajeFinal.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    
    // Mostrar preview
    alert(`Vista previa del mensaje:\n\n${mensajeFinal}`);
    
    // Opción de enviar de prueba
    if (confirm('¿Enviar mensaje de prueba a WhatsApp?')) {
        const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(mensajeFinal)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// Edición masiva de precios
function bulkEditPrices() {
    const percentage = prompt('Ingrese el porcentaje de ajuste (ej: 10 para aumentar 10%, -5 para reducir 5%):');
    if (!percentage) return;
    
    const factor = 1 + (parseFloat(percentage) / 100);
    if (isNaN(factor)) {
        alert('Porcentaje inválido');
        return;
    }
    
    if (confirm(`¿Aplicar ${percentage}% de ajuste a TODOS los productos?`)) {
        let productosActualizados = 0;
        
        Object.values(window.productData).forEach(productos => {
            productos.forEach(producto => {
                const nuevoPrecio = Math.round(producto.precio * factor);
                if (nuevoPrecio > 0) {
                    producto.precio = nuevoPrecio;
                    productosActualizados++;
                }
            });
        });
        
        saveProductData();
        showSuccess(`${productosActualizados} productos actualizados con ${percentage}% de ajuste`);
        
        // Recargar interfaz si está abierta
        const content = document.getElementById('productManagerContent');
        if (content) {
            content.innerHTML = createProductManagerContent();
        }
    }
}

// Agregar nuevo producto
function addNewProduct() {
    const categoria = prompt('Categoría (salazones, fermentados, embutidos, fiambres, frescos, elaborados):');
    if (!categoria || !window.productData[categoria]) {
        alert('Categoría inválida');
        return;
    }
    
    const nombre = prompt('Nombre del producto:');
    if (!nombre) return;
    
    const precio = prompt('Precio:');
    if (!precio || isNaN(parseFloat(precio))) {
        alert('Precio inválido');
        return;
    }
    
    const unidad = prompt('Unidad (kg, unidad, etc.):') || 'kg';
    const presentacion = prompt('Presentación:') || '';
    
    const nuevoProducto = {
        nombre: nombre,
        precio: parseFloat(precio),
        unidad: unidad,
        presentacion: presentacion,
        categoria: categoria
    };
    
    window.productData[categoria].push(nuevoProducto);
    saveProductData();
    
    // Recargar interfaz
    const content = document.getElementById('productManagerContent');
    if (content) {
        content.innerHTML = createProductManagerContent();
    }
    
    showSuccess(`Producto "${nombre}" agregado exitosamente`);
}

// Exponer funciones globalmente - COMPLETAR LISTA
window.loadConfiguracion = loadConfiguracion;
window.loadEstadisticas = loadEstadisticas;
window.showAddVendedorForm = showAddVendedorForm;
window.saveNewVendedor = saveNewVendedor;
window.closeVendedorForm = closeVendedorForm;
window.editVendedor = editVendedor;
window.deleteVendedor = deleteVendedor;
window.saveEmpresaConfig = saveEmpresaConfig;
window.saveRepartoConfig = saveRepartoConfig;
window.saveWhatsappConfig = saveWhatsappConfig;
window.exportFullBackup = exportFullBackup;
window.importBackup = importBackup;
window.clearAllData = clearAllData;
window.showProductManager = showProductManager;
window.closeProductManager = closeProductManager;
window.exportCatalog = exportCatalog;
window.importCatalog = importCatalog;
window.exportVendedoresReport = exportVendedoresReport;
window.testWhatsappMessage = testWhatsappMessage;
window.bulkEditPrices = bulkEditPrices;
window.addNewProduct = addNewProduct;
window.updateProductName = updateProductName;
window.updateProductPrice = updateProductPrice;
window.updateProductUnit = updateProductUnit;
window.updateProductPresentation = updateProductPresentation;
window.deleteProduct = deleteProduct;

console.log('Sistema de configuración cargado completamente');