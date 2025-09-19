// ============================================
// CONFIGURACIÓN FIREBASE - OPCIONAL
// ============================================

// Configuración de Firebase (reemplazar con tus datos)
const firebaseConfig = {
    apiKey: "AIzaSyA5AkYEUuIfEduqN62DlxfBD6P1xdH_yLI",
    authDomain: "felder-charcuteria.firebaseapp.com",
    projectId: "felder-charcuteria",
    storageBucket: "felder-charcuteria.firebasestorage.app",
    messagingSenderId: "986050632352",
    appId: "1:986050632352:web:c11f66f28fde25155807c5"

};

// Variables globales de Firebase
let db = null;
let firebaseInitialized = false;
let syncEnabled = false;

// ============================================
// INICIALIZACIÓN DE FIREBASE
// ============================================
function initializeFirebase() {
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK no está cargado');
            return false;
        }
        
        // Verificar si ya está inicializado
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Inicializar Firestore
        db = firebase.firestore();
        firebaseInitialized = true;
        syncEnabled = true;
        
        console.log('Firebase inicializado correctamente');
        
        // Configurar sincronización en tiempo real
        setupRealtimeSync();
        
        return true;
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        return false;
    }
}

// ============================================
// SINCRONIZACIÓN EN TIEMPO REAL
// ============================================
function setupRealtimeSync() {
    if (!firebaseInitialized || !db) return;
    
    try {
        // Sincronizar clientes
        db.collection('clientes').onSnapshot((snapshot) => {
            if (!snapshot.metadata.fromCache) {
                const clientesFromFirebase = [];
                snapshot.forEach((doc) => {
                    clientesFromFirebase.push({ id: doc.id, ...doc.data() });
                });
                
                // Solo actualizar si hay diferencias
                if (JSON.stringify(clientes) !== JSON.stringify(clientesFromFirebase)) {
                    clientes = clientesFromFirebase;
                    console.log('Clientes sincronizados desde Firebase');
                    
                    // Actualizar vistas si están abiertas
                    if (typeof displayAllClients === 'function') displayAllClients();
                    if (typeof loadClientesForPedidos === 'function') loadClientesForPedidos();
                }
            }
        });
        
        // Sincronizar pedidos
        db.collection('pedidos').onSnapshot((snapshot) => {
            if (!snapshot.metadata.fromCache) {
                const pedidosFromFirebase = [];
                snapshot.forEach((doc) => {
                    pedidosFromFirebase.push({ id: doc.id, ...doc.data() });
                });
                
                if (JSON.stringify(pedidos) !== JSON.stringify(pedidosFromFirebase)) {
                    pedidos = pedidosFromFirebase;
                    console.log('Pedidos sincronizados desde Firebase');
                    
                    // Actualizar vistas si están abiertas
                    if (typeof displayAllPedidos === 'function') displayAllPedidos();
                }
            }
        });
        
    } catch (error) {
        console.error('Error configurando sincronización:', error);
    }
}

// ============================================
// SUBIR DATOS A FIREBASE
// ============================================
async function syncToFirebase() {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no está inicializado');
        return false;
    }
    
    try {
        // Subir clientes
        const batch = db.batch();
        
        // Limpiar colección de clientes
        const clientesSnapshot = await db.collection('clientes').get();
        clientesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // Agregar clientes actuales
        clientes.forEach((cliente) => {
            const docRef = db.collection('clientes').doc(cliente.id.toString());
            batch.set(docRef, cliente);
        });
        
        // Limpiar colección de pedidos
        const pedidosSnapshot = await db.collection('pedidos').get();
        pedidosSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // Agregar pedidos actuales
        pedidos.forEach((pedido) => {
            const docRef = db.collection('pedidos').doc(pedido.id.toString());
            batch.set(docRef, pedido);
        });
        
        // Ejecutar batch
        await batch.commit();
        
        console.log('Datos sincronizados a Firebase exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error sincronizando a Firebase:', error);
        return false;
    }
}

// ============================================
// DESCARGAR DATOS DESDE FIREBASE
// ============================================
async function syncFromFirebase() {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no está inicializado');
        return false;
    }
    
    try {
        // Descargar clientes
        const clientesSnapshot = await db.collection('clientes').get();
        const clientesFromFirebase = [];
        clientesSnapshot.forEach((doc) => {
            clientesFromFirebase.push({ id: doc.id, ...doc.data() });
        });
        
        // Descargar pedidos
        const pedidosSnapshot = await db.collection('pedidos').get();
        const pedidosFromFirebase = [];
        pedidosSnapshot.forEach((doc) => {
            pedidosFromFirebase.push({ id: doc.id, ...doc.data() });
        });
        
        // Actualizar datos locales
        clientes = clientesFromFirebase;
        pedidos = pedidosFromFirebase;
        
        // Guardar en localStorage
        saveData();
        
        console.log('Datos descargados desde Firebase exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error descargando desde Firebase:', error);
        return false;
    }
}

// ============================================
// GESTIÓN DE CONFLICTOS
// ============================================
async function resolveConflicts() {
    if (!firebaseInitialized) return;
    
    try {
        // Comparar timestamps y resolver conflictos
        const localTimestamp = localStorage.getItem('felder_last_update') || '0';
        
        // Obtener último timestamp de Firebase
        const metaDoc = await db.collection('meta').doc('lastUpdate').get();
        const firebaseTimestamp = metaDoc.exists ? metaDoc.data().timestamp : '0';
        
        if (firebaseTimestamp > localTimestamp) {
            // Firebase tiene datos más recientes
            console.log('Sincronizando datos más recientes desde Firebase');
            await syncFromFirebase();
        } else if (localTimestamp > firebaseTimestamp) {
            // Local tiene datos más recientes
            console.log('Subiendo datos más recientes a Firebase');
            await syncToFirebase();
            
            // Actualizar timestamp en Firebase
            await db.collection('meta').doc('lastUpdate').set({
                timestamp: new Date().toISOString(),
                updatedBy: currentUser?.nombre || 'Usuario desconocido'
            });
        }
        
        // Actualizar timestamp local
        localStorage.setItem('felder_last_update', new Date().toISOString());
        
    } catch (error) {
        console.error('Error resolviendo conflictos:', error);
    }
}

// ============================================
// ESTADO DE CONEXIÓN
// ============================================
function getFirebaseStatus() {
    return {
        initialized: firebaseInitialized,
        connected: syncEnabled,
        message: firebaseInitialized ? 
            (syncEnabled ? 'Conectado y sincronizando' : 'Inicializado pero sin sincronización') :
            'Firebase no disponible'
    };
}

function showConnectionStatus() {
    const status = getFirebaseStatus();
    const statusElement = document.getElementById('firebase-status');
    
    if (statusElement) {
        statusElement.innerHTML = `
            <span style="color: ${status.connected ? 'green' : 'orange'};">
                ${status.connected ? '🟢' : '🟡'} ${status.message}
            </span>
        `;
    }
}

// ============================================
// INTEGRACIÓN CON FUNCIONES EXISTENTES
// ============================================
function integrateFirebaseWithSaveData() {
    // Modificar la función saveData original para incluir Firebase
    const originalSaveData = window.saveData;
    
    window.saveData = function() {
        // Llamar función original
        if (originalSaveData) {
            originalSaveData();
        }
        
        // Sincronizar con Firebase si está disponible
        if (firebaseInitialized && syncEnabled) {
            syncToFirebase().catch(console.error);
        }
        
        // Actualizar timestamp
        localStorage.setItem('felder_last_update', new Date().toISOString());
    };
}

function integrateFirebaseWithLoadData() {
    // Modificar la función loadData original
    const originalLoadData = window.loadData;
    
    window.loadData = async function() {
        // Llamar función original
        if (originalLoadData) {
            originalLoadData();
        }
        
        // Intentar sincronizar con Firebase
        if (firebaseInitialized) {
            await resolveConflicts();
        }
    };
}

// ============================================
// FUNCIONES DE ADMINISTRACIÓN
// ============================================
async function enableFirebaseSync() {
    const initialized = initializeFirebase();
    if (initialized) {
        await resolveConflicts();
        showSuccess('Sincronización Firebase activada');
    } else {
        showError('No se pudo activar Firebase. Revisa la configuración.');
    }
}

async function disableFirebaseSync() {
    syncEnabled = false;
    showSuccess('Sincronización Firebase desactivada');
}

async function forceFirebaseSync() {
    if (!firebaseInitialized) {
        showError('Firebase no está inicializado');
        return;
    }
    
    try {
        await syncToFirebase();
        showSuccess('Sincronización forzada completada');
    } catch (error) {
        showError('Error en sincronización forzada: ' + error.message);
    }
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Intentar inicializar Firebase
        const initialized = initializeFirebase();
        
        if (initialized) {
            // Integrar Firebase con las funciones existentes
            integrateFirebaseWithSaveData();
            integrateFirebaseWithLoadData();
        }
        
        // Mostrar estado de conexión
        showConnectionStatus();
        
        // Actualizar estado cada 30 segundos
        setInterval(showConnectionStatus, 30000);
        
    }, 2000); // Esperar 2 segundos para que se carguen otros scripts
});

// Exponer funciones globalmente
window.initializeFirebase = initializeFirebase;
window.syncToFirebase = syncToFirebase;
window.syncFromFirebase = syncFromFirebase;
window.getFirebaseStatus = getFirebaseStatus;
window.enableFirebaseSync = enableFirebaseSync;
window.disableFirebaseSync = disableFirebaseSync;
window.forceFirebaseSync = forceFirebaseSync;

console.log('Firebase config cargado - Sistema híbrido online/offline listo');