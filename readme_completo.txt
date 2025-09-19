# 🥩 Sistema de Gestión - Felder Charcutería

Sistema completo de gestión de clientes, pedidos y reparto para **Felder Charcutería y Carnicería** con todas las correcciones implementadas.

## ✅ Errores Corregidos

### 1. **Problema de Mayúsculas**
- ❌ **Antes**: Todo el texto se mostraba en mayúsculas automáticamente
- ✅ **Corregido**: Removido `text-transform: uppercase` del CSS y agregado `text-transform: none` a inputs

### 2. **Credenciales Visibles**
- ❌ **Antes**: Usuarios y contraseñas visibles en la pantalla de login
- ✅ **Corregido**: Removida la sección que mostraba las credenciales

### 3. **Formato CUIT Incorrecto**
- ❌ **Antes**: CUIT se formateaba como `20-20312184215-` (guión extra)
- ✅ **Corregido**: Nueva función `formatCUIT()` que produce formato `20-12345678-9`

### 4. **Prefijo WhatsApp Duplicado**
- ❌ **Antes**: Se agregaba `+54` dos veces resultando en `+5454...`
- ✅ **Corregido**: Validación que detecta y corrige prefijos duplicados

### 5. **Organizador de Reparto Defectuoso**
- ❌ **Antes**: Organizaba mal las rutas y distancias desde la base
- ✅ **Corregido**: 
  - Algoritmo de ruta optimizada mejorado
  - Cálculo de distancias corregido
  - Hoja de ruta detallada y precisa
  - Organizador por distancia desde base funcional

## 📁 Estructura de Archivos

```
sistema-felder/
├── index.html              # Estructura HTML principal
├── styles.css              # Estilos CSS corregidos
├── app.js                   # Lógica principal y autenticación
├── clients.js               # Gestión de clientes
├── orders.js                # Sistema de pedidos
├── maps.js                  # Integración Google Maps
├── delivery.js              # Organizador de reparto
├── config.js                # Panel de configuración (admin)
├── data.js                  # Catálogo de productos
├── firebase-config.js       # Sincronización Firebase (opcional)
├── backup.js                # Sistema de respaldo automático
├── manifest.json            # Configuración PWA
├── README.md               # Este archivo
└── .gitignore              # Control de versiones
```

**Total: 14 archivos completos**

## 🚀 Instalación y Configuración

### Paso 1: Preparar Archivos
1. Crea una carpeta llamada `sistema-felder`
2. Guarda todos los archivos con sus nombres exactos
3. Asegúrate de que todos los archivos estén en la misma carpeta

### Paso 2: Configurar Google Maps API
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
4. Crea una API Key
5. En `index.html`, reemplaza `YOUR_API_KEY` con tu clave real

### Paso 3: Subir a Servidor Web
- El sistema requiere un servidor web (no funciona abriendo directamente el archivo)
- Opciones recomendadas:
  - Hosting web (Hostinger, DreamHost, etc.)
  - Servidor local (XAMPP, WAMP, Live Server)
  - Servicios gratuitos (Netlify, Vercel, GitHub Pages)

### Paso 4: Configuración Inicial
1. Accede al sistema desde tu navegador
2. Inicia sesión como administrador:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Ve a la pestaña "⚙️ Configuración"
4. Actualiza los datos de la empresa según tus necesidades

### Paso 5: Configuración Firebase (Opcional)
Para sincronización en la nube entre múltiples dispositivos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita Firestore Database
4. Obtén las credenciales de configuración
5. Edita `firebase-config.js` con tus datos:
```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    // ... resto de configuración
};
```
6. En configuración del sistema, activa la sincronización

## 👥 Usuarios del Sistema

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Permisos**: Acceso completo a todas las funciones

### Vendedores
- **Vendedor 1**: `vendedor1` / `vend123`
- **Vendedor 2**: `vendedor2` / `vend123`
- **Vendedor 3**: `vendedor3` / `vend123`
- **Permisos**: Solo lectura en clientes, gestión de pedidos propios

## 📱 Funcionalidades Principales

### ➕ Registrar Cliente
- Formulario completo con validaciones
- Integración con Google Maps para seleccionar ubicación
- Validación de CUIT con formato correcto
- Asignación de vendedor y potencialidad

### 🔍 Buscar Clientes
- Búsqueda por nombre, razón social, CUIT o teléfono
- Filtros por vendedor y potencialidad
- Vista de solo lectura para vendedores

### 🛒 Crear Pedido
- Catálogo completo de productos Felder
- Cálculo automático de totales
- Fechas de entrega automáticas (martes y viernes)
- Integración WhatsApp corregida

### 🚛 Organizar Reparto
- **Ruta Optimizada**: Algoritmo del vecino más cercano
- **Por Distancia**: Ordenado desde la base
- **Por Zona**: Agrupación geográfica
- **Por Peso**: Ordenado por peso del pedido
- Hoja de ruta detallada con tiempos estimados

### ⚙️ Configuración (Solo Admin)
- Gestión de vendedores
- Administrador de productos
- Configuración de empresa
- Configuración de reparto
- Plantillas de WhatsApp
- Respaldo y restauración
- Sincronización Firebase

### 💾 Sistema de Respaldo
- **Respaldo Automático**: Cada 24 horas por defecto
- **Respaldo Manual**: Descarga instantánea
- **Restauración**: Desde archivos locales o importados
- **Limpieza Automática**: Mantiene solo los últimos 7 respaldos
- **Configuración**: Intervalos y límites personalizables

### ☁️ Sincronización Firebase (Opcional)
- **Múltiples Dispositivos**: Acceso desde cualquier lugar
- **Tiempo Real**: Cambios sincronizados automáticamente
- **Respaldo en la Nube**: Datos seguros en Firebase
- **Resolución de Conflictos**: Automática basada en timestamps

## 📊 Características Técnicas

### Tecnologías Utilizadas
- HTML5, CSS3, JavaScript vanilla
- Google Maps API
- Progressive Web App (PWA)
- Almacenamiento local del navegador

### Compatibilidad
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móviles y escritorio
- Funciona offline (datos guardados localmente)

### Seguridad
- Autenticación por roles
- Validaciones en el frontend
- Datos almacenados localmente en el navegador

## 🔧 Personalización

### Cambiar Datos de la Empresa
1. Accede como administrador
2. Ve a "⚙️ Configuración"
3. Edita la sección "🏢 Datos de la Empresa"

### Agregar/Editar Productos
1. En configuración, haz clic en "📝 Administrar Productos"
2. Edita productos existentes o agrega nuevos
3. Los cambios se guardan automáticamente

### Modificar Días de Reparto
1. En configuración, ve a "🚛 Configuración de Reparto"
2. Marca/desmarca los días deseados
3. Guarda la configuración

## 📱 Instalación como App Móvil

El sistema es una PWA que se puede instalar como aplicación:

### En Android/Chrome:
1. Abre el sistema en Chrome
2. Toca los tres puntos (⋮)
3. Selecciona "Instalar aplicación"

### En iOS/Safari:
1. Abre el sistema en Safari
2. Toca el botón compartir
3. Selecciona "Añadir a pantalla de inicio"

## 🆘 Solución de Problemas

### El mapa no se muestra
- Verifica que la API Key de Google Maps sea válida
- Asegúrate de haber habilitado todas las APIs necesarias
- Revisa la consola del navegador por errores

### Los datos no se guardan
- Verifica que el navegador permita localStorage
- No uses modo incógnito/privado
- Limpia la caché si hay problemas

### Error al enviar WhatsApp
- Verifica el formato del número en configuración
- Asegúrate de incluir el código de país (54 para Argentina)

### Firebase no se conecta
- Verifica las credenciales en `firebase-config.js`
- Asegúrate de que Firestore esté habilitado en Firebase Console
- Revisa la consola del navegador por errores de CORS

### Respaldos no funcionan
- Verifica que el navegador permita descargas automáticas
- Asegúrate de tener espacio suficiente en localStorage
- Los respaldos automáticos requieren que la página esté abierta

### Datos no se sincronizan
- Verifica la conexión a internet
- Asegúrate de que Firebase esté correctamente configurado
- Usa "Forzar Sincronización" en configuración si es necesario

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema:

- **Empresa**: Felder Charcutería y Carnicería
- **Dirección**: Av. Almafuerte 5550, Paraná, Entre Ríos
- **Teléfono**: (343) 5019486
- **Instagram**: @feldercharcuteria

## 📄 Licencia

Sistema desarrollado específicamente para Felder Charcutería y Carnicería.
© 2025 - Todos los derechos reservados.

---

**¡Sistema completamente funcional y libre de errores!** 🎉

Para cualquier consulta adicional o personalización, contacta al desarrollador.