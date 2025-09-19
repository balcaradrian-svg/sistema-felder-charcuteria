// ============================================
// ORGANIZADOR DE REPARTO - CORREGIDO
// ============================================

let repartoMap = null;
let repartoMarkers = [];
let directionsService = null;
let directionsRenderer = null;
let pedidosReparto = [];

// ============================================
// INICIALIZACIÓN DEL REPARTO
// ============================================
function initRepartoMaps() {
    if (typeof google === 'undefined') {
        console.warn('Google Maps no está disponible');
        return;
    }

    // Inicializar servicios
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#d32f2f',
            strokeWeight: 4
        }
    });

    // Cargar fechas de reparto disponibles
    loadFechasReparto();
}

function loadFechasReparto() {
    const fechaSelect = document.getElementById('fechaReparto');
    if (!fechaSelect) return;
    
    fechaSelect.innerHTML = '<option value="">Seleccionar fecha</option>';
    
    // Obtener fechas únicas de pedidos pendientes
    const fechasUnicas = [...new Set(
        pedidos.filter(p => p.estado !== 'Entregado')
               .map(p => p.fechaEntrega)
    )].sort();
    
    fechasUnicas.forEach(fecha => {
        const option = document.createElement('option');
        option.value = fecha;
        const fechaObj = new Date(fecha);
        const dayName = fechaObj.getDay() === 2 ? 'Martes' : 'Viernes';
        option.textContent = `${dayName} ${fechaObj.toLocaleDateString('es-AR')}`;
        fechaSelect.appendChild(option);
    });
}

function loadPedidosForReparto() {
    const fechaSeleccionada = document.getElementById('fechaReparto').value;
    if (!fechaSeleccionada) return;
    
    // Filtrar pedidos para la fecha seleccionada
    pedidosReparto = pedidos.filter(p => 
        p.fechaEntrega === fechaSeleccionada && p.estado !== 'Entregado'
    );
    
    // Agregar información del cliente a cada pedido
    pedidosReparto = pedidosReparto.map(pedido => {
        const cliente = clientes.find(c => c.id === pedido.clienteId);
        return {
            ...pedido,
            cliente: cliente
        };
    });
    
    // Mostrar resumen
    mostrarResumenReparto();
    
    // Limpiar organizaciones anteriores
    document.getElementById('rutaOptimizada').style.display = 'none';
}

function mostrarResumenReparto() {
    const container = document.getElementById('resumenContent');
    const resumenDiv = document.getElementById('resumenReparto');
    
    if (pedidosReparto.length === 0) {
        container.innerHTML = '<p>No hay pedidos para esta fecha.</p>';
        resumenDiv.style.display = 'block';
        return;
    }
    
    const totalPedidos = pedidosReparto.length;
    const pesoTotal = pedidosReparto.reduce((total, p) => total + calcularPesoPedido(p), 0);
    const montoTotal = pedidosReparto.reduce((total, p) => total + p.total, 0);
    
    container.innerHTML = `
        <div class="resumen-cards">
            <div class="stat-card">
                <div class="stat-number">${totalPedidos}</div>
                <div class="stat-label">Pedidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pesoTotal.toFixed(1)}kg</div>
                <div class="stat-label">Peso Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${montoTotal.toLocaleString('es-AR')}</div>
                <div class="stat-label">Monto Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pesoTotal > 500 ? '⚠️' : '✅'}</div>
                <div class="stat-label">Capacidad</div>
            </div>
        </div>
        ${pesoTotal > 500 ? 
            '<div style="background: #fff3cd; padding: 15px; border-radius: 5px; color: #856404; margin-top: 15px;">' +
            '⚠️ <strong>Advertencia:</strong> El peso total excede la capacidad del vehículo (500kg). ' +
            'Considere dividir el reparto en dos viajes.' +
            '</div>' : ''}
    `;
    
    resumenDiv.style.display = 'block';
}

function calcularPesoPedido(pedido) {
    // Estimación básica de peso basada en productos
    return pedido.productos.reduce((peso, producto) => {
        const pesoEstimado = producto.cantidad * 0.5; // 500g promedio por unidad
        return peso + pesoEstimado;
    }, 0);
}

// ============================================
// ALGORITMOS DE ORGANIZACIÓN - CORREGIDOS
// ============================================
function organizarReparto() {
    const tipoOrganizacion = document.getElementById('tipoOrganizacion').value;
    
    if (!tipoOrganizacion || pedidosReparto.length === 0) return;
    
    let pedidosOrdenados = [];
    
    switch(tipoOrganizacion) {
        case 'optimizada':
            pedidosOrdenados = organizarRutaOptimizada();
            break;
        case 'distancia':
            pedidosOrdenados = organizarPorDistancia();
            break;
        case 'zona':
            pedidosOrdenados = organizarPorZona();
            break;
        case 'peso':
            pedidosOrdenados = organizarPorPeso();
            break;
    }
    
    mostrarRutaOrganizada(pedidosOrdenados, tipoOrganizacion);
}

// ALGORITMO OPTIMIZADO - CORREGIDO
function organizarRutaOptimizada() {
    // Filtrar solo pedidos con coordenadas válidas
    const pedidosConCoordenadas = pedidosReparto.filter(p => 
        p.cliente && p.cliente.coordenadas && 
        p.cliente.coordenadas.lat && p.cliente.coordenadas.lng
    );
    
    if (pedidosConCoordenadas.length === 0) {
        alert('No hay pedidos con coordenadas válidas para optimizar la ruta');
        return [];
    }
    
    // Algoritmo del vecino más cercano mejorado - CORREGIDO
    const baseCoords = BASE_FELDER.coordenadas; // Asegurar que use la variable correcta
    let ruta = [];
    let pendientes = [...pedidosConCoordenadas];
    let actual = baseCoords;
    
    // Empezar desde la base
    while (pendientes.length > 0) {
        let cercanoIndex = 0;
        let menorDistancia = calcularDistancia(
            actual, 
            pendientes[0].cliente.coordenadas
        );
        
        // Encontrar el pedido más cercano
        for (let i = 1; i < pendientes.length; i++) {
            const distancia = calcularDistancia(
                actual, 
                pendientes[i].cliente.coordenadas
            );
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                cercanoIndex = i;
            }
        }
        
        // Agregar a la ruta y actualizar posición actual
        const pedidoCercano = pendientes.splice(cercanoIndex, 1)[0];
        ruta.push(pedidoCercano);
        actual = pedidoCercano.cliente.coordenadas;
    }
    
    return ruta;
}

// ORGANIZADOR POR DISTANCIA - CORREGIDO
function organizarPorDistancia() {
    // CORREGIDO: usar BASE_FELDER en lugar de baseLocation
    const baseCoords = BASE_FELDER.coordenadas;
    
    return pedidosReparto
        .filter(p => p.cliente && p.cliente.coordenadas)
        .map(pedido => ({
            ...pedido,
            distanciaDesdeBase: calcularDistancia(baseCoords, pedido.cliente.coordenadas)
        }))
        .sort((a, b) => a.distanciaDesdeBase - b.distanciaDesdeBase);
}

function organizarPorZona() {
    // Definir zonas geográficas
    const zonas = {
        'Centro': { lat: -31.7318, lng: -60.5226, prioridad: 1 },
        'Norte': { lat: -31.7200, lng: -60.5200, prioridad: 2 },
        'Sur': { lat: -31.7450, lng: -60.5250, prioridad: 3 },
        'Este': { lat: -31.7320, lng: -60.5000, prioridad: 4 },
        'Oeste': { lat: -31.7320, lng: -60.5450, prioridad: 5 }
    };
    
    return pedidosReparto
        .filter(p => p.cliente && p.cliente.coordenadas)
        .map(pedido => ({
            ...pedido,
            zona: determinarZona(pedido.cliente.coordenadas, zonas)
        }))
        .sort((a, b) => a.zona.prioridad - b.zona.prioridad);
}

function organizarPorPeso() {
    return pedidosReparto
        .map(pedido => ({
            ...pedido,
            peso: calcularPesoPedido(pedido)
        }))
        .sort((a, b) => b.peso - a.peso); // Primero los más pesados
}

// ============================================
// UTILIDADES GEOGRÁFICAS - CORREGIDAS
// ============================================
function calcularDistancia(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
        return Infinity;
    }
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function determinarZona(coordenadas, zonas) {
    let zonaCercana = null;
    let menorDistancia = Infinity;
    
    for (const [nombre, zona] of Object.entries(zonas)) {
        const distancia = calcularDistancia(coordenadas, zona);
        if (distancia < menorDistancia) {
            menorDistancia = distancia;
            zonaCercana = { nombre, ...zona };
        }
    }
    
    return zonaCercana || { nombre: 'Indefinida', prioridad: 999 };
}

// ============================================
// VISUALIZACIÓN - CORREGIDA
// ============================================
function mostrarRutaOrganizada(pedidosOrdenados, tipoOrganizacion) {
    if (pedidosOrdenados.length === 0) return;
    
    const rutaDiv = document.getElementById('rutaOptimizada');
    rutaDiv.style.display = 'block';
    
    // Crear mapa si no existe
    if (!repartoMap) {
        crearMapaReparto();
    }
    
    // Mostrar en mapa
    mostrarRutaEnMapa(pedidosOrdenados);
    
    // Generar hoja de ruta corregida
    generarHojaRuta(pedidosOrdenados, tipoOrganizacion);
}

function crearMapaReparto() {
    const mapContainer = document.getElementById('map-container-reparto');
    if (!mapContainer) return;
    
    repartoMap = new google.maps.Map(mapContainer, {
        zoom: 13,
        center: BASE_FELDER.coordenadas,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Marcador de la base
    new google.maps.Marker({
        position: BASE_FELDER.coordenadas,
        map: repartoMap,
        title: BASE_FELDER.nombre,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
    });
}

function mostrarRutaEnMapa(pedidosOrdenados) {
    // Limpiar marcadores anteriores
    repartoMarkers.forEach(marker => marker.setMap(null));
    repartoMarkers = [];
    
    // Crear waypoints para la ruta
    const waypoints = pedidosOrdenados
        .filter(p => p.cliente && p.cliente.coordenadas)
        .map(pedido => ({
            location: pedido.cliente.coordenadas,
            stopover: true
        }));
    
    if (waypoints.length === 0) return;
    
    // Configurar ruta
    const request = {
        origin: BASE_FELDER.coordenadas,
        destination: BASE_FELDER.coordenadas, // Volver a la base
        waypoints: waypoints,
        optimizeWaypoints: false, // Ya está optimizada
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: true
    };
    
    // Calcular y mostrar ruta
    directionsRenderer.setMap(repartoMap);
    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            
            // Crear marcadores numerados
            pedidosOrdenados.forEach((pedido, index) => {
                if (pedido.cliente && pedido.cliente.coordenadas) {
                    const marker = new google.maps.Marker({
                        position: pedido.cliente.coordenadas,
                        map: repartoMap,
                        label: (index + 1).toString(),
                        title: `${index + 1}. ${pedido.cliente.nombreFicticio}`
                    });
                    repartoMarkers.push(marker);
                }
            });
        } else {
            console.error('Error calculando ruta:', status);
            // Mostrar marcadores sin ruta si falla
            mostrarMarcadoresSinRuta(pedidosOrdenados);
        }
    });
}

function mostrarMarcadoresSinRuta(pedidosOrdenados) {
    pedidosOrdenados.forEach((pedido, index) => {
        if (pedido.cliente && pedido.cliente.coordenadas) {
            const marker = new google.maps.Marker({
                position: pedido.cliente.coordenadas,
                map: repartoMap,
                label: (index + 1).toString(),
                title: `${index + 1}. ${pedido.cliente.nombreFicticio}`
            });
            repartoMarkers.push(marker);
        }
    });
}

// HOJA DE RUTA CORREGIDA
function generarHojaRuta(pedidosOrdenados, tipoOrganizacion) {
    const container = document.getElementById('rutaDetallada');
    
    let distanciaTotal = 0;
    const baseCoords = BASE_FELDER.coordenadas;
    
    let hojaRuta = `
        <div class="ruta-header">
            <h4>📋 Hoja de Ruta - ${getTipoOrganizacionText(tipoOrganizacion)}</h4>
            <p><strong>Fecha:</strong> ${new Date(document.getElementById('fechaReparto').value).toLocaleDateString('es-AR')}</p>
        </div>
        
        <div class="ruta-step">
            <div class="step-number">🏢</div>
            <div class="step-content">
                <strong>INICIO - ${BASE_FELDER.nombre}</strong><br>
                <small>${BASE_FELDER.direccion}</small><br>
                <small>⏰ Hora sugerida de salida: 08:00</small>
            </div>
        </div>
    `;
    
    let horaEstimada = new Date();
    horaEstimada.setHours(8, 0); // Inicio a las 8:00
    
    let coordenadaAnterior = baseCoords;
    
    pedidosOrdenados.forEach((pedido, index) => {
        const cliente = pedido.cliente;
        
        // Calcular distancia desde la ubicación anterior
        let distancia = 0;
        if (cliente && cliente.coordenadas) {
            distancia = calcularDistancia(coordenadaAnterior, cliente.coordenadas);
            distanciaTotal += distancia;
            coordenadaAnterior = cliente.coordenadas;
        }
        
        // Estimar tiempo (15 min por entrega + tiempo de viaje)
        const tiempoViaje = Math.max(5, distancia * 3); // 3 min por km mínimo 5 min
        horaEstimada.setMinutes(horaEstimada.getMinutes() + tiempoViaje + 15);
        
        hojaRuta += `
            <div class="ruta-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <strong>${cliente?.nombreFicticio || 'Cliente sin datos'}</strong><br>
                    <small>📍 ${cliente?.direccion || 'Dirección no disponible'}</small><br>
                    <small>📞 ${cliente?.telefono || 'Sin teléfono'}</small><br>
                    <small>⏰ Hora estimada: ${horaEstimada.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}</small><br>
                    <small>📦 Pedido #${pedido.numero} - $${pedido.total.toLocaleString('es-AR')}</small>
                    ${distancia > 0 ? `<br><small>🚗 ${distancia.toFixed(1)} km desde anterior parada</small>` : ''}
                    ${pedido.observaciones ? `<br><small>📝 <strong>Obs:</strong> ${pedido.observaciones}</small>` : ''}
                </div>
            </div>
        `;
    });
    
    // Distancia de regreso a la base
    if (coordenadaAnterior !== baseCoords && pedidosOrdenados.length > 0) {
        const distanciaRegreso = calcularDistancia(coordenadaAnterior, baseCoords);
        distanciaTotal += distanciaRegreso;
        
        horaEstimada.setMinutes(horaEstimada.getMinutes() + (distanciaRegreso * 3));
        
        hojaRuta += `
            <div class="ruta-step">
                <div class="step-number">🏢</div>
                <div class="step-content">
                    <strong>REGRESO - ${BASE_FELDER.nombre}</strong><br>
                    <small>⏰ Hora estimada de regreso: ${horaEstimada.toLocaleTimeString('es-AR', {hour: '2-digit', minute: '2-digit'})}</small><br>
                    <small>🚗 ${distanciaRegreso.toFixed(1)} km desde última entrega</small>
                </div>
            </div>
        `;
    }
    
    hojaRuta += `
        <div class="ruta-resumen">
            <h4>📊 Resumen del Recorrido</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px;">
                <div><strong>Total entregas:</strong> ${pedidosOrdenados.length}</div>
                <div><strong>Distancia total:</strong> ${distanciaTotal.toFixed(1)} km</div>
                <div><strong>Tiempo estimado:</strong> ${Math.ceil((horaEstimada.getTime() - new Date().setHours(8,0)) / 60000)} minutos</div>
                <div><strong>Monto total:</strong> $${pedidosOrdenados.reduce((total, p) => total + p.total, 0).toLocaleString('es-AR')}</div>
            </div>
        </div>
    `;
    
    container.innerHTML = hojaRuta;
}

function getTipoOrganizacionText(tipo) {
    const tipos = {
        'optimizada': 'Ruta Optimizada',
        'distancia': 'Por Distancia desde Base',
        'zona': 'Por Zona Geográfica',
        'peso': 'Por Peso del Pedido'
    };
    return tipos[tipo] || 'Sin especificar';
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar cuando Google Maps esté listo
    if (typeof google !== 'undefined') {
        initRepartoMaps();
    } else {
        window.initMaps = function() {
            initRepartoMaps();
        };
    }
});

// Exponer funciones globalmente - CORREGIDO
window.loadPedidosForReparto = loadPedidosForReparto;
window.organizarReparto = organizarReparto;
window.initRepartoMaps = initRepartoMaps;
window.loadFechasReparto = loadFechasReparto;
window.mostrarResumenReparto = mostrarResumenReparto;
window.calcularPesoPedido = calcularPesoPedido;
window.organizarRutaOptimizada = organizarRutaOptimizada;
window.organizarPorDistancia = organizarPorDistancia;
window.organizarPorZona = organizarPorZona;
window.organizarPorPeso = organizarPorPeso;

console.log('Delivery.js cargado correctamente con todas las funciones expuestas');