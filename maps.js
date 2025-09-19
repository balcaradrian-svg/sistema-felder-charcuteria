// ============================================
// GOOGLE MAPS INTEGRATION - CORREGIDO
// ============================================

let clienteMap = null;
let clienteMarker = null;
let mapSelectorMode = false;
let autocomplete = null;
let geocoder = null;

// Coordenadas seleccionadas por el usuario
window.selectedCoordinates = null;

// ============================================
// INICIALIZACIÓN DE MAPAS
// ============================================
function initMaps() {
    if (typeof google === 'undefined') {
        console.warn('Google Maps API no está disponible');
        return;
    }
    
    geocoder = new google.maps.Geocoder();
    initAddressAutocomplete();
    console.log('Google Maps inicializado correctamente');
}

// ============================================
// AUTOCOMPLETADO DE DIRECCIONES
// ============================================
function initAddressAutocomplete() {
    const direccionInput = document.getElementById('direccion');
    if (!direccionInput) return;
    
    autocomplete = new google.maps.places.Autocomplete(direccionInput, {
        types: ['address'],
        componentRestrictions: { country: 'AR' },
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(-32.0, -60.8), // SW
            new google.maps.LatLng(-31.5, -60.2)  // NE - Área de Paraná
        )
    });
    
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            window.selectedCoordinates = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            updateCoordinatesInfo(window.selectedCoordinates, place.formatted_address);
        }
    });
}

// ============================================
// SELECTOR DE MAPA - CORREGIDO
// ============================================
function toggleMapSelector() {
    mapSelectorMode = !mapSelectorMode;
    const mapContainer = document.getElementById('map-container-cliente');
    const instructions = document.getElementById('map-selector-instructions');
    const button = event.target;
    
    if (mapSelectorMode) {
        // Mostrar mapa y activar modo selección
        mapContainer.style.display = 'block';
        instructions.style.display = 'block';
        button.textContent = '❌ Cancelar Selección';
        button.classList.add('btn-secondary');
        
        // Crear mapa si no existe
        if (!clienteMap) {
            initClienteMap();
        }
    } else {
        // Ocultar mapa y desactivar modo selección
        mapContainer.style.display = 'none';
        instructions.style.display = 'none';
        button.textContent = '📍 Seleccionar en el Mapa';
        button.classList.remove('btn-secondary');
    }
}

function initClienteMap() {
    const mapContainer = document.getElementById('map-container-cliente');
    if (!mapContainer) return;
    
    const mapOptions = {
        zoom: 14,
        center: BASE_FELDER.coordenadas, // CORREGIDO: usar BASE_FELDER
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: true,
        zoomControl: true
    };
    
    clienteMap = new google.maps.Map(mapContainer, mapOptions);
    
    // Marcador de la base de Felder - CORREGIDO
    new google.maps.Marker({
        position: BASE_FELDER.coordenadas,
        map: clienteMap,
        title: BASE_FELDER.nombre,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    // Listener para clicks en el mapa
    clienteMap.addListener('click', function(event) {
        if (mapSelectorMode) {
            placeMarkerOnMap(event.latLng);
        }
    });
}

function placeMarkerOnMap(location) {
    // Remover marcador anterior si existe
    if (clienteMarker) {
        clienteMarker.setMap(null);
    }
    
    // Crear nuevo marcador
    clienteMarker = new google.maps.Marker({
        position: location,
        map: clienteMap,
        title: 'Ubicación del Cliente',
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    // Guardar coordenadas
    window.selectedCoordinates = {
        lat: location.lat(),
        lng: location.lng()
    };
    
    // Geocodificar para obtener la dirección
    geocodeCoordinates(window.selectedCoordinates);
    
    // Listener para cuando se arrastra el marcador
    clienteMarker.addListener('dragend', function(event) {
        window.selectedCoordinates = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        geocodeCoordinates(window.selectedCoordinates);
    });
}

// ============================================
// GEOCODIFICACIÓN - CORREGIDA
// ============================================
function geocodeCoordinates(coordinates) {
    if (!geocoder) return;
    
    geocoder.geocode({
        location: coordinates
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                const address = results[0].formatted_address;
                
                // Actualizar campo de dirección
                const direccionInput = document.getElementById('direccion');
                if (direccionInput) {
                    direccionInput.value = address;
                }
                
                updateCoordinatesInfo(coordinates, address);
            } else {
                updateCoordinatesInfo(coordinates, 'Dirección no encontrada');
            }
        } else {
            console.warn('Geocoder falló:', status);
            updateCoordinatesInfo(coordinates, 'Error obteniendo dirección');
        }
    });
}

function updateCoordinatesInfo(coordinates, address) {
    const coordsInfo = document.getElementById('coordenadas-info');
    if (coordsInfo) {
        coordsInfo.innerHTML = `
            <strong>📍 Coordenadas:</strong> ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}<br>
            <strong>📍 Dirección:</strong> ${address}
        `;
        coordsInfo.style.display = 'block';
    }
}

// ============================================
// VALIDACIÓN DE COORDENADAS
// ============================================
function validateCoordinates(coordinates) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
        return false;
    }
    
    // Validar que esté en Argentina (aproximado)
    const lat = coordinates.lat;
    const lng = coordinates.lng;
    
    if (lat < -55 || lat > -21.8 || lng < -73.6 || lng > -53.6) {
        return false;
    }
    
    return true;
}

// ============================================
// BÚSQUEDA DE DIRECCIONES
// ============================================
function searchAddress(address) {
    if (!geocoder || !address) return;
    
    geocoder.geocode({
        address: address,
        componentRestrictions: { country: 'AR' }
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                const location = results[0].geometry.location;
                window.selectedCoordinates = {
                    lat: location.lat(),
                    lng: location.lng()
                };
                
                updateCoordinatesInfo(window.selectedCoordinates, results[0].formatted_address);
                
                // Si el mapa está visible, centrar y colocar marcador
                if (clienteMap && mapSelectorMode) {
                    clienteMap.setCenter(location);
                    placeMarkerOnMap(location);
                }
            }
        } else {
            console.warn('No se pudo encontrar la dirección:', status);
        }
    });
}

// ============================================
// CÁLCULO DE DISTANCIAS
// ============================================
function calculateDistance(from, to) {
    if (!validateCoordinates(from) || !validateCoordinates(to)) {
        return null;
    }
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(to.lat - from.lat);
    const dLon = toRad(to.lng - from.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// ============================================
// MAPA BASE PARA REPARTO
// ============================================
function initBaseMap() {
    const mapContainer = document.getElementById('map-container-base');
    if (!mapContainer) return;
    
    const baseMap = new google.maps.Map(mapContainer, {
        zoom: 15,
        center: BASE_FELDER.coordenadas,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true
    });
    
    // Marcador de la base
    new google.maps.Marker({
        position: BASE_FELDER.coordenadas,
        map: baseMap,
        title: BASE_FELDER.nombre,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        }
    });
    
    // Info window con información de la base
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #d32f2f;">${BASE_FELDER.nombre}</h4>
                <p style="margin: 0; line-height: 1.4;">${BASE_FELDER.direccion}</p>
            </div>
        `
    });
    
    // Mostrar info al hacer click en el marcador
    const baseMarker = new google.maps.Marker({
        position: BASE_FELDER.coordenadas,
        map: baseMap,
        title: BASE_FELDER.nombre
    });
    
    baseMarker.addListener('click', function() {
        infoWindow.open(baseMap, baseMarker);
    });
}

// ============================================
// UTILIDADES DE MAPAS
// ============================================
function centerMapOnCoordinates(map, coordinates, zoom = 15) {
    if (map && validateCoordinates(coordinates)) {
        map.setCenter(coordinates);
        map.setZoom(zoom);
    }
}

function addMarkerToMap(map, coordinates, title, icon = null) {
    if (!map || !validateCoordinates(coordinates)) {
        return null;
    }
    
    const markerOptions = {
        position: coordinates,
        map: map,
        title: title
    };
    
    if (icon) {
        markerOptions.icon = icon;
    }
    
    return new google.maps.Marker(markerOptions);
}

// ============================================
// EVENTOS Y LIMPIEZA
// ============================================
function clearClienteMap() {
    if (clienteMarker) {
        clienteMarker.setMap(null);
        clienteMarker = null;
    }
    
    window.selectedCoordinates = null;
    
    const coordsInfo = document.getElementById('coordenadas-info');
    if (coordsInfo) {
        coordsInfo.style.display = 'none';
    }
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar mapa base cuando se muestre la tab de reparto
    const repartoTab = document.querySelector('[onclick="showTab(\'reparto\')"]');
    if (repartoTab) {
        repartoTab.addEventListener('click', function() {
            setTimeout(initBaseMap, 100);
        });
    }
    
    // Limpiar datos del mapa al resetear formulario
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('reset', function() {
            clearClienteMap();
            mapSelectorMode = false;
            
            const mapContainer = document.getElementById('map-container-cliente');
            const instructions = document.getElementById('map-selector-instructions');
            const button = document.querySelector('.btn-map');
            
            if (mapContainer) mapContainer.style.display = 'none';
            if (instructions) instructions.style.display = 'none';
            if (button) {
                button.textContent = '📍 Seleccionar en el Mapa';
                button.classList.remove('btn-secondary');
            }
        });
    }
});

// ============================================
// VERIFICACIÓN DE ZONA DE ENTREGA
// ============================================
function isInDeliveryZone(coordinates) {
    if (!validateCoordinates(coordinates)) {
        return false;
    }
    
    // Definir área de entrega alrededor de Paraná (aproximada)
    const center = BASE_FELDER.coordenadas;
    const maxDistance = 50; // 50km de radio
    
    const distance = calculateDistance(center, coordinates);
    return distance <= maxDistance;
}

function checkDeliveryZone(coordinates) {
    if (isInDeliveryZone(coordinates)) {
        const distance = calculateDistance(BASE_FELDER.coordenadas, coordinates);
        return {
            valid: true,
            distance: distance,
            message: `Cliente dentro del área de entrega (${distance.toFixed(1)} km de la base)`
        };
    } else {
        return {
            valid: false,
            distance: calculateDistance(BASE_FELDER.coordenadas, coordinates),
            message: 'Cliente fuera del área de entrega habitual'
        };
    }
}

// ============================================
// FUNCIONES ADICIONALES FALTANTES
// ============================================

// Función para mostrar/ocultar mapa base en reparto
function toggleBaseMap() {
    const mapContainer = document.getElementById('map-container-base');
    if (mapContainer) {
        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            initBaseMap();
        } else {
            mapContainer.style.display = 'none';
        }
    }
}

// Obtener coordenadas de una dirección
function getCoordinatesFromAddress(address, callback) {
    if (!geocoder) {
        console.warn('Geocoder no disponible');
        return;
    }
    
    geocoder.geocode({
        address: address,
        componentRestrictions: { country: 'AR' }
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
            const location = results[0].geometry.location;
            const coordinates = {
                lat: location.lat(),
                lng: location.lng()
            };
            callback(coordinates, results[0].formatted_address);
        } else {
            callback(null, null);
        }
    });
}

// Crear marcador personalizado
function createCustomMarker(map, position, title, color = 'red') {
    const colors = {
        red: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        green: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        blue: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        yellow: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    };
    
    return new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: {
            url: colors[color] || colors.red,
            scaledSize: new google.maps.Size(32, 32)
        }
    });
}

// Centrar mapa en múltiples puntos
function fitMapToMarkers(map, coordinates) {
    if (!coordinates || coordinates.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach(coord => {
        if (validateCoordinates(coord)) {
            bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
        }
    });
    
    map.fitBounds(bounds);
    
    // Ajustar zoom si solo hay un punto
    if (coordinates.length === 1) {
        map.setZoom(15);
    }
}

// Calcular tiempo estimado de viaje
function calculateTravelTime(from, to, callback) {
    if (!from || !to || typeof google === 'undefined') {
        callback(null);
        return;
    }
    
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
        origins: [from],
        destinations: [to],
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: true,
        unitSystem: google.maps.UnitSystem.METRIC
    }, function(response, status) {
        if (status === google.maps.DistanceMatrixStatus.OK) {
            const result = response.rows[0].elements[0];
            if (result.status === 'OK') {
                callback({
                    distance: result.distance.text,
                    duration: result.duration.text,
                    distanceValue: result.distance.value, // en metros
                    durationValue: result.duration.value  // en segundos
                });
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    });
}

// Validar zona de entrega específica de Paraná
function validateParanaDeliveryZone(coordinates) {
    if (!validateCoordinates(coordinates)) return false;
    
    // Definir límites aproximados de la zona de entrega
    const bounds = {
        north: -31.7000,
        south: -31.7700,
        east: -60.4500,
        west: -60.5700
    };
    
    const lat = coordinates.lat;
    const lng = coordinates.lng;
    
    return lat <= bounds.north && lat >= bounds.south && 
           lng <= bounds.east && lng >= bounds.west;
}

// Exponer funciones globalmente para uso en otros archivos
window.toggleMapSelector = toggleMapSelector;
window.initMaps = initMaps;
window.calculateDistance = calculateDistance;
window.validateCoordinates = validateCoordinates;
window.isInDeliveryZone = isInDeliveryZone;
window.checkDeliveryZone = checkDeliveryZone;
window.toggleBaseMap = toggleBaseMap;
window.getCoordinatesFromAddress = getCoordinatesFromAddress;
window.createCustomMarker = createCustomMarker;
window.fitMapToMarkers = fitMapToMarkers;
window.calculateTravelTime = calculateTravelTime;
window.validateParanaDeliveryZone = validateParanaDeliveryZone;

console.log('Google Maps integration cargado completamente');