// ============================================
// FUNCIONES PRINCIPALES DE LA APLICACIÓN
// ============================================

// NOTA: Las variables globales se han movido al archivo index.html
// para evitar duplicaciones y conflictos

// ============================================
// INICIALIZACIÓN - CORREGIDO
// ============================================
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

if (username && password && window.usuarios[username] && window.usuarios[username].password === password) {
window.currentUser = window.usuarios[username];
window.currentUser.username = username;

document.getElementById('loginScreen').style.display = 'none';
document.getElementById('mainSystem').style.display = 'block';

document.getElementById('currentUserName').textContent = window.currentUser.nombre;
document.getElementById('currentUserRole').textContent = window.currentUser.rol === 'admin' ? 'Administrador' : 'Vendedor';

// Mostrar tabs según el rol
if (window.currentUser.rol === 'admin') {
document.getElementById('statsTab').style.display = 'block';
document.getElementById('configTab').style.display = 'block';
}

// Mostrar avisos para vendedores
if (window.currentUser.rol === 'vendedor') {
document.getElementById('vendedorNotice').style.display = 'block';
document.getElementById('vendedorNotice2').style.display = 'block';
}

showTab('registro');
loadClientesForPedidos();

// Log de acceso
if (window.appLog) {
window.appLog.log(`Usuario ${username} ha iniciado sesión`);
}
} else {
alert('Credenciales incorrectas. Por favor verifique su usuario y contraseña.');

// Log de intento fallido
if (window.appLog) {
window.appLog.log(`Intento fallido de inicio de sesión para usuario ${username}`, 'warn');
}
}
}

function logout() {
// Log de cierre de sesión
if (window.appLog && window.currentUser) {
window.appLog.log(`Usuario ${window.currentUser.username} ha cerrado sesión`);
}

window.currentUser = null;
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
if (typeof displayAllClients === 'function') {
displayAllClients();
}
break;
case 'verPedidos':
if (typeof displayAllPedidos === 'function') {
displayAllPedidos();
}
break;
case 'estadisticas':
if (window.currentUser && window.currentUser.rol === 'admin') {
if (typeof loadEstadisticas === 'function') {
loadEstadisticas();
}
}
break;
case 'configuracion':
if (window.currentUser && window.currentUser.rol === 'admin') {
if (typeof loadConfiguracion === 'function') {
loadConfiguracion();
}
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
id: window.clienteIdCounter++,
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
if (window.clientes.some(cliente => cliente.cuit === formData.cuit)) {
showError('Ya existe un cliente registrado con este CUIT');
return;
}

window.clientes.push(formData);
saveData();

showSuccess('Cliente registrado exitosamente');
document.getElementById('clientForm').reset();

// Limpiar coordenadas seleccionadas
window.selectedCoordinates = null;

// Actualizar lista de clientes para pedidos
loadClientesForPedidos();

// Log de acción
if (window.appLog) {
window.appLog.log(`Nuevo cliente registrado: ${formData.nombreFicticio} (CUIT: ${formData.cuit})`);
}
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

// Log de acción
if (window.appLog) {
window.appLog.log(`Notificación WhatsApp enviada para pedido #${pedido.numero} a ${cliente.nombreFicticio}`);
}
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

const cliente = window.clientes.find(c => c.id == clienteId);
const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

const pedido = {
id: window.pedidoIdCounter++,
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

window.pedidos.push(pedido);
saveData();

showPedidoSuccess('Pedido creado exitosamente');
document.getElementById('pedidoForm').reset();
document.getElementById('totalPedido').textContent = '0';

// Log de acción
if (window.appLog) {
window.appLog.log(`Nuevo pedido creado: #${pedido.numero} para ${cliente.nombreFicticio} - Total: $${total}`);
}

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
localStorage.setItem('felder_clientes', JSON.stringify(window.clientes));
localStorage.setItem('felder_pedidos', JSON.stringify(window.pedidos));
localStorage.setItem('felder_counters', JSON.stringify({
clienteIdCounter: window.clienteIdCounter,
pedidoIdCounter: window.pedidoIdCounter
}));

// Log de acción
if (window.appLog) {
window.appLog.log(`Datos guardados: ${window.clientes.length} clientes, ${window.pedidos.length} pedidos`);
}
} catch (error) {
console.error('Error guardando datos:', error);

// Log de error
if (window.appLog) {
window.appLog.log(`Error guardando datos: ${error.message}`, 'error');
}
}
}

function loadData() {
try {
const savedClientes = localStorage.getItem('felder_clientes');
const savedPedidos = localStorage.getItem('felder_pedidos');
const savedCounters = localStorage.getItem('felder_counters');

if (savedClientes) {
window.clientes = JSON.parse(savedClientes);
}

if (savedPedidos) {
window.pedidos = JSON.parse(savedPedidos);
}

if (savedCounters) {
const counters = JSON.parse(savedCounters);
window.clienteIdCounter = counters.clienteIdCounter || 1;
window.pedidoIdCounter = counters.pedidoIdCounter || 1;
}

// Log de acción
if (window.appLog) {
window.appLog.log(`Datos cargados: ${window.clientes.length} clientes, ${window.pedidos.length} pedidos`);
}
} catch (error) {
console.error('Error cargando datos:', error);

// Log de error
if (window.appLog) {
window.appLog.log(`Error cargando datos: ${error.message}`, 'error');
}
}
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function loadClientesForPedidos() {
const select = document.getElementById('clientePedido');
if (!select) return;

select.innerHTML = '<option value="">Seleccionar cliente</option>';

let clientesToShow = window.clientes;
if (window.currentUser && window.currentUser.rol === 'vendedor') {
clientesToShow = window.clientes.filter(c => c.vendedor === window.currentUser.vendedor);
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

// Inicialización
if (typeof window.appLog !== 'undefined') {
window.appLog.log('App.js cargado correctamente');
}