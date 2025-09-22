// ============================================
// CONFIGURACIÓN FIREBASE - OPCIONAL
// ============================================

// Variables globales de Firebase - DECLARAR PRIMERO
let db = null;
let firebaseInitialized = false;
let syncEnabled = false;

// Configuración de Firebase (reemplazar con tus datos)
const firebaseConfig = {
    apiKey: "AIzaSyA5AkYEUuIfEduqN62DlxfBD6P1xdH_yLI",
    authDomain: "felder-charcuteria.firebaseapp.com",
    projectId: "felder-charcuteria",
    storageBucket: "felder-charcuteria.firebasestorage.app",
    messagingSenderId: "986050632352",
    appId: "1:986050632352:web:c11f66f28fde25155807c5"
};

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
        
        // Actualizar estado en la UI
        const statusElement = document.getElementById('firebase-config-status');
        if (statusElement) {
            statusElement.innerHTML = '🟢 Conectado';
        }
        
        // Configurar sincronización en tiempo real
        setupRealtimeSync();
        
        return true;
    } catch (error) {
        console.error('Error inicializando Firebase:', error);
        
        // Actualizar estado en la UI
        const statusElement = document.getElementById('firebase-config-status');
        if (statusElement) {
            statusElement.innerHTML = '🔴 Error de conexión';
        }
        
        return false;
    }
}

// El resto del código permanece igual pero asegurándose de que las variables estén declaradas al inicio...
// [Incluir el resto del archivo firebase.js aquí con las mismas funciones]