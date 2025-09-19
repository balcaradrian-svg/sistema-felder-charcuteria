// ============================================
// SISTEMA DE RESPALDO AUTOMÁTICO - FELDER
// ============================================

// Variables de configuración del respaldo
let backupConfig = {
    autoBackupEnabled: true,
    backupInterval: 24, // horas
    maxBackups: 7, // máximo número de respaldos a mantener
    includeProductData: true,
    includeUserData: false, // por seguridad
    backupLocation: 'localStorage' // localStorage o download
};

// Variables de control
let backupTimer = null;
let lastBackupTime = null;

// ============================================
// RESPALDO AUTOMÁTICO
// ============================================
function initAutoBackup() {
    // Cargar configuración guardada
    loadBackupConfig();
    
    // Obtener último respaldo
    lastBackupTime = localStorage.getItem('felder_last_backup');
    
    // Verificar si necesita respaldo
    if (shouldCreateBackup()) {
        createAutoBackup();
    }
    
    // Configurar timer para respaldos automáticos
    if (backupConfig.autoBackupEnabled) {
        scheduleNextBackup();
    }
    
    console.log('Sistema de respaldo automático inicializado');
}

function shouldCreateBackup() {
    if (!lastBackupTime) return true;
    
    const lastBackup = new Date(lastBackupTime);
    const now = new Date();
    const hoursSinceLastBackup = (now - lastBackup) / (1000 * 60 * 60);
    
    return hoursSinceLastBackup >= backupConfig.backupInterval;
}

function scheduleNextBackup() {
    // Limpiar timer anterior
    if (backupTimer) {
        clearTimeout(backupTimer);
    }
    
    // Programar próximo respaldo
    const intervalMs = backupConfig.backupInterval * 60 * 60 * 1000; // convertir a milisegundos
    
    backupTimer = setTimeout(() => {
        createAutoBackup();
        scheduleNextBackup(); // Reprogramar siguiente
    }, intervalMs);
}

// ============================================
// CREACIÓN DE RESPALDOS
// ============================================
function createAutoBackup() {
    try {
        const backupData = generateBackupData();
        const backupKey = `felder_backup_${Date.now()}`;
        
        // Guardar respaldo
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        // Actualizar tiempo del último respaldo
        const now = new Date().toISOString();
        localStorage.setItem('felder_last_backup', now);
        lastBackupTime = now;
        
        // Limpiar respaldos antiguos
        cleanOldBackups();
        
        console.log('Respaldo automático creado:', backupKey);
        
        // Mostrar notificación discreta
        showBackupNotification('Respaldo automático creado exitosamente');
        
    } catch (error) {
        console.error('Error creando respaldo automático:', error);
        showBackupNotification('Error en respaldo automático', 'error');
    }
}

function generateBackupData() {
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'auto',
        data: {
            clientes: clientes,
            pedidos: pedidos,
            counters: {
                clienteIdCounter: clienteIdCounter,
                pedidoIdCounter: pedidoIdCounter
            }
        }
    };
    
    // Incluir datos de productos si está habilitado
    if (backupConfig.includeProductData) {
        backupData.data.productData = window.productData;
    }
    
    // Incluir configuración del sistema
    const systemConfig = localStorage.getItem('felder_system_config');
    if (systemConfig) {
        backupData.data.systemConfig = JSON.parse(systemConfig);
    }
    
    // NO incluir datos de usuarios por seguridad (a menos que esté habilitado)
    if (backupConfig.includeUserData) {
        backupData.data.usuarios = usuarios;
    }
    
    return backupData;
}

function cleanOldBackups() {
    try {
        // Obtener todas las claves de respaldo
        const backupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('felder_backup_')) {
                backupKeys.push({
                    key: key,
                    timestamp: parseInt(key.split('_')[2])
                });
            }
        }
        
        // Ordenar por timestamp (más reciente primero)
        backupKeys.sort((a, b) => b.timestamp - a.timestamp);
        
        // Eliminar respaldos antiguos
        for (let i = backupConfig.maxBackups; i < backupKeys.length; i++) {
            localStorage.removeItem(backupKeys[i].key);
            console.log('Respaldo antiguo eliminado:', backupKeys[i].key);
        }
        
    } catch (error) {
        console.error('Error limpiando respaldos antiguos:', error);
    }
}

// ============================================
// RESPALDO MANUAL
// ============================================
function createManualBackup() {
    try {
        const backupData = generateBackupData();
        backupData.type = 'manual';
        backupData.createdBy = currentUser?.nombre || 'Usuario desconocido';
        
        // Descargar como archivo
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `felder-respaldo-manual-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showBackupNotification('Respaldo manual creado y descargado exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error creando respaldo manual:', error);
        showBackupNotification('Error creando respaldo manual: ' + error.message, 'error');
        return false;
    }
}

// ============================================
// RESTAURACIÓN DE RESPALDOS
// ============================================
function listAvailableBackups() {
    const backups = [];
    
    try {
        // Buscar respaldos en localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('felder_backup_')) {
                const backupData = JSON.parse(localStorage.getItem(key));
                backups.push({
                    key: key,
                    timestamp: backupData.timestamp,
                    type: backupData.type,
                    size: new Blob([localStorage.getItem(key)]).size
                });
            }
        }
        
        // Ordenar por timestamp (más reciente primero)
        backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
    } catch (error) {
        console.error('Error listando respaldos:', error);
    }
    
    return backups;
}

function restoreFromBackup(backupKey) {
    try {
        const backupDataStr = localStorage.getItem(backupKey);
        if (!backupDataStr) {
            throw new Error('Respaldo no encontrado');
        }
        
        const backupData = JSON.parse(backupDataStr);
        
        if (confirm(`¿Restaurar respaldo del ${new Date(backupData.timestamp).toLocaleString('es-AR')}?\n\nEsto sobrescribirá todos los datos actuales.`)) {
            
            // Restaurar datos
            if (backupData.data.clientes) {
                clientes = backupData.data.clientes;
            }
            
            if (backupData.data.pedidos) {
                pedidos = backupData.data.pedidos;
            }
            
            if (backupData.data.counters) {
                clienteIdCounter = backupData.data.counters.clienteIdCounter || 1;
                pedidoIdCounter = backupData.data.counters.pedidoIdCounter || 1;
            }
            
            if (backupData.data.productData) {
                window.productData = backupData.data.productData;
            }
            
            if (backupData.data.systemConfig) {
                localStorage.setItem('felder_system_config', JSON.stringify(backupData.data.systemConfig));
            }
            
            if (backupData.data.usuarios) {
                usuarios = backupData.data.usuarios;
            }
            
            // Guardar datos restaurados
            saveData();
            
            showBackupNotification('Respaldo restaurado exitosamente. La página se recargará...');
            
            // Recargar página después de 2 segundos
            setTimeout(() => {
                location.reload();
            }, 2000);
            
            return true;
        }
        
    } catch (error) {
        console.error('Error restaurando respaldo:', error);
        showBackupNotification('Error restaurando respaldo: ' + error.message, 'error');
        return false;
    }
}

function importBackupFile() {
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
                
                // Validar estructura del respaldo
                if (!backupData.data || !backupData.timestamp) {
                    throw new Error('Archivo de respaldo inválido');
                }
                
                if (confirm(`¿Restaurar respaldo del ${new Date(backupData.timestamp).toLocaleString('es-AR')}?\n\nEsto sobrescribirá todos los datos actuales.`)) {
                    
                    // Usar la misma lógica de restauración
                    const tempKey = `temp_backup_${Date.now()}`;
                    localStorage.setItem(tempKey, JSON.stringify(backupData));
                    
                    const success = restoreFromBackup(tempKey);
                    
                    // Limpiar archivo temporal
                    localStorage.removeItem(tempKey);
                    
                    if (success) {
                        showBackupNotification('Archivo de respaldo importado y restaurado exitosamente');
                    }
                }
                
            } catch (error) {
                showBackupNotification('Error importando archivo: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// CONFIGURACIÓN DEL RESPALDO
// ============================================
function loadBackupConfig() {
    try {
        const savedConfig = localStorage.getItem('felder_backup_config');
        if (savedConfig) {
            backupConfig = { ...backupConfig, ...JSON.parse(savedConfig) };
        }
    } catch (error) {
        console.error('Error cargando configuración de respaldo:', error);
    }
}

function saveBackupConfig() {
    try {
        localStorage.setItem('felder_backup_config', JSON.stringify(backupConfig));
        console.log('Configuración de respaldo guardada');
    } catch (error) {
        console.error('Error guardando configuración de respaldo:', error);
    }
}

function updateBackupConfig(newConfig) {
    backupConfig = { ...backupConfig, ...newConfig };
    saveBackupConfig();
    
    // Reprogramar respaldos si cambió la configuración
    if (backupConfig.autoBackupEnabled) {
        scheduleNextBackup();
    } else if (backupTimer) {
        clearTimeout(backupTimer);
        backupTimer = null;
    }
}

// ============================================
// INTERFAZ DE RESPALDO
// ============================================
function showBackupManager() {
    const backups = listAvailableBackups();
    
    const backupManagerHtml = `
        <div id="backupManagerOverlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; overflow-y: auto; padding: 20px;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 800px; margin: 20px auto;">
                <h2>💾 Administrador de Respaldos</h2>
                
                <div style="margin: 20px 0;">
                    <button class="btn" onclick="createManualBackup()">📥 Crear Respaldo Manual</button>
                    <button class="btn btn-secondary" onclick="importBackupFile()">📤 Importar Respaldo</button>
                    <button class="btn btn-secondary" onclick="closeBackupManager()">❌ Cerrar</button>
                </div>
                
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>⚙️ Configuración Automática</h3>
                    <div style="margin: 15px 0;">
                        <label>
                            <input type="checkbox" ${backupConfig.autoBackupEnabled ? 'checked' : ''} onchange="toggleAutoBackup(this.checked)">
                            Respaldo automático habilitado
                        </label>
                    </div>
                    <div style="margin: 15px 0;">
                        <label>Intervalo (horas): 
                            <input type="number" value="${backupConfig.backupInterval}" min="1" max="168" onchange="updateBackupInterval(this.value)" style="width: 80px; margin-left: 10px;">
                        </label>
                    </div>
                    <div style="margin: 15px 0;">
                        <label>Máximo respaldos: 
                            <input type="number" value="${backupConfig.maxBackups}" min="1" max="30" onchange="updateMaxBackups(this.value)" style="width: 80px; margin-left: 10px;">
                        </label>
                    </div>
                    ${lastBackupTime ? `<p><strong>Último respaldo:</strong> ${new Date(lastBackupTime).toLocaleString('es-AR')}</p>` : ''}
                </div>
                
                <h3>📋 Respaldos Disponibles</h3>
                <div style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
                    ${backups.length === 0 ? '<p>No hay respaldos disponibles</p>' : 
                        backups.map(backup => `
                            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${backup.type === 'auto' ? '🔄 Automático' : '👤 Manual'}</strong><br>
                                        <small>${new Date(backup.timestamp).toLocaleString('es-AR')}</small><br>
                                        <small>Tamaño: ${(backup.size / 1024).toFixed(1)} KB</small>
                                    </div>
                                    <div>
                                        <button class="btn btn-small btn-secondary" onclick="restoreFromBackup('${backup.key}')">🔄 Restaurar</button>
                                        <button class="btn btn-small" onclick="deleteBackup('${backup.key}')" style="background: #f44336;">🗑️ Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', backupManagerHtml);
}

function closeBackupManager() {
    const overlay = document.getElementById('backupManagerOverlay');
    if (overlay) overlay.remove();
}

function deleteBackup(backupKey) {
    if (confirm('¿Eliminar este respaldo permanentemente?')) {
        localStorage.removeItem(backupKey);
        showBackupNotification('Respaldo eliminado');
        
        // Recargar interfaz
        closeBackupManager();
        showBackupManager();
    }
}

function toggleAutoBackup(enabled) {
    updateBackupConfig({ autoBackupEnabled: enabled });
    showBackupNotification(enabled ? 'Respaldo automático habilitado' : 'Respaldo automático deshabilitado');
}

function updateBackupInterval(hours) {
    const interval = parseInt(hours);
    if (interval >= 1 && interval <= 168) {
        updateBackupConfig({ backupInterval: interval });
        showBackupNotification(`Intervalo actualizado a ${interval} horas`);
    }
}

function updateMaxBackups(max) {
    const maxBackups = parseInt(max);
    if (maxBackups >= 1 && maxBackups <= 30) {
        updateBackupConfig({ maxBackups: maxBackups });
        cleanOldBackups(); // Limpiar inmediatamente si es necesario
        showBackupNotification(`Máximo de respaldos actualizado a ${maxBackups}`);
    }
}

// ============================================
// NOTIFICACIONES
// ============================================
function showBackupNotification(message, type = 'success') {
    // Crear notificación discreta
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4caf50'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// ============================================
// INICIALIZACIÓN Y EXPORTACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistema de respaldo después de que se carguen los datos
    setTimeout(initAutoBackup, 3000);
});

// Exponer funciones globalmente
window.createManualBackup = createManualBackup;
window.showBackupManager = showBackupManager;
window.closeBackupManager = closeBackupManager;
window.restoreFromBackup = restoreFromBackup;
window.importBackupFile = importBackupFile;
window.deleteBackup = deleteBackup;
window.toggleAutoBackup = toggleAutoBackup;
window.updateBackupInterval = updateBackupInterval;
window.updateMaxBackups = updateMaxBackups;
window.listAvailableBackups = listAvailableBackups;

console.log('Sistema de respaldo automático cargado');