// ============================================
// VARIABLES GLOBALES
// ============================================
let clientes = [];
let pedidos = [];
let clienteIdCounter = 1;
let pedidoIdCounter = 1;
let currentUser = null;

// Sistema de usuarios (sin mostrar credenciales)
let usuarios = {
    'admin': { password: 'admin123', nombre: 'Administrador', rol: 'admin', vendedor: null },
    'vendedor1': { password: 'vend123', nombre: 'Vendedor 1', rol: 'vendedor', vendedor: 'Vendedor 1' },
    'vendedor2': { password: 'vend123', nombre: 'Vendedor 2', rol: 'vendedor', vendedor: 'Vendedor 2' },
    'vendedor3': { password: 'vend123', nombre: 'Vendedor 3', rol: 'vendedor', vendedor: 'Vendedor 3' }
};

// Base de operaciones de Felder Charcutería
const BASE_FELDER = {
    nombre: "Felder Charcutería y Carnicería",
    direccion: "Av. Almafuerte 5550, Paraná, Entre Ríos",
    coordenadas: { lat: -31.7333, lng: -60.5167 }
};

// ============================================
// INICIALIZACIÓN - CORREGIDO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    generateDeliveryDates();
    
    // Verificar que todos los elementos necesarios existan
    console.log('Elementos verificados:', {
        loginForm: !!document.getElementById('loginForm'),
        clientForm: !!document.getElementById('clientForm'),
        pedidoForm: !!document.getElementById('pedidoForm'),
        searchInput: !!document.getElementById('searchInput'),
        cuitInput: !!document.getElementById('cuit')
    });
    
    console.log('Sistema inicializado correctamente');
});

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Client form
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', handleClientSubmit);
    }

    // Pedido form
    const pedidoForm = document.getElementById('pedidoForm');
    if (pedidoForm) {
        pedidoForm.addEventListener('submit', handlePedidoSubmit);
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }

    // CUIT formatting - CORREGIDO
    const cuitInput = document.getElementById('cuit');
    if (cuitInput) {
        cuitInput.addEventListener('input', formatCUIT);
    }

    // Prevent uppercase transformation - CORREGIDO
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        // Solo aplicar text-transform: none donde sea necesario
        if (!input.style.textTransform) {
            input.style.textTransform = 'none';
        }
    });
}

// ============================================
// AUTENTICACIÓN
// ============================================
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password && usuarios[username] && usuarios[username].password === password) {
        currentUser = usuarios[username];
        currentUser.username = username;
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainSystem').style.display = 'block';
        
        document.getElementById('currentUserName').textContent = currentUser.nombre;
        document.getElementById('currentUserRole').textContent = currentUser.rol === 'admin' ? 'Administrador' : 'Vendedor';
        
        // Mostrar tabs según el rol
        if (currentUser.rol === 'admin') {
            document.getElementById('statsTab').style.display = 'block';
            document.getElementById('configTab').style.display = 'block';
        }
        
        // Mostrar avisos para vendedores
        if (currentUser.rol === 'vendedor') {
            document.getElementById('vendedorNotice').style.display = 'block';
            document.getElementById('vendedorNotice2').style.display = 'block';
        }
        
        showTab('registro');
        loadClientesForPedidos();
    } else {
        alert('Credenciales incorrectas. Por favor verifique su usuario y contraseña.');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// ============================================
// NAVEGACIÓN
// ============================================
function showTab(tabName) {
    // Ocultar todos los contenidos
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.style.display = 'none');
    
    // Remover clase active de todos los tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Mostrar contenido seleccionado
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Activar tab correspondiente
    const activeTab = event ? event.target : 
        Array.from(tabs).find(tab => tab.textContent.includes(getTabText(tabName)));
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Cargar datos específicos según el tab
    switch(tabName) {
        case 'listar':
            displayAllClients();
            break;
        case 'verPedidos':
            displayAllPedidos();
            break;
        case 'estadisticas':
            if (currentUser && currentUser.rol === 'admin') {
                loadEstadisticas();
            }
            break;
        case 'configuracion':
            if (currentUser && currentUser.rol === 'admin') {
                loadConfiguracion();
            }
            break;
    }
}

function getTabText(tabName) {
    const tabTexts = {
        'registro': 'Registrar Cliente',
        'buscar': 'Buscar Clientes', 
        'listar': 'Lista de Clientes',
        'pedidos': 'Crear Pedido',
        'verPedidos': 'Ver Pedidos',
        'reparto': 'Organizar Reparto',
        'estadisticas': 'Estadísticas',
        'configuracion': 'Configuración'
    };
    return tabTexts[tabName] || '';
}

// ============================================
// FORMATEO DE DATOS - CORREGIDO
// ============================================
function formatCUIT() {
    const input = document.getElementById('cuit');
    if (!input) return; // CORREGIDO: validar que el elemento existe
    
    let value = input.value.replace(/\D/g, ''); // Solo números
    
    if (value.length >= 2 && value.length <= 11) {
        // Formato: XX-XXXXXXXX-X
        if (value.length <= 2) {
            value = value;
        } else if (value.length <= 10) {
            value = value.slice(0, 2) + '-' + value.slice(2, 10);
        } else if (value.length === 11) {
            value = value.slice(0, 2) + '-' + value.slice(2, 10) + '-' + value.slice(10);
        }
    }
    
    // Limitar a formato correcto: 20-12345678-9
    if (value.length > 13) {
        value = value.slice(0, 13);
    }
    
    input.value = value;
}

// ============================================
// GESTIÓN DE CLIENTES
// ============================================
function handleClientSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: clienteIdCounter++,
        nombreFicticio: document.getElementById('nombreFicticio').value.trim(),
        razonSocial: document.getElementById('razonSocial').value.trim(),
        cuit: document.getElementById('cuit').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        email: document.getElementById('email').value.trim(),
        vendedor: document.getElementById('vendedor').value,
        potencialidad: document.getElementById('potencialidad').value,
        notas: document.getElementById('notas').value.trim(),
        fechaRegistro: new Date().toISOString().split('T')[0],
        coordenadas: window.selectedCoordinates || null
    };
    
    // Validación CUIT corregida
    if (!validateCUIT(formData.cuit)) {
        showError('El CUIT debe tener el formato: 20-12345678-9');
        return;
    }
    
    // Verificar CUIT duplicado
    if (clientes.some(cliente => cliente.cuit === formData.cuit)) {
        showError('Ya existe un cliente registrado con este CUIT');
        return;
    }
    
    clientes.push(formData);
    saveData();
    
    showSuccess('Cliente registrado exitosamente');
    document.getElementById('clientForm').reset();
    
    // Limpiar coordenadas seleccionadas
    window.selectedCoordinates = null;
    
    // Actualizar lista de clientes para pedidos
    loadClientesForPedidos();
}

function validateCUIT(cuit) {
    // Validar formato XX-XXXXXXXX-X
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
}

// ============================================
// WHATSAPP INTEGRATION - CORREGIDO
// ============================================
function sendWhatsAppNotification(pedido, cliente) {
    // Corregir el problema del prefijo +54 duplicado
    let telefono = cliente.telefono.replace(/\D/g, ''); // Solo números
    
    // Si no tiene prefijo de país, agregarlo
    if (!telefono.startsWith('54')) {
        telefono = '54' + telefono;
    }
    
    // Si ya tiene el 54, no duplicarlo
    if (telefono.startsWith('5454')) {
        telefono = telefono.substring(2); // Remover el 54 duplicado
    }
    
    const mensaje = `Hola ${cliente.nombreFicticio}! 🥩

Tu pedido #${pedido.numero} ha sido confirmado.

📅 Fecha de entrega: ${new Date(pedido.fechaEntrega).toLocaleDateString('es-AR')}
💰 Total: $${pedido.total.toLocaleString('es-AR')}

Productos:
${pedido.productos.map(p => `• ${p.nombre} - ${p.cantidad} ${p.unidad}`).join('\n')}

¡Gracias por elegir Felder Charcutería!`;
    
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

// ============================================
// GESTIÓN DE PEDIDOS
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
    
    const cliente = clientes.find(c => c.id == clienteId);
    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);
    
    const pedido = {
        id: pedidoIdCounter++,
        numero: `F${Date.now().toString().slice(-6)}`,
        clienteId: parseInt(clienteId),
        clienteNombre: cliente.nombreFicticio,
        vendedorAsignado: cliente.vendedor,
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaEntrega: fechaEntrega,
        productos: productos,
        total: total,
        observaciones: observaciones,
        estado: 'Pendiente'
    };
    
    pedidos.push(pedido);
    saveData();
    
    showPedidoSuccess('Pedido creado exitosamente');
    document.getElementById('pedidoForm').reset();
    document.getElementById('totalPedido').textContent = '0';
    
    // Preguntar si enviar WhatsApp
    if (confirm('¿Desea enviar notificación por WhatsApp al cliente?')) {
        sendWhatsAppNotification(pedido, cliente);
    }
}

function getProductosFromForm() {
    const productos = [];
    const productosItems = document.querySelectorAll('.producto-item');
    
    productosItems.forEach(item => {
        const categoria = item.querySelector('.categoria-select').value;
        const productoSelect = item.querySelector('.producto-select');
        const cantidad = item.querySelector('.cantidad-input').value;
        const precio = item.querySelector('.precio-input').value;
        const subtotal = item.querySelector('.subtotal-input').value;
        const unidad = item.querySelector('.unidad-input').value;
        
        if (categoria && productoSelect.value && cantidad && precio) {
            productos.push({
                categoria: categoria,
                nombre: productoSelect.options[productoSelect.selectedIndex].text,
                cantidad: parseFloat(cantidad),
                precio: parseFloat(precio),
                subtotal: parseFloat(subtotal),
                unidad: unidad
            });
        }
    });
    
    return productos;
}

// ============================================
// GESTIÓN DE FECHAS DE ENTREGA
// ============================================
function generateDeliveryDates() {
    const fechaSelect = document.getElementById('fechaEntrega');
    if (!fechaSelect) return;
    
    fechaSelect.innerHTML = '<option value="">Seleccionar fecha de entrega</option>';
    
    const today = new Date();
    const maxDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 días
    
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
        // Solo martes (2) y viernes (5)
        if (d.getDay() === 2 || d.getDay() === 5) {
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.getDay() === 2 ? 'Martes' : 'Viernes';
            const formattedDate = d.toLocaleDateString('es-AR');
            
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = `${dayName} ${formattedDate}`;
            fechaSelect.appendChild(option);
        }
    }
}

// ============================================
// UTILIDADES
// ============================================
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showPedidoSuccess(message) {
    const successDiv = document.getElementById('pedidoSuccessMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

function showPedidoError(message) {
    const errorDiv = document.getElementById('pedidoErrorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// PERSISTENCIA DE DATOS
// ============================================
function saveData() {
    try {
        localStorage.setItem('felder_clientes', JSON.stringify(clientes));
        localStorage.setItem('felder_pedidos', JSON.stringify(pedidos));
        localStorage.setItem('felder_counters', JSON.stringify({
            clienteIdCounter: clienteIdCounter,
            pedidoIdCounter: pedidoIdCounter
        }));
    } catch (error) {
        console.error('Error guardando datos:', error);
    }
}

function loadData() {
    try {
        const savedClientes = localStorage.getItem('felder_clientes');
        const savedPedidos = localStorage.getItem('felder_pedidos');
        const savedCounters = localStorage.getItem('felder_counters');
        
        if (savedClientes) {
            clientes = JSON.parse(savedClientes);
        }
        
        if (savedPedidos) {
            pedidos = JSON.parse(savedPedidos);
        }
        
        if (savedCounters) {
            const counters = JSON.parse(savedCounters);
            clienteIdCounter = counters.clienteIdCounter || 1;
            pedidoIdCounter = counters.pedidoIdCounter || 1;
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function loadClientesForPedidos() {
    const select = document.getElementById('clientePedido');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    
    let clientesToShow = clientes;
    if (currentUser && currentUser.rol === 'vendedor') {
        clientesToShow = clientes.filter(c => c.vendedor === currentUser.vendedor);
    }
    
    clientesToShow.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nombreFicticio} (${cliente.razonSocial})`;
        select.appendChild(option);
    });
}

// Exponer funciones globalmente - CORREGIDO
window.showTab = showTab;
window.logout = logout;
window.handleLogin = handleLogin;
window.handleClientSubmit = handleClientSubmit;
window.handlePedidoSubmit = handlePedidoSubmit;
window.formatCUIT = formatCUIT;
window.saveData = saveData;
window.loadData = loadData;
window.generateDeliveryDates = generateDeliveryDates;
window.loadClientesForPedidos = loadClientesForPedidos;

console.log('App.js cargado correctamente con todas las funciones expuestas');